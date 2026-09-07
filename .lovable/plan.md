# Bajar el tamaño del servidor de la base a "Small"

## Qué se va a hacer

Reducir el tamaño del servidor de la base de datos de MiniRisEcoyDoppler un par de escalones, hasta **Small**, para bajar el gasto mensual de créditos sin afectar el trabajo del consultorio.

No se toca nada del sistema: ni citas, ni informes, ni PDF, ni usuarios, ni permisos. Solo el tamaño del servidor donde vive la base.

## Por qué es seguro (datos reales medidos hoy)

- Memoria en uso: 9%
- Conexiones: 24 de 160 disponibles
- Datos: 31,5 MB, disco al 4%
- Consultas más pesadas: 10 a 16 milisegundos de promedio (máximo 38 ms)
- Cero reinicios y cero caídas por memoria

El servidor actual está muy sobredimensionado para este volumen de trabajo.

## Ahorro esperado

- Costo actual estimado: ~41 créditos/mes
- Costo con Small: ~10 créditos/mes
- Ahorro estimado: ~30 créditos/mes

## Sobre apagarlo de madrugada

No es posible programar que el servidor se achique o se apague por horario. Además, el chat en vivo y la sincronización del sistema mantienen la base activa, así que la pausa por inactividad tampoco aplicaría. Por eso la vía correcta es un único cambio de tamaño fijo.

## Cómo se aplica

1. Se abre el selector de tamaño de servidor y se elige **Small**; vos confirmás el cambio ahí mismo.
2. El cambio tarda unos minutos y hay un corte breve de servicio, así que conviene hacerlo fuera del horario de atención.
3. Después del cambio se vuelve a medir el estado de la base (memoria, conexiones, tiempos de consulta) para confirmar que todo sigue fluido.

## Si algo va lento

Volver a subir el tamaño lleva unos minutos y se puede hacer en cualquier momento. Recomendación: usar el sistema una semana normal y avisarme si notás demoras.
