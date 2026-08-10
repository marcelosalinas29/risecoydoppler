# Plan de integración: Dictado por voz + Asistencia IA en los informes

## Objetivo

Llevar a esta app la parte que sirve de **reporIAassistant**: dictar el informe
por voz y que una IA lo estructure/redacte, pero sin replicar los pasos de
"institución" y "paciente" (acá ya están cargados en la cita). El resultado
final sigue siendo el mismo HTML que hoy escribe el editor y que ya se guarda y
convierte a PDF. **No se toca** la lógica de guardado, PDF, QR, WhatsApp ni el
historial.

## Principio de estabilidad

La app se usa en un consultorio real. Por eso la integración es **aditiva y
aislada**: se agregan componentes nuevos junto al editor y un Edge Function
nuevo. El flujo actual de escribir a mano y guardar queda intacto. Todo lo
nuevo se puede ocultar/desactivar sin romper nada.

## Arquitectura de lo que se reutiliza de reporIAassistant

- **Dictado por voz**: Web Speech API del navegador (Chrome, y Firefox en
  parte). Requiere internet (el motor de voz de Chrome es de servidor), igual
  que el resto de la app.
- **Estructuración por IA**: un Edge Function de Lovable Cloud (Lovable AI
  Gateway) que recibe el texto dictado y devuelve el informe ordenado en
  secciones/correcto. Es el equivalente a la lógica de `subsections.ts` +
  dictation del otro sistema, adaptada a esta base.
- **Adaptador texto → HTML**: el otro sistema trabaja con texto plano; acá el
  editor usa HTML (TipTap). Se agrega un adaptador que convierte la salida de
  la IA en HTML compatible con el editor (párrafos `<p>`).

## Fases

### Fase 1 — Edge Function de IA (backend)

- Nueva función `estructurar-informe` en Supabase Functions (Lovable Cloud).
- Entrada: texto dictado en crudo + datos de contexto (tipo de estudio,
  plantilla de referencia si la hay).
- Usa Lovable AI Gateway con `LOVABLE_API_KEY` (ya disponible, no hay que
  crear secretos).
- Salida: informe estructurado en HTML simple (`<p>`/listas) listo para el
  editor, en el tono médico correcto y con ortografía corregida.
- Protegida con validación de JWT (solo doctores la pueden llamar).

### Fase 2 — Dictado por voz (Web Speech API)

- Componente nuevo `DictationPanel.tsx`: botón de micrófono junto al editor.
- Al presionar, captura voz y muestra el texto reconocido en vivo (transcripción
  parcial). Al detener, deja el texto transcrito en un panel editable.
- El dictado se comporta igual que en el otro sistema (lenguaje `es-AR`,
  reinicio automático de la sesión, manejo de errores si el navegador no
  soporta voz).

### Fase 3 — Asistencia IA

- Componente nuevo `AIAssistPanel.tsx`: botón "Estructurar con IA".
- Toma el texto dictado (o el contenido actual del editor) y llama al Edge
  Function de la Fase 1.
- Muestra el resultado propuesto y un botón "Insertar en el informe" que
  aplica el HTML al editor a través del adaptador.

### Fase 4 — Adaptador texto → HTML

- Pequeña utilidad `lib/reportAdapter.ts` que convierte la salida de la IA
  (texto con secciones) en HTML limpio compatible con TipTap, respetando
  títulos de sección y listas.
- Se reutiliza la conversión HTML→PDF que ya existe (sin cambios).

### Fase 5 — Integración en `AppointmentPage.tsx` y permisos

- Se agrega una fila de botones "🎤 Dictar" y "✨ Asistencia IA" en la tarjeta
  "Informe", **solo para doctores** (igual que hoy se controla con
  `isReadOnly`: secretarias y viewers no ven estos botones).
- Al insertar el resultado, el informe queda en modo edición y el usuario lo
  puede revisar/corregir antes de guardar (misma lógica actual).
- Nada cambia en guardado, PDF, QR ni WhatsApp.

## Riesgos y decisiones a confirmar

1. **Proveedor de voz**: Web Speech API es gratis pero requiere internet y en
   Chrome su motor es de servidor. Alternativa: usar el speech-to-text de
   Lovable AI (también necesita internet y consume créditos). Recomiendo
   arrancar con Web Speech API (reutiliza lo que ya tienen, sin costo).
2. **Se requiere que me pases los archivos** `dictation.ts` y `subsections.ts`
   del otro sistema (o su estructura) para respetar el vocabulario/secciones que
   ya usás, en vez de recrearlos desde cero.
3. **Nivel de IA**: qué tan "agresiva" debe ser la corrección/redacción
   automática (solo ordenar y corregir ortografía, o redactar frases completas).
   Conviene empezar conservador: la IA sugiere, el médico revisa.
4. **Consumo de créditos**: cada uso de la IA consume créditos del workspace.
   El dictado por voz (Web Speech API) no consume. ¿Uso libre o con algún
   límite por informe?

## Alcance NO incluido (por ahora)

- No se portan los pasos "institución"/"paciente" del asistente.
- No se toca el historial, los permisos existentes, el PDF ni WhatsApp.
- No hay modo offline (como acordamos).
