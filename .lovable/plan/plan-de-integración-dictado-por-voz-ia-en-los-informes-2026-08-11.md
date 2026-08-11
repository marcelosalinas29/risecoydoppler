# Plan de integración: dictado por voz + IA en los informes

Ya tengo el detalle técnico real del otro sistema (Edge Function `process-voice`,
`dictation.ts`, `subsections.ts`, post-procesado y comandos de voz). Este plan lo
adapta a esta app **sin tocar** guardado, PDF, QR, WhatsApp, historial ni permisos.

## Diferencia clave a resolver

| reporIAassistant | esta app |
| --- | --- |
| Estado canónico: `ReportSection[]` texto plano con subsecciones declaradas | Estado canónico: **un solo string HTML** de TipTap (`report`) |
| Plantillas con `sec(label, textoNormal)` | `REPORT_TEMPLATES`: texto plano, una línea por apartado (`Hígado: ...`) |
| Wizard de 4 pasos (institución/paciente/estudio/hallazgos) | paciente y estudio ya vienen de la cita |

El otro sistema advierte: *editar el HTML de TipTap y parsearlo de vuelta rompe el
mapeo por unidades*. Solución acordada en este plan: **cada línea de la plantilla
es una unidad**. Eso encaja perfecto con `REPORT_TEMPLATES` de acá (una línea =
un apartado anatómico), así que las unidades se derivan sin migrar plantillas.

## Arquitectura propuesta

```text
Micrófono (Web Speech API, es-AR)
  -> normalizePunctuation / appendChunk        [src/lib/dictation.ts]  (copiado tal cual)
  -> HTML del editor  ->  líneas de texto      [src/lib/reportUnits.ts] (nuevo, puente TipTap)
  -> invoke("process-voice", { mode: "findings_v2", unitSections })
  -> Gemini 2.5 Flash + tool calling (JSON estricto)
  -> applyUnitUpdates                          [src/lib/subsections.ts] (adaptado)
  -> líneas -> HTML  ->  setReport(...)         (mismo string que hoy se guarda)
```

## Fases

### Fase 1 — Backend: Edge Function `process-voice`

- Se copia tal cual, pero **solo con los modos que esta app necesita**:
  `findings_v2` (dictado de hallazgos sobre la plantilla) y `correction`
  (corregir dictando un bloque puntual). Se descartan `patient` y
  `study_selection`: esos datos ya están en la cita.
- Modelo `google/gemini-2.5-flash` vía Lovable AI Gateway con `LOVABLE_API_KEY`
  (ya disponible). Mapeo de 429 / 402 a mensajes en español.
- `verify_jwt = true`: solo usuarios logueados. En el cliente el panel se muestra
  solo si `!isReadOnly` (doctores), igual que el resto del editor.

### Fase 2 — Librerías puras (sin UI)

- `src/lib/dictation.ts`: copiado tal cual (normalización de puntuación,
  protecciones clínicas "coma diabético"/"en coma"/"punto de ...", `appendChunk`).
- `src/hooks/useSpeechRecognition.ts`: copiado tal cual (es-AR, `continuous`,
  permiso explícito con `getUserMedia`, reinicio automático, errores tipificados).
- `src/lib/subsections.ts`: adaptado a un modelo mínimo
  `{ title, content }` en vez de `ReportSection` con `subsections`. Mantiene
  `getSectionUnits`, `applyUnitUpdates` y `buildUnitsPayload` con la misma lógica
  (reemplazo quirúrgico, orden y separadores intactos).
- `src/lib/reportUnits.ts` (nuevo, el puente): HTML del editor → bloques de texto
  plano y vuelta. Un `<p>` = una línea = una unidad; los `<strong>` de encabezado
  se preservan al reconstruir. Cubierto con tests unitarios (ida y vuelta).

### Fase 3 — UI de dictado (aditiva)

- `src/components/DictationPanel.tsx`: botón 🎤 en la tarjeta "Informe", solo para
  doctores. Muestra transcripción en vivo (interim) + texto final editable antes
  de mandarlo a la IA. Si el navegador no soporta voz, el panel avisa y el resto
  sigue igual (Chrome ok, Firefox parcial).
- `src/components/AIAssistPanel.tsx`: botón "Aplicar con IA". Llama a
  `process-voice`, aplica `unitUpdates` y muestra **vista previa con diff simple**
  (unidades modificadas resaltadas) + botones "Insertar en el informe" /
  "Descartar". Nada se escribe en el editor sin confirmación del médico.
- Panel de patologías: por ahora **no** se agrega (acá no hay pantalla lateral);
  se ignora `pathologies[]` de la respuesta sin romper nada.

### Fase 4 — Integración en `AppointmentPage.tsx`

- Se agrega una fila de botones junto a "Plantillas": `🎤 Dictar` y `✨ IA`,
  condicionados a `!isReadOnly`.
- Al insertar, el resultado va a `setReport(html)` y queda en modo edición: el
  médico revisa y guarda con el botón actual. **Ninguna llamada nueva a la base**:
  se reutiliza `handleSaveReport` sin cambios.
- Si el informe está vacío, el flujo sugerido es: elegir plantilla → dictar → IA.
  El dictado sobre informe vacío también funciona (la IA agrega como `append`).

### Fase 5 — Verificación antes de dar por cerrado

- Test unitario del puente HTML ↔ unidades y de `applyUnitUpdates`.
- Prueba real de la Edge Function con un dictado de ejemplo sobre la plantilla de
  Ecografía Abdominal, verificando que "se ve hígado esteatósico" reemplace la
  línea de `Hígado:` y no la duplique.
- Verificación de que el PDF sale igual que hoy (mismo HTML de entrada).

## Riesgos y decisiones

1. **Costo**: la transcripción es gratis (navegador); solo consume créditos cada
   "Aplicar con IA". Se puede limitar mostrando el consumo, o dejarlo libre.
2. **Chrome vs Firefox**: en Firefox el reconocimiento puede no estar disponible;
   el botón se deshabilita con un aviso claro, sin afectar el resto.
3. **Sin offline** (ya acordado): dictado e IA requieren internet.
4. **Reversibilidad**: todo lo nuevo son archivos nuevos + una fila de botones.
   Quitar esa fila deja el sistema exactamente como hoy.

## Fuera de alcance

- Pasos de institución/paciente/estudio por voz, panel de patologías,
  migración de plantillas a subsecciones declaradas, cambios en PDF/QR/WhatsApp.
