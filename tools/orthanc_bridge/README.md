# Bridge Orthanc → RIS (DMR / RiseCoyDoppler)

Script que vigila Orthanc y manda automáticamente las imágenes fijas de cada
estudio al turno correspondiente en el RIS, buscando el paciente por DNI.
Los videos / modo cine nunca se tocan: quedan solo en K-PACS y Orthanc.

## Reglas que sigue (pedidas por Marce)

1. Matchea por DNI (tag "ID" del ecógrafo) + la fecha del estudio, así que
   reconoce el turno de **hoy**, no uno viejo del mismo paciente.
2. Si falta el DNI, no coincide con nadie, hay más de un paciente con ese
   DNI, o el paciente no tiene turno cargado para esa fecha: **no adivina**.
   Queda anotado en la carpeta `pendientes/` para revisar a mano.
3. Si un estudio se corta y se reinicia el mismo día, las imágenes nuevas se
   suman al **mismo** turno/informe de ese día (nunca duplica las que ya se
   habían mandado). Marce después decide en el RIS si deja todas o borra
   alguna.
4. Los videos (instancias multi-frame / modo cine) se detectan y se excluyen
   siempre — jamás llegan al RIS.

## Lo único que falta para que escriba de verdad en el RIS

Ahora mismo el script está en **modo simulacro** (`dry_run: true`): hace
todo el trabajo de detectar, filtrar y matchear, pero en vez de escribir en
el RIS real, deja anotado en `logs/bridge.log` exactamente qué habría hecho.
Así podés revisar a la mañana sin ningún riesgo.

Para que empiece a escribir de verdad hace falta UNA credencial que yo no
tengo autorización para crear sola. Son dos caminos, cualquiera sirve:

**Opción A (recomendada) — una cuenta del RIS para el bridge:**
Crear un usuario común del RIS (por ejemplo `bridge@dmrimagenes.local`) con
rol "secretaria" (el mismo nivel de permiso que ya tiene cualquier
secretaria para cargar imágenes), y poner su email/contraseña en
`config.json` (`bridge_email` / `bridge_password`). Es lo más seguro: si
algún día hay que desactivar el bridge, simplemente se borra ese usuario.

**Opción B — la llave maestra del proyecto (service role key):**
Es la credencial "todopoderosa" de Supabase, sin restricciones. Más directa
pero más sensible — se consigue desde el panel de Supabase del proyecto
(algo a lo que, según lo que hablamos, no tenés acceso directo hoy porque es
nativo de Lovable Cloud). No la recomiendo salvo que sea la única opción
práctica.

Decime cuál preferís cuando te despiertes y lo configuro.

## Instalación en la PC del consultorio

1. Instalar Python 3.9 o más nuevo (de python.org).
2. Copiar toda esta carpeta a la PC.
3. Abrir una consola en la carpeta y correr:
   ```
   pip install requests
   copy config.example.json config.json
   ```
4. Completar `config.json` con la credencial elegida (ver arriba). Mientras
   quede vacío, corre en modo simulacro igual.
5. Probar una sola vuelta:
   ```
   python bridge.py --once
   ```
6. Si todo se ve bien en `logs/bridge.log`, dejarlo corriendo:
   ```
   python bridge.py
   ```
   (Para que arranque solo con la PC, se puede armar una tarea programada de
   Windows — lo puedo dejar armado cuando confirmes que la lógica funciona
   bien en las primeras pruebas.)

## Cómo probar que la lógica es correcta (sin tocar nada real)

```
python test_logic.py
```
Corre pruebas automáticas con datos inventados que verifican las 4 reglas
de arriba. No se conecta a ningún Orthanc ni RIS real.

## Archivos

- `bridge.py` — el script principal.
- `config.example.json` — plantilla de configuración (copiar a `config.json`).
- `test_logic.py` — pruebas automáticas de la lógica.
- `logs/bridge.log` — registro de todo lo que hace (se crea solo).
- `pendientes/` — casos que necesitan revisión manual (se crea solo).
- `state.json` — memoria del script para no duplicar imágenes (se crea solo).
