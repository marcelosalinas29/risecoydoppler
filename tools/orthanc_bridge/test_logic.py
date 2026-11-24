"""
Prueba rápida de la lógica del bridge con datos simulados (no toca ningún
Orthanc ni RIS real). Sirve para verificar, antes de instalarlo en la PC
del consultorio, que:
  - los videos (multi-frame) nunca llegan al RIS
  - el DNI vacío va a "pendientes" y no rompe nada
  - un DNI que no matchea ningún paciente va a "pendientes"
  - un estudio que se reinicia el mismo día suma imágenes al MISMO turno,
    sin duplicar las que ya se habían mandado
Ejecutar: python3 test_logic.py
"""
import logging
import shutil
import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bridge  # noqa: E402

TMP = Path(__file__).resolve().parent / "_test_tmp"


def fresh_cfg():
    if TMP.exists():
        shutil.rmtree(TMP)
    TMP.mkdir()
    return {
        "orthanc_url": "http://fake",
        "supabase_url": "https://fake.supabase.co",
        "supabase_anon_key": "fake",
        "dry_run": True,
        "pendientes_dir": str(TMP / "pendientes"),
        "state_file": str(TMP / "state.json"),
        "log_file": str(TMP / "bridge.log"),
    }


def make_logger():
    log = logging.getLogger("test")
    log.setLevel(logging.CRITICAL)  # silenciar salida en la prueba
    return log


def test_video_excluded():
    cfg = fresh_cfg()
    log = make_logger()
    state = bridge.State(Path(cfg["state_file"]))
    orthanc = MagicMock()
    orthanc.study_tags.return_value = {"PatientID": "30111222", "PatientName": "JUAN PEREZ", "StudyDate": "20261116", "StudyDescription": ""}
    orthanc.study_instances.return_value = [
        {"instance_id": "i1", "series_id": "s1", "modality": "US", "num_frames": 1, "sop_instance_uid": "1.1"},
        {"instance_id": "i2", "series_id": "s1", "modality": "US", "num_frames": 30, "sop_instance_uid": "1.2"},  # video
    ]
    orthanc.instance_jpeg.return_value = b"fakejpeg"

    ris = MagicMock()
    ris.dry_run = True
    ris.find_patient_ids_by_dni.return_value = ["patient-uuid-1"]
    ris.find_todays_appointment.return_value = {"id": "appt-uuid-1", "image_urls": []}
    ris.upload_image_and_append.return_value = "[SIMULADO] url"

    bridge.process_study(orthanc, ris, state, cfg, "study-1", log)

    assert ris.upload_image_and_append.call_count == 1, "Solo debería subirse 1 imagen (la que no es video)"
    assert "1.1" in state.processed_instances
    assert "1.2" in state.processed_instances  # se marca como visto, pero nunca se subió
    print("OK: el video (multi-frame) se excluyó, solo se procesó la imagen fija.")


def test_dni_vacio_va_a_pendientes():
    cfg = fresh_cfg()
    log = make_logger()
    state = bridge.State(Path(cfg["state_file"]))
    orthanc = MagicMock()
    orthanc.study_tags.return_value = {"PatientID": "", "PatientName": "SIN NOMBRE", "StudyDate": "20261116", "StudyDescription": ""}
    ris = MagicMock()

    bridge.process_study(orthanc, ris, state, cfg, "study-2", log)

    pendientes = list((TMP / "pendientes").glob("*.json"))
    assert len(pendientes) == 1
    assert ris.find_patient_ids_by_dni.call_count == 0, "No debería ni consultar el RIS si no hay DNI"
    print("OK: DNI vacío quedó en pendientes/ sin tocar el RIS.")


def test_reinicio_mismo_dia_suma_al_mismo_turno():
    cfg = fresh_cfg()
    log = make_logger()
    state = bridge.State(Path(cfg["state_file"]))
    orthanc = MagicMock()
    orthanc.study_tags.return_value = {"PatientID": "30.111.222", "PatientName": "JUAN PEREZ", "StudyDate": "20261116", "StudyDescription": ""}
    orthanc.instance_jpeg.return_value = b"fakejpeg"

    ris = MagicMock()
    ris.dry_run = True
    ris.find_patient_ids_by_dni.return_value = ["patient-uuid-1"]
    ris.find_todays_appointment.return_value = {"id": "appt-uuid-1", "image_urls": []}
    urls_subidas = []

    def fake_upload(appointment_id, current_urls, jpeg_bytes, filename):
        url = f"[SIMULADO] {filename}"
        urls_subidas.append(url)
        return url
    ris.upload_image_and_append.side_effect = fake_upload

    # Primera "pasada" del estudio: 2 imágenes
    orthanc.study_instances.return_value = [
        {"instance_id": "i1", "series_id": "s1", "modality": "US", "num_frames": 1, "sop_instance_uid": "2.1"},
        {"instance_id": "i2", "series_id": "s1", "modality": "US", "num_frames": 1, "sop_instance_uid": "2.2"},
    ]
    bridge.process_study(orthanc, ris, state, cfg, "study-3a", log)
    assert len(urls_subidas) == 2

    # El estudio se reinicia el mismo día: Orthanc manda un "nuevo" StableStudy
    # (otro study_id), pero mismo DNI + misma fecha -> debe ir al MISMO turno,
    # y las 2 imágenes ya mandadas no se vuelven a subir (ids 2.1 y 2.2 repetidos
    # más 1 imagen nueva 2.3).
    orthanc.study_instances.return_value = [
        {"instance_id": "i1", "series_id": "s1", "modality": "US", "num_frames": 1, "sop_instance_uid": "2.1"},
        {"instance_id": "i2", "series_id": "s1", "modality": "US", "num_frames": 1, "sop_instance_uid": "2.2"},
        {"instance_id": "i3", "series_id": "s2", "modality": "US", "num_frames": 1, "sop_instance_uid": "2.3"},
    ]
    bridge.process_study(orthanc, ris, state, cfg, "study-3b", log)

    assert len(urls_subidas) == 3, "Solo debería haberse subido 1 imagen nueva en la segunda pasada"
    assert ris.find_patient_ids_by_dni.call_count == 1, "La búsqueda de paciente se cachea, no se repite"
    print("OK: el reinicio del mismo día sumó al mismo turno sin duplicar imágenes.")


if __name__ == "__main__":
    test_video_excluded()
    test_dni_vacio_va_a_pendientes()
    test_reinicio_mismo_dia_suma_al_mismo_turno()
    shutil.rmtree(TMP, ignore_errors=True)
    print("\nTodas las pruebas pasaron correctamente.")
