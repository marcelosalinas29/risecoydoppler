#!/usr/bin/env python3
"""
Bridge Orthanc -> RIS (RiseCoyDoppler / DMR)
=============================================

Qué hace:
  1. Vigila Orthanc (servidor DICOM) buscando estudios "estables" (que ya
     terminaron de recibirse).
  2. De cada estudio, separa las imágenes fijas de los videos / modo cine
     (multi-frame). Los videos NUNCA se tocan: quedan solo en K-PACS y Orthanc.
  3. Toma el DNI (tag PatientID del ecógrafo) y la fecha del estudio, y busca
     en el RIS el turno de ESE paciente para ESE día (no turnos anteriores).
  4. Si lo encuentra: sube las imágenes fijas nuevas a ese turno (si el
     estudio se reinicia el mismo día, se van sumando al mismo turno/informe,
     nunca se duplican las que ya se subieron).
  5. Si no hay DNI cargado, o no coincide con ningún paciente, o no hay un
     turno de hoy para ese paciente: NO ADIVINA. Lo deja registrado en la
     carpeta "pendientes/" para revisión manual.

Modo simulacro (dry_run=true en config.json, que es el valor por defecto):
  Hace todos los pasos de arriba igual, pero en vez de escribir en el RIS
  real, deja anotado en logs/bridge.log exactamente qué habría hecho. Así se
  puede dejar corriendo y revisar a la mañana sin ningún riesgo.

Para que escriba de verdad en el RIS hace falta completar en config.json
UNA de estas dos opciones (ver README.md):
  - bridge_email / bridge_password: una cuenta del RIS con rol secretaria.
  - supabase_service_role_key: la llave maestra del proyecto (más directa,
    pero es una credencial sensible - hay que decidir cómo guardarla).

Requisitos: Python 3.9+, librería "requests" (pip install requests).
Uso:
  python bridge.py              # corre en loop continuo
  python bridge.py --once       # procesa una sola vuelta y termina (para probar)
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from datetime import datetime, date
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent


# --------------------------------------------------------------------------
# Config y estado
# --------------------------------------------------------------------------

def load_config(path: Path) -> dict:
    if not path.exists():
        example = BASE_DIR / "config.example.json"
        raise SystemExit(
            f"No existe {path}. Copiá {example.name} a config.json y completá "
            f"los datos (ver README.md)."
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class State:
    """Memoria local persistente del bridge: qué imágenes ya se mandaron,
    y a qué turno del RIS quedó asociado cada (dni, fecha) de estudio.
    Esto es lo que permite que un estudio que se corta y se reinicia el
    mismo día siga sumando al MISMO turno, sin duplicar imágenes."""

    def __init__(self, path: Path):
        self.path = path
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = {}
        self.processed_instances = set(data.get("processed_instances", []))
        self.processed_changes_seq = data.get("processed_changes_seq", 0)
        # key "dni|fecha" -> appointment_id
        self.dni_date_to_appointment = data.get("dni_date_to_appointment", {})

    def save(self):
        data = {
            "processed_instances": sorted(self.processed_instances),
            "processed_changes_seq": self.processed_changes_seq,
            "dni_date_to_appointment": self.dni_date_to_appointment,
        }
        tmp = self.path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        tmp.replace(self.path)


# --------------------------------------------------------------------------
# Orthanc
# --------------------------------------------------------------------------

class Orthanc:
    def __init__(self, cfg: dict):
        self.base = cfg["orthanc_url"].rstrip("/")
        self.auth = None
        if cfg.get("orthanc_username"):
            self.auth = (cfg["orthanc_username"], cfg["orthanc_password"])

    def _get(self, path: str, **kwargs):
        r = requests.get(f"{self.base}{path}", auth=self.auth, timeout=30, **kwargs)
        r.raise_for_status()
        return r

    def changes(self, since: int, limit: int = 100):
        r = self._get("/changes", params={"since": since, "limit": limit})
        return r.json()

    def study_info(self, study_id: str) -> dict:
        return self._get(f"/studies/{study_id}").json()

    def study_tags(self, study_id: str) -> dict:
        """Tags simplificados a nivel estudio/paciente."""
        info = self.study_info(study_id)
        main = info.get("MainDicomTags", {})
        patient = info.get("PatientMainDicomTags", {})
        return {
            "PatientID": patient.get("PatientID", ""),
            "PatientName": patient.get("PatientName", ""),
            "StudyDate": main.get("StudyDate", ""),
            "StudyDescription": main.get("StudyDescription", ""),
        }

    def study_instances(self, study_id: str) -> list:
        """Devuelve [(instance_id, series_id, num_frames)] para todas las
        instancias del estudio, recorriendo sus series."""
        info = self.study_info(study_id)
        result = []
        for series_id in info.get("Series", []):
            series = self._get(f"/series/{series_id}").json()
            modality = series.get("MainDicomTags", {}).get("Modality", "")
            for instance_id in series.get("Instances", []):
                tags = self._get(f"/instances/{instance_id}/tags", params={"simplify": "true"}).json()
                try:
                    num_frames = int(tags.get("NumberOfFrames", "1") or "1")
                except (TypeError, ValueError):
                    num_frames = 1
                result.append({
                    "instance_id": instance_id,
                    "series_id": series_id,
                    "modality": modality,
                    "num_frames": num_frames,
                    "sop_instance_uid": tags.get("SOPInstanceUID", instance_id),
                })
        return result

    def instance_jpeg(self, instance_id: str) -> bytes:
        """Imagen renderizada en JPEG (ya aplica el windowing correcto)."""
        r = self._get(f"/instances/{instance_id}/rendered", params={"quality": 90})
        return r.content


# --------------------------------------------------------------------------
# RIS (Supabase)
# --------------------------------------------------------------------------

def normalize_dni(raw: str) -> str:
    """Deja solo dígitos, igual que la función find_patient_ids_by_dni del RIS
    (regexp_replace(dni, '\\D', '', 'g')), para que el matching sea idéntico
    al que ya usa la propia app."""
    return re.sub(r"\D", "", raw or "")


def orthanc_date_to_iso(d: str) -> str:
    """'20261116' -> '2026-11-16'. Si viene vacío, usa hoy."""
    if d and len(d) == 8:
        return f"{d[0:4]}-{d[4:6]}-{d[6:8]}"
    return date.today().isoformat()


class RisClient:
    """Cliente contra el RIS (Supabase REST + Auth). Si no hay credenciales
    de escritura configuradas, queda en modo solo-lectura/simulacro."""

    def __init__(self, cfg: dict, log: logging.Logger):
        self.log = log
        self.url = cfg["supabase_url"].rstrip("/")
        self.anon_key = cfg["supabase_anon_key"]
        self.dry_run = bool(cfg.get("dry_run", True))
        self.service_key = cfg.get("supabase_service_role_key") or None
        self.bridge_email = cfg.get("bridge_email") or None
        self.bridge_password = cfg.get("bridge_password") or None
        self._access_token = None

        if self.service_key:
            self.write_key = self.service_key
            self.can_write = True
        elif self.bridge_email and self.bridge_password:
            self.write_key = None  # se resuelve en login()
            self.can_write = True
        else:
            self.write_key = None
            self.can_write = False

        if not self.can_write and not self.dry_run:
            self.log.warning(
                "No hay credenciales de escritura configuradas; forzando modo "
                "simulacro (dry_run) aunque config.json diga lo contrario."
            )
            self.dry_run = True

    # -- auth ---------------------------------------------------------
    def login(self):
        if self.service_key or self._access_token:
            return
        if not (self.bridge_email and self.bridge_password):
            return
        r = requests.post(
            f"{self.url}/auth/v1/token",
            params={"grant_type": "password"},
            json={"email": self.bridge_email, "password": self.bridge_password},
            headers={"apikey": self.anon_key},
            timeout=30,
        )
        r.raise_for_status()
        self._access_token = r.json()["access_token"]

    def _headers(self, prefer: str = None) -> dict:
        token = self.write_key if self.service_key else (self._access_token or self.anon_key)
        h = {
            "apikey": self.anon_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        if prefer:
            h["Prefer"] = prefer
        return h

    # -- lecturas (siempre reales, incluso en dry_run: son solo SELECT) --
    def find_patient_ids_by_dni(self, dni: str) -> list:
        r = requests.post(
            f"{self.url}/rest/v1/rpc/find_patient_ids_by_dni",
            headers=self._headers(),
            json={"_dni": dni},
            timeout=30,
        )
        if r.status_code >= 400:
            self.log.error(f"find_patient_ids_by_dni falló ({r.status_code}): {r.text}")
            return []
        return [row["id"] for row in r.json()]

    def find_todays_appointment(self, patient_id: str, study_date_iso: str) -> dict | None:
        r = requests.get(
            f"{self.url}/rest/v1/appointments",
            headers=self._headers(),
            params={
                "patient_id": f"eq.{patient_id}",
                "date": f"eq.{study_date_iso}",
                "status": "not.in.(cancelled,no-show)",
                "select": "id,image_urls,status",
                "order": "created_at.desc",
            },
            timeout=30,
        )
        if r.status_code >= 400:
            self.log.error(f"find_todays_appointment falló ({r.status_code}): {r.text}")
            return None
        rows = r.json()
        return rows[0] if rows else None

    # -- escrituras (no-op real si dry_run) ---------------------------
    def upload_image_and_append(self, appointment_id: str, current_urls: list, jpeg_bytes: bytes, filename: str) -> str:
        """Sube el JPEG al bucket estudios_imagenes con el mismo esquema de
        nombre que usa la propia app ({appointment_id}/{timestamp}_{random}.jpg),
        genera una URL firmada de larga duración, y agrega esa URL al array
        image_urls del turno. Devuelve la URL firmada."""
        storage_path = f"{appointment_id}/{filename}"

        if self.dry_run:
            fake_url = f"[SIMULADO] estudios_imagenes/{storage_path}"
            self.log.info(f"SIMULACRO: subiría imagen a turno {appointment_id} -> {storage_path}")
            return fake_url

        self.login()

        up = requests.post(
            f"{self.url}/storage/v1/object/estudios_imagenes/{storage_path}",
            headers={**self._headers(), "Content-Type": "image/jpeg"},
            data=jpeg_bytes,
            timeout=60,
        )
        if up.status_code >= 400:
            raise RuntimeError(f"Error subiendo a Storage ({up.status_code}): {up.text}")

        sign = requests.post(
            f"{self.url}/storage/v1/object/sign/estudios_imagenes/{storage_path}",
            headers=self._headers(),
            json={"expiresIn": 60 * 60 * 24 * 365 * 10},
            timeout=30,
        )
        if sign.status_code >= 400:
            raise RuntimeError(f"Error firmando URL ({sign.status_code}): {sign.text}")
        signed_path = sign.json()["signedURL"]
        full_url = f"{self.url}/storage/v1{signed_path}"

        new_urls = current_urls + [full_url]
        upd = requests.patch(
            f"{self.url}/rest/v1/appointments",
            headers=self._headers(prefer="return=minimal"),
            params={"id": f"eq.{appointment_id}"},
            json={"image_urls": new_urls},
            timeout=30,
        )
        if upd.status_code >= 400:
            raise RuntimeError(f"Error actualizando turno ({upd.status_code}): {upd.text}")

        return full_url


# --------------------------------------------------------------------------
# Lógica principal
# --------------------------------------------------------------------------

def write_pendiente(pendientes_dir: Path, motivo: str, datos: dict, log: logging.Logger):
    pendientes_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    fname = pendientes_dir / f"{ts}.json"
    payload = {"motivo": motivo, "cuando": datetime.now().isoformat(), **datos}
    with open(fname, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    log.warning(f"PENDIENTE DE REVISIÓN ({motivo}): {datos} -> {fname.name}")


def process_study(orthanc: Orthanc, ris: RisClient, state: State, cfg: dict,
                   study_id: str, log: logging.Logger):
    tags = orthanc.study_tags(study_id)
    dni_raw = tags["PatientID"]
    dni = normalize_dni(dni_raw)
    study_date_iso = orthanc_date_to_iso(tags["StudyDate"])
    paciente_desc = f"{tags['PatientName']} (ID ecógrafo: '{dni_raw}')"

    if not dni:
        write_pendiente(Path(cfg["pendientes_dir"]), "sin_dni", {
            "study_id": study_id, "paciente": paciente_desc, "fecha_estudio": study_date_iso,
            "accion_requerida": "Cargar el DNI en el ID del ecógrafo y reenviar, o asociar manualmente en el RIS.",
        }, log)
        return

    cache_key = f"{dni}|{study_date_iso}"
    cached = state.dni_date_to_appointment.get(cache_key)
    appointment_id = cached["appointment_id"] if cached else None
    patient_id = cached["patient_id"] if cached else None
    current_urls = []

    if not appointment_id:
        patient_ids = ris.find_patient_ids_by_dni(dni)
        if len(patient_ids) == 0:
            write_pendiente(Path(cfg["pendientes_dir"]), "dni_no_encontrado", {
                "study_id": study_id, "dni": dni, "paciente": paciente_desc, "fecha_estudio": study_date_iso,
                "accion_requerida": "No hay ningún paciente con ese DNI en el RIS. Verificar carga o crear paciente.",
            }, log)
            return
        if len(patient_ids) > 1:
            write_pendiente(Path(cfg["pendientes_dir"]), "dni_ambiguo", {
                "study_id": study_id, "dni": dni, "paciente": paciente_desc, "fecha_estudio": study_date_iso,
                "candidatos": patient_ids,
                "accion_requerida": "Hay más de un paciente con ese DNI en el RIS. Resolver manualmente.",
            }, log)
            return

        appt = ris.find_todays_appointment(patient_ids[0], study_date_iso)
        if not appt:
            write_pendiente(Path(cfg["pendientes_dir"]), "sin_turno_hoy", {
                "study_id": study_id, "dni": dni, "paciente": paciente_desc, "fecha_estudio": study_date_iso,
                "accion_requerida": "El paciente existe pero no tiene un turno cargado para esa fecha.",
            }, log)
            return

        appointment_id = appt["id"]
        patient_id = patient_ids[0]
        current_urls = appt.get("image_urls") or []
        state.dni_date_to_appointment[cache_key] = {"appointment_id": appointment_id, "patient_id": patient_id}
        state.save()
        log.info(f"Turno encontrado para {paciente_desc} ({study_date_iso}): {appointment_id}")
    else:
        # Releer urls actuales por si hubo cambios manuales en el RIS mientras tanto
        # (por ejemplo si Marce borró alguna imagen desde la app).
        appt = ris.find_todays_appointment(patient_id, study_date_iso)
        current_urls = (appt or {}).get("image_urls", []) if appt else []

    instances = orthanc.study_instances(study_id)
    nuevas = 0
    for inst in instances:
        sop_uid = inst["sop_instance_uid"]
        if sop_uid in state.processed_instances:
            continue
        if inst["num_frames"] > 1:
            log.info(f"Instancia {sop_uid} es multi-frame (video/cine, {inst['num_frames']} frames) -> "
                     f"se queda solo en K-PACS/Orthanc, NO va al RIS.")
            state.processed_instances.add(sop_uid)
            continue

        try:
            jpeg = orthanc.instance_jpeg(inst["instance_id"])
        except Exception as e:
            log.error(f"No se pudo renderizar la instancia {sop_uid}: {e}")
            continue

        filename = f"{int(time.time() * 1000)}_{sop_uid[-12:].replace('.', '')}.jpg"
        try:
            url = ris.upload_image_and_append(appointment_id, current_urls, jpeg, filename)
            current_urls = current_urls + [url]
            state.processed_instances.add(sop_uid)
            nuevas += 1
        except Exception as e:
            log.error(f"No se pudo subir/asociar la imagen {sop_uid} al turno {appointment_id}: {e}")

    if nuevas:
        state.save()
        log.info(f"{nuevas} imagen(es) nueva(s) asociada(s) al turno {appointment_id} ({paciente_desc}).")


def run_once(cfg: dict, state: State, log: logging.Logger):
    orthanc = Orthanc(cfg)
    ris = RisClient(cfg, log)
    changes = orthanc.changes(since=state.processed_changes_seq, limit=200)
    for change in changes.get("Changes", []):
        if change.get("ChangeType") == "StableStudy":
            study_id = change["ID"]
            log.info(f"Estudio estable detectado: {study_id}")
            try:
                process_study(orthanc, ris, state, cfg, study_id, log)
            except Exception as e:
                log.exception(f"Error procesando estudio {study_id}: {e}")
        state.processed_changes_seq = change["Seq"]
    state.save()
    return changes.get("Done", True)


def setup_logging(cfg: dict) -> logging.Logger:
    log_path = BASE_DIR / cfg["log_file"]
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("bridge")
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    logger.addHandler(sh)
    return logger


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Procesa una sola vuelta y termina")
    parser.add_argument("--config", default=str(BASE_DIR / "config.json"))
    args = parser.parse_args()

    cfg = load_config(Path(args.config))
    log = setup_logging(cfg)
    state = State(BASE_DIR / cfg["state_file"])

    if cfg.get("dry_run", True):
        log.info("=== MODO SIMULACRO: no se va a escribir nada real en el RIS ===")
    else:
        log.info("=== MODO REAL: el script va a escribir imágenes en el RIS ===")

    if args.once:
        run_once(cfg, state, log)
        return

    log.info("Bridge Orthanc -> RIS iniciado. Esperando estudios nuevos...")
    while True:
        try:
            run_once(cfg, state, log)
        except Exception as e:
            log.exception(f"Error en el ciclo principal: {e}")
        time.sleep(cfg.get("poll_interval_seconds", 20))


if __name__ == "__main__":
    main()
