export interface ReportTemplate {
  name: string;
  content: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    name: 'Ecografía Abdominal',
    content: `Hígado: de forma, tamaño y ecoestructura conservados, sin lesiones focales en los segmentos explorados.
Vía biliar: intra y extrahepática no dilatadas.
Vesícula: de paredes finas y contenido líquido homogéneo. Alitiásica.
Páncreas: parénquima homogéneo, sin imágenes a destacar.
Bazo: de forma, tamaño y ecoestructura conservados.
Riñones: ortotópicos, de forma y tamaño conservados. Adecuada diferenciación corticomedular.
Aorta: calibre y recorrido conservados.
No se observa líquido libre en cavidad.`,
  },
  {
    name: 'Ecografía Pélvica',
    content: `Vejiga: de paredes finas y contenido líquido homogéneo.
Útero: en AVF de forma, tamaño y ecoestructura miometrial conservados.
Medidas: Long: mm.  AP: mm. Axial: mm.
Endometrio lineal / homogéneo de mm.
Ovario Derecho: mm x mm.
Ovario Izquierdo: mm x mm.
Ambos ovarios de características conservadas para la edad.
Fondo de saco de Douglas libre.`,
  },
  {
    name: 'Ecografía Vesical',
    content: `Vejiga: de paredes finas y regulares, contenido líquido homogéneo. Sin imágenes endoluminales.
Volumen premiccional:  cc. RPM:  cc.`,
  },
  {
    name: 'Ecografía Prostática',
    content: `Próstata: CP: mm. AP: mm. Axial: mm de ecoestructura finamente no homogénea. Volumen:      cc.
Vejiga: de paredes finas y contenido líquido homogéneo.
Volumen premiccional:  cc. RPM:  cc.`,
  },
  {
    name: 'Ecografía Vesical y Prostática',
    content: `Vejiga: de paredes finas y contenido líquido homogéneo.
Volumen premiccional:  cc. RPM:  cc.
Próstata: CP: mm. AP: mm. Axial: mm de ecoestructura finamente no homogénea. Volumen:      cc.`,
  },
  {
    name: 'Ecografía de Partes Blandas',
    content: `Se realiza rastreo ecográfico de la región referida por el paciente, observándose planos cutáneo, celular subcutáneo y muscular de características ecográficas conservadas.
No se evidencian colecciones ni masas a destacar por este método.
Si la clínica lo sugiere completar con otros métodos diagnósticos.`,
  },
  {
    name: 'Ecografía Articular',
    content: `Se explora la articulación referida: superficies óseas de contorno regular, sin derrame articular ni sinovitis.
Estructuras tendinosas y ligamentarias visualizadas de ecoestructura fibrilar conservada.
No se evidencian colecciones periarticulares.
Si la clínica lo sugiere completar con otros métodos diagnósticos.`,
  },
  {
    name: 'Ecografía Renal',
    content: `Riñón derecho: Long: mm  AP: mm Axial: mm. Espesor cortical conservado.
Riñón izquierdo: Long: mm  AP: mm Axial: mm. Espesor cortical conservado.
Ambos riñones de forma, tamaño y ecoestructura conservados, sin signos de quistosis o macrolitiasis.
Vías excretoras: no dilatadas.`,
  },
  {
    name: 'Renal y Vesicoprostática',
    content: `Riñón derecho: Long: mm AP: mm Axial: mm. Espesor cortical conservado.
Riñón izquierdo: Long: mm AP: mm Axial: mm. Espesor cortical conservado.
Ambos riñones de forma, tamaño y ecoestructura conservados, sin signos de macrolitiasis.
Vías excretoras: no dilatadas.
Vejiga: de paredes finas y contenido líquido homogéneo.
Volumen premiccional:  cc. RPM:  cc.
Próstata: CP: mm. AP: mm. Axial: mm de ecoestructura finamente no homogénea. Volumen:      cc.`,
  },
  {
    name: 'Ecografía Tiroidea',
    content: `Glándula tiroidea de forma, tamaño y ecoestructura conservados.
LOBULO DERECHO:
Long.: mm.  AP.:   mm. Trans.:  mm.
LOBULO IZQUIERDO:
Long.: mm.  AP.: mm. Trans.:  mm.
ISTMO:     mm.`,
  },
  {
    name: 'Ecografía Mamaria',
    content: `Ambas mamas con tejido fibroglandular heterogéneo y moderado tejido adiposo.
Mama derecha: No se observan imágenes nodulares sólidas ni quísticas a destacar.
Mama izquierda: No se observan imágenes nodulares sólidas ni quísticas a destacar.
Planos superficiales y posteriores libres.
Axilas libres de adenomegalias. 
BIRADS 1`,
  },
  {
    name: 'Ginecológica TV',
    content: `Útero: en AVF de forma, tamaño y ecoestructura miometrial conservados.
Medidas: Long: mm.  AP: mm. Axial: mm.
Endometrio homogéneo de mm.
Ovario Derecho: mm x mm.
Ovario Izquierdo: mm x mm.
Ambos ovarios de características conservadas para la edad.
Fondo de saco de Douglas libre.`,
  },
  {
    name: 'Mamaria y Ginecológica TV',
    content: `ECOGRAFÍA MAMARIA
Ambas mamas con tejido fibroglandular heterogéneo y moderado tejido adiposo.
Mama derecha: No se observan imágenes nodulares sólidas ni quísticas a destacar.
Mama izquierda: No se observan imágenes nodulares sólidas ni quísticas a destacar.
Planos superficiales y posteriores libres.
Axilas libres de adenomegalias. 
BIRADS 1

ECOGRAFÍA GINECOLÓGICA TV
Útero: en AVF de forma, tamaño y ecoestructura miometrial conservados.
Medidas: Long: mm.  AP: mm. Axial: mm.
Endometrio homogéneo de mm.
Ovario Derecho: mm x mm.
Ovario Izquierdo: mm x mm.
Ambos ovarios de características conservadas para la edad.
Fondo de saco de Douglas libre.`,
  },
  {
    name: 'Obstétrica 1er Trimestre',
    content: `FUM:\t\t\tAmenorrea: 
Útero: en AVF, ocupado por saco gestacional de contornos netos, con embrión vital y móvil en su interior.
Actividad cardioembrionaria: positiva. LCF: lpm.
LCC:   mm correspondiente a  semanas de EG.
Trofoblasto: envolvente, homogéneo. 
Cuello: con ambos orificios cervicales cerrados al momento del estudio.
Regiones anexiales: de características conservadas. 
Fondo de saco de Douglas: libre.
FPP: //2025

CONCLUSION: embarazo único y vital de     semanas de EG por ecografía.`,
  },
  {
    name: 'TN y Doppler Uterino',
    content: `FUM:\t\t\tAmenorrea: 
Útero ocupado por feto único, vital y móvil.  FCF:  lat. x Min.
LEM: 66 mm que corresponden a  semanas de gestación (+/- 5 días).
Trofoblasto: envolvente homogéneo. 
Líquido amniótico: normal cantidad.
Cuello: con ambos orificios cervicales cerrados.
Translucencia Nucal: de  mm.
Hueso nasal: presente.
Ductus venoso: anterógrado. Conservado.
Arteria uterina derecha: IP: 
Arteria uterina izquierda: IP: 
IP medio: , percentilo , dentro de los parámetros normales (VN:<p95)
Fondo de saco de Douglas: libre.
Longitud cervical: conservada.
FPP: 

CONCLUSION: embarazo único y vital de  semanas de EG. TN, hueso nasal y ductus venoso dentro de parámetros normales. Doppler de arterias uterinas conservado.`,
  },
  {
    name: 'Ecografía Obstétrica',
    content: `FUM: //\t\tAMENORREA: semanas
Útero ocupado por feto único, vital y móvil.  FCF:  lat. x Min.
Situación longitudinal, posición cefálica, dorso posterior. 
DBP: mm (semanas).
PC: mm (semanas).
PA: mm (semanas).
FL: mm (semanas).
EG por ecografía: corresponde a semanas.
Peso fetal aproximado: g (+/- 15%) en percentilo para la EG .
Placenta: anterior no previa, grado III de maduración.
Líquido amniótico: normal cantidad.
Cuello: con ambos orificios cervicales cerrados.
FPP: 
CONCLUSION: embarazo único y vital de  semanas de EG.`,
  },
  {
    name: 'Doppler Maternofetal',
    content: `Arteria umbilical: IR: ;  IP:; conservada.
Arteria cerebral media: IR:; conservada.
Arteria uterina derecha: IR: ; IP: . Sin notch.
Arteria uterina izquierda: IR: ; IP: . Sin notch.
No observo signos de redistribución del flujo. 

CONCLUSION: Estudio dentro de parámetros normales.`,
  },
  {
    name: 'Ecografía Obstétrica Morfológica',
    content: `Cabeza: Cráneo de morfología conservada. Línea media entrada, cavum del septum pellucidum presente. Hemisferios cerebrales y cerebelo de características conservadas. Ventrículos no dilatados.
Cara: órbitas, nariz y labios conservados.
Cuello fetal: de aspecto conservado.
Corazón: con cuatro cámaras, adecuada morfología.  FCF: 155 lat. x min.
Diafragma: continuo, sin evidencia de soluciones de continuidad.
Abdomen: Cámara gástrica, hígado, vesícula, ambos riñones y vejiga ortotópicos, de aspecto conservado. Vías excretoras dentro de límites normales.
Columna fetal: sin evidencia actual de falla de cierre.
Extremidades: Se observan cuatro miembros móviles, con tres segmentos cada uno.
Genitales externos: femeninos.
Cordón: con tres vasos.

CONCLUSION: biometría fetal y estudio morfológico dentro de límites normales.`,
  },
  {
    name: 'Ecografía Testicular',
    content: `Testículo derecho:
Long: mm.  Ap: mm. Axial: mm.
De forma, tamaño y ecoestructura conservados.
Epidídimo: Conservado

Testículo izquierdo:
Long: mm.  Ap: mm. Axial: mm.
De forma, tamaño y ecoestructura conservados.
Epidídimo: Conservado`,
  },
  {
    name: 'Ecografía Muscular',
    content: `Se realiza rastreo ecográfico del muslo derecho observándose planos musculares de características ecográficas conservadas.
No se evidencian colecciones a destacar por este método.
Si la clínica lo sugiere completar con otros métodos diagnósticos.`,
  },
  {
    name: 'Ecografía de Hombro',
    content: `Se exploraron ambos hombros de forma comparativa, observándose tendón del musculo subescapular, supra e infraespinoso de aspecto conservado. 
Tendón de la porción larga  del bíceps en corredera.
No se observa líquido en la bursa subacormio-subdeltoidea.`,
  },
  {
    name: 'Ecografía de Caderas',
    content: `ECOGRAFÍA DE CADERAS CON PRUEBAS DE STRESS
Se practicó ecografía de ambas caderas en posición neutra y con maniobras de stress.
Se observa adecuada configuración anatómica de las cabezas femorales.
Núcleos de osificación presentes.
Cobertura acetabular superior al 50%
Las maniobras de stress no provocan luxación ni subluxación de las cabezas femorales.
CONCLUSION: estudio dentro de los parámetros normales.`,
  },
  {
    name: 'Ecografía Cerebral Transfontanelar',
    content: `Estudio realizado a través de fontanela anterior permeable.
Línea media centrada, sin desplazamientos.
Cuerpo calloso presente.
Sistema ventricular: no dilatado. Astas frontales y occipitales de amplitud conservada.
Plexos coroideos de ecogenicidad homogénea.
Fosa posterior y cerebelo de características ecográficas conservadas.
No observo signos de hemorragia intra/periventricular ni otras lesiones a destacar en el presente estudio.`,
  },
  {
    name: 'Doppler Venoso MMII (Completo)',
    content: `LADO DERECHO
Sistema venoso profundo:
Vena femoral común: permeable, compresible y continente.
Vena femoral: permeable, compresible y continente.
Vena poplítea: permeable, compresible y continente.

Sistema venoso superficial:
Vena safena magna: permeable, de calibre conservado y continente.
Vena safena parva: permeable, de calibre conservado y  continente.
No observo vasos perforantes incontinentes para destacar.


LADO IZQUIERDO
Sistema venoso profundo:
Vena femoral común: permeable, compresible y continente.
Vena femoral: permeable, compresible y continente.
Vena poplítea: permeable, compresible y continente.

Sistema venoso superficial:
Vena safena magna: permeable, de calibre conservado y continente.
Vena safena parva: permeable, de calibre conservado y  continente.
No observo vasos perforantes incontinentes para destacar.`,
  },
  {
    name: 'Doppler Venoso MMII (TVP)',
    content: `LADO DERECHO:
SISTEMA VENOSO PROFUNDO
Vena femoral común: permeable y compresible.
Vena femoral superficial: permeable y compresible.
Vena poplítea: permeable y compresible.
Vena tibial posterior: permeable y compresible.
SISTEMA VENOSO SUPERFICIAL
Venas safenas magna y parva: permeables y compresibles.

LADO IZQUIERDO:
SISTEMA VENOSO PROFUNDO
Vena femoral común: permeable y compresible.
Vena femoral superficial: permeable y compresible.
Vena poplítea: permeable y compresible.
Vena tibial posterior: permeable y compresible.
SISTEMA VENOSO SUPERFICIAL
Venas safenas magna y parva: permeables y compresibles.

CONCLUSION: El sistema venoso profundo y superficial, es permeable  y compresible.
No se observan signos de TVP en el presente estudio.`,
  },
  {
    name: 'MIV (Mapeo Insuf. Venosa)',
    content: `Sistema venoso profundo
En el Eco-Doppler venoso de ambos miembros inferiores se exploró el sistema venoso profundo de ambos miembros inferiores a nivel de venas femoral comun, femoral, poplítea, tibiales posteriores y peroneas.
Sistema venoso profundo permeable y compresible, presenta flujo con variación respiratoria y responde adecuadamente a las maniobras dinámicas (compresión manual distal, proximal y Valsalva). Sin signos de trombosis al momento del estudio.

Sistema venoso superficial 
Vena safena magna de calibre conservado y continente a nivel de cayado y en todo su recorrido.
Vena safena parva: ostium de calibre conservado y continente.
No se observan venas perforantes insuficientes a destacar.`,
  },
  {
    name: 'Doppler Venoso MMII (Insuficiencia / Mapeo)',
    content: `Estudio realizado en bipedestación, con maniobras de compresión distal/Valsalva.

SISTEMA VENOSO PROFUNDO (ambos miembros)
Venas femoral común, femoral, poplítea, tibiales posteriores y peroneas: permeables, compresibles, con flujo espontáneo y variación respiratoria. Sin signos de trombosis. Sin reflujo patológico (>1 s).

SISTEMA VENOSO SUPERFICIAL
MIEMBRO INFERIOR DERECHO
Unión safeno-femoral: válvula terminal [continente / incompetente].
Safena magna: diámetro en muslo proximal __ mm, medio __ mm, pierna __ mm. Reflujo: [ausente / presente, __ s, hasta __].
Unión safeno-poplítea y safena parva: diámetro __ mm. Reflujo: [ausente / presente, __ s].
Venas safenas accesorias / colaterales: [sin particularidades / dilatadas con reflujo].
Venas perforantes: [sin incompetentes / incompetente en __, diámetro __ mm, reflujo __ s].

MIEMBRO INFERIOR IZQUIERDO
Unión safeno-femoral: válvula terminal [continente / incompetente].
Safena magna: diámetro en muslo proximal __ mm, medio __ mm, pierna __ mm. Reflujo: [ausente / presente, __ s, hasta __].
Unión safeno-poplítea y safena parva: diámetro __ mm. Reflujo: [ausente / presente, __ s].
Venas safenas accesorias / colaterales: [sin particularidades / dilatadas con reflujo].
Venas perforantes: [sin incompetentes / incompetente en __, diámetro __ mm, reflujo __ s].

CONCLUSION:
Sistema venoso profundo permeable y competente en ambos miembros inferiores.
Insuficiencia venosa superficial [ausente / en territorio de safena magna / safena parva / colaterales] [derecha / izquierda / bilateral].
Se sugiere correlación clínica (clasificación CEAP).`,
  },
  {
    name: 'Ecografía Hepatobiliopancreática',
    content: `Hígado: de forma, tamaño y ecoestructura conservados, sin lesiones focales en los segmentos explorados.
Vía biliar: intra y extrahepática no dilatadas. Colédoco: __ mm.
Vesícula: de paredes finas y contenido líquido homogéneo. Alitiásica.
Páncreas: parénquima homogéneo, sin imágenes a destacar en los segmentos visualizados.
Vena porta: calibre y flujo conservados.
No se observa líquido libre en cavidad.`,
  },
  {
    name: 'Doppler Arterial MMII',
    content: `LADO DERECHO:
Arteria femoral común: permeable con espectro trifásico.
Arteria femoral superficial: permeable con espectro trifásico.
Arteria poplítea: permeable con espectro trifásico.
Arteria tibial posterior: permeable con  espectro trifásico de velocidad conservada.
Arteria tibial  anterior: permeable con  espectro trifásico de velocidad conservada.

LADO IZQUIERDO:
Arteria femoral común: permeable con espectro trifásico.
Arteria femoral superficial: permeable con  espectro trifásico.
Arteria poplítea: permeable con espectro trifásico.
Arteria tibial posterior: permeable con  espectro trifásico de velocidad conservada.
Arteria tibial anterior: permeable con  espectro trifásico de velocidad conservada.

CONCLUSION:
Todos los vasos explorados mostraron permeabilidad y  calibres normales con  sonogramas trifásicos de amplitud conservada.`,
  },
  {
    name: 'Ecodoppler Aorta Abdominal',
    content: `Se realiza rastreo ecográfico Doppler color de la aorta  abdominal  y arterias ilíacas  presentando calibres y recorridos conservados con diámetros máximos de   mm para la aorta y    mm para las arterias ilíacas.
Todos los vasos explorados se encuentran permeables con  flujo trifásico sin alteraciones hemodinámicas y libres de ateromas.

CONCLUSION:
Estudio dentro de parámetros normales.`,
  },
  {
    name: 'Ecodoppler Arterias Renales',
    content: `Ambos riñones de forma, tamaño y ecoestructura conservados. 
Vías excretoras no dilatadas.
Aorta de recorrido y calibre conservados, presenta flujo trifásico sin alteraciones hemodinámicas.
Arterias renales a nivel del ostium, tercio medio e hilios con espectros monofásicos de flujo normales. Sin evidencia de alteraciones hemodinámicas significativas.
Arterias intrarrenales (segmentarias, interlobares y arcuatas) con espectros monofásicos e índices de resistencia conservados menores a 0,7.-

CONCLUSION:
Estudio dentro de parámetros normales.`,
  },
  {
    name: 'Doppler Hepático',
    content: `Venas suprahepáticas (derecha, media e izquierda) con flujo trifásico hepatófugo.
Vena porta de      mm, permeable, con flujo hepatopetal, variación respiratoria, de velocidad normal
Arteria hepática con IR:        , conservado.
Vena esplénica de     mm, con flujo hepatopetal de velocidad normal.
No se observa circulación colateral.

CONCLUSION:
Doppler esplenoportal dentro de parámetros normales.`,
  },
  {
    name: 'Doppler Venoso MMSS',
    content: `[BORRADOR - revisar]
LADO DERECHO:
Venas yugular interna, subclavia, axilar, braquial, basílica y cefálica: permeables, compresibles, con flujo espontáneo y variación respiratoria.

LADO IZQUIERDO:
Venas yugular interna, subclavia, axilar, braquial, basílica y cefálica: permeables, compresibles, con flujo espontáneo y variación respiratoria.

CONCLUSION: Sistema venoso profundo y superficial de ambos miembros superiores permeable y compresible. Sin signos de trombosis al momento del estudio.`,
  },
  {
    name: 'Doppler Arterial MMSS',
    content: `Arterias subclavia, axilar, braquial, radial y cubital con diámetros conservados, paredes lisas y flujos trifásicos de velocidad normal.
Arco palmar con buen relleno.

CONCLUSION:
Estudio dentro de límites normales.`,
  },
  {
    name: 'Test Función Endotelial',
    content: `Estudio de función endotelial de la arteria braquial,  realizado con paciente en posición de decúbito dorsal, con reposo de 5 minutos, con ayuda de manguito de presión durante 5 minutos.

Complejo íntima media: 
Diámetro de la arteria braquial en estado basal:   mm
Diámetro de la arteria braquial en estado basal post-isquemia: mm

Flujo en estado basal:          cm/seg.  IR:         trifásico.
Post isquemia:           cm/seg,  IR:      con diástole (monofásico).

CONCLUSION:
Adecuada respuesta del endotelio a la prueba de disfunción endotelial.`,
  },
  {
    name: 'Doppler de Sustancia Nigra',
    content: `Adecuada ventana para la exploración del tronco cerebral.
Se observa -------- ecogenicidad de la sustancia nigra de ambos lados
Area derecha: 
Area izquierda: `,
  },
  {
    name: 'Ecodoppler TSA (Vasos de Cuello)',
    content: `EJES CAROTIDEOS: 
Flujo laminar de velocidad normal en ambas carótidas primitivas, internas y externas. Arterias oftálmicas con flujo anterógrado. 
Complejo íntima media en carótida primitiva derecha:  mm 
Complejo íntima media en carótida primitiva izquierda:  mm 
No se observan placas de ateroma.

ARTERIAS VERTEBRALES: 
Visualizadas en origen y segmentos V1 y V2 con flujo de dirección y velocidad normales. 

ARTERIAS SUBCLAVIAS: 
Flujo de velocidad normal en ambos vasos.

CONCLUSIONES:
Vasos con morfología, endotelio y características hemodinámicas normales.`,
  },
  {
    name: 'Doppler Arterial de Vasos de Cuello (Carótidas)',
    content: `EJES CAROTÍDEOS:
Flujo laminar de velocidad normal en ambas carótidas primitivas, internas y externas.
Complejo íntima media en carótida primitiva derecha: mm
Complejo íntima media en carótida primitiva izquierda: mm
No se observan placas de ateroma.
Arterias vertebrales visualizadas en origen y segmentos V1-V2, con flujo de dirección y velocidad normales.

CONCLUSIÓN:
Ejes carotídeos y vertebrales de morfología y hemodinamia conservadas.`,
  },
  {
    name: 'Doppler Venoso de Vasos de Cuello (Yugulares)',
    content: `Venas yugulares internas derecha e izquierda: permeables, compresibles, con flujo espontáneo y variación respiratoria/cardíaca conservada. Sin imágenes endoluminales.
Venas subclavias: permeables.

CONCLUSIÓN:
Sistema venoso yugular permeable, sin signos de trombosis.`,
  },
  {
    name: 'Doppler de Troncos Supraaórticos',
    content: `EJES CAROTÍDEOS:
Flujo laminar de velocidad normal en ambas carótidas primitivas, internas y externas. Arterias oftálmicas con flujo anterógrado.
Complejo íntima media en carótida primitiva derecha: mm
Complejo íntima media en carótida primitiva izquierda: mm
No se observan placas de ateroma.

ARTERIAS VERTEBRALES:
Visualizadas en origen y segmentos V1 y V2 con flujo de dirección y velocidad normales.

ARTERIAS SUBCLAVIAS:
Flujo de velocidad normal en ambos vasos.

SISTEMA VENOSO YUGULAR:
Venas yugulares internas permeables y compresibles, con flujo espontáneo conservado.

CONCLUSIÓN:
Troncos supraaórticos de morfología, endotelio y hemodinamia normales.`,
  },
  {
    name: 'Doppler Testicular',
    content: `Testículo derecho: Long: mm. AP: mm. Axial: mm. Ecoestructura homogénea. Vascularización intratesticular presente y simétrica al Doppler color.
Testículo izquierdo: Long: mm. AP: mm. Axial: mm. Ecoestructura homogénea. Vascularización intratesticular presente y simétrica al Doppler color.
Epidídimos: de tamaño y ecoestructura conservados, sin aumento de señal Doppler.
Cordones espermáticos: sin imágenes de várices (sin reflujo con maniobra de Valsalva).
No se observa hidrocele significativo.

CONCLUSIÓN: estudio testicular con flujo Doppler conservado y simétrico, sin hallazgos patológicos.`,
  },
  {
    name: 'Doppler Peneano',
    content: `Estudio basal (sin/con inducción farmacológica, según indicación):
Cuerpos cavernosos de ecoestructura homogénea y simétrica.
Arterias cavernosas derecha e izquierda: velocidad pico sistólica (VPS): cm/seg. Velocidad de fin de diástole (VFD): cm/seg. Índice de resistencia: .
Placas de fibrosis/calcificación: no se observan.

CONCLUSIÓN: parámetros hemodinámicos dentro de límites normales (VPS > 30 cm/seg, sin insuficiencia venosa asociada).`,
  },
  {
    name: 'Doppler Tiroideo',
    content: `Glándula tiroidea de forma, tamaño y ecoestructura conservados.
LÓBULO DERECHO: Long.: mm. AP.: mm. Trans.: mm.
LÓBULO IZQUIERDO: Long.: mm. AP.: mm. Trans.: mm.
ISTMO: mm.
Vascularización al Doppler color: patrón conservado, sin hipervascularización difusa ni focal.
No se observan nódulos ni adenomegalias cervicales a destacar.`,
  },
  {
    name: 'Doppler Hepático',
    content: `Venas suprahepáticas (derecha, media e izquierda) con flujo trifásico hepatófugo.
Vena porta de mm, permeable, con flujo hepatopetal, variación respiratoria, de velocidad normal.
Arteria hepática con IR: , conservado.
Vena esplénica de mm, con flujo hepatopetal de velocidad normal.
No se observa circulación colateral.

CONCLUSIÓN: Doppler esplenoportal dentro de parámetros normales.`,
  },
  {
    name: 'Doppler Oftálmico',
    content: `Arteria oftálmica derecha: IR: . VPS: cm/seg. Flujo anterógrado conservado.
Arteria oftálmica izquierda: IR: . VPS: cm/seg. Flujo anterógrado conservado.
Arterias centrales de la retina: flujo simétrico y conservado bilateral.
Venas centrales de la retina: flujo venoso continuo bilateral.

CONCLUSIÓN: estudio Doppler orbitario dentro de parámetros normales.`,
  },
  {
    name: 'Ecografía Ocular',
    content: `Estudio realizado con transductor de alta frecuencia, párpado cerrado, con gel estéril.
Cámara vítrea: transparente, sin imágenes ecogénicas en su interior. Sin desprendimiento de retina ni de coroides.
Cristalino: presente, de ecoestructura conservada.
Nervio óptico: de calibre y trayecto conservados.
Globo ocular contralateral con hallazgos comparables.

CONCLUSIÓN: estudio ocular bilateral sin alteraciones a destacar por este método.`,
  },
  {
    name: 'Doppler de Arterias Temporales',
    content: `Arteria temporal superficial derecha: paredes finas y regulares, sin signo de halo. Flujo trifásico conservado. Diámetro: mm.
Arteria temporal superficial izquierda: paredes finas y regulares, sin signo de halo. Flujo trifásico conservado. Diámetro: mm.
Ramas frontal y parietal exploradas bilateralmente sin hallazgos a destacar.

CONCLUSIÓN: sin signos ecográficos de arteritis de células gigantes (ausencia de signo de halo, sin estenosis ni oclusión).`,
  },
  {
    name: 'Doppler Power Articular',
    content: `Se explora la articulación referida con modo B y Power Doppler.
Superficies óseas de contorno regular, sin erosiones a destacar.
Receso articular/sinovial: sin derrame significativo.
Membrana sinovial: espesor conservado, sin señal Power Doppler patológica (sin hipervascularización sinovial).
Estructuras tendinosas periarticulares de ecoestructura fibrilar conservada.

CONCLUSIÓN: sin signos ecográficos de sinovitis activa en la articulación explorada.`,
  },
  {
    name: 'Ecografía de Tendón de Aquiles',
    content: `Tendón de Aquiles derecho: espesor conservado, fibras de ecoestructura fibrilar homogénea en todo su trayecto. Sin colecciones peritendinosas.
Tendón de Aquiles izquierdo: espesor conservado, fibras de ecoestructura fibrilar homogénea en todo su trayecto. Sin colecciones peritendinosas.
Bursa retrocalcánea: sin distensión líquida.
Inserción calcánea sin entesofitos ni irregularidades corticales a destacar.`,
  },
  {
    name: 'Ecografía de Rodilla',
    content: `Se explora la rodilla referida en los planos anterior, medial, lateral y posterior.
Tendón cuadricipital y rotuliano: de ecoestructura fibrilar conservada.
Receso suprapatelar: sin derrame articular significativo.
Meniscos (abordaje accesible): sin imágenes de extrusión a destacar.
Ligamentos colaterales medial y lateral: de ecoestructura conservada.
Quiste de Baker: no se observa.
Bursa anserina y prepatelar: sin distensión líquida.`,
  },
  {
    name: 'Ecografía de Muñeca',
    content: `Se explora la muñeca referida en cara dorsal y palmar.
Compartimentos tendinosos extensores y flexores: de ecoestructura fibrilar conservada, sin tenosinovitis.
Túnel carpiano: nervio mediano de calibre conservado, sin signos de compresión.
Articulación radiocarpiana: sin derrame ni sinovitis.
No se observan quistes sinoviales (gangliones) a destacar.`,
  },
  {
    name: 'Ecografía de Tobillo',
    content: `Se explora el tobillo referido en los planos anterior, medial, lateral y posterior.
Ligamentos peroneoastragalino anterior y peroneocalcáneo: de ecoestructura conservada, sin signos de lesión aguda.
Tendones peroneos, tibial posterior y flexores: de ecoestructura fibrilar conservada, sin tenosinovitis.
Receso articular tibioastragalino: sin derrame significativo.
Seno del tarso: sin alteraciones a destacar.`,
  },
  {
    name: 'Ecografía de Codo',
    content: `Se explora el codo referido en compartimentos anterior, medial, lateral y posterior.
Tendón distal del bíceps: de ecoestructura fibrilar conservada.
Epicóndilo lateral (tendón extensor común) y epitróclea (tendón flexor común): sin signos de epicondilitis/epitrocleítis.
Bursa olecraniana: sin distensión líquida.
Nervio cubital en el canal epitrócleo-olecraniano: de calibre conservado, normoposicionado.`,
  },
  {
    name: 'Ecografía de Tejido Celular Subcutáneo',
    content: `Se realiza rastreo ecográfico de la región referida, observándose el tejido celular subcutáneo de espesor y ecogenicidad conservados para el panículo del paciente.
No se evidencian colecciones, trayectos fistulosos ni formaciones nodulares a destacar por este método.
Plano fascial muscular subyacente sin alteraciones.
Si la clínica lo sugiere completar con otros métodos diagnósticos.`,
  },
  {
    name: 'Ecografía de Partes Blandas de Cuello',
    content: `Glándulas submaxilares: de tamaño y ecoestructura homogénea conservados, sin imágenes litiásicas ni dilatación ductal.
Glándulas parótidas: de tamaño y ecoestructura homogénea conservados bilateralmente.
Niveles ganglionares cervicales explorados: se observan ganglios de morfología conservada (relación córtico-hiliar preservada), sin adenomegalias patológicas.
No se observan colecciones ni formaciones nodulares a destacar en partes blandas de cuello.`,
  },
  {
    name: 'Ecografía de Pared Abdominal',
    content: `Se explora la pared abdominal en la región referida (umbilical / inguinal), en reposo y con maniobra de Valsalva.
Orificio herniario: [presente / no se evidencia] defecto de la pared de mm.
Contenido del saco herniario: [no se identifica protrusión / se identifica protrusión de grasa preperitoneal / asa intestinal], [reductible / no reductible] con la maniobra.
Región contralateral de características conservadas.

CONCLUSIÓN: [sin evidencia de hernia de la pared abdominal en la región explorada / hernia descripta arriba].`,
  },
  {
    name: 'Ecografía Pleural',
    content: `Ambos campos pulmonares explorados por vía intercostal.
Deslizamiento pleural (lung sliding) presente y conservado bilateralmente.
No se observa derrame pleural en los senos costofrénicos explorados.
No se observan imágenes de consolidación subpleural a destacar por este método.

CONCLUSIÓN: sin derrame pleural ni otras alteraciones pleurales a destacar.`,
  },
  {
    name: 'Ecografía Ginecológica',
    content: `Vejiga: de paredes finas y contenido líquido homogéneo (como ventana acústica).
Útero: en AVF, de forma, tamaño y ecoestructura miometrial conservados.
Medidas: Long: mm. AP: mm. Axial: mm.
Endometrio lineal / homogéneo de mm.
Ovario derecho: mm x mm.
Ovario izquierdo: mm x mm.
Ambos ovarios de características conservadas para la edad.
Fondo de saco de Douglas libre.`,
  },
  {
    name: 'Ecografía Obstétrica TN',
    content: `FUM: \t\tAmenorrea:
Útero ocupado por feto único, vital y móvil. FCF: lat. x min.
LCC: mm correspondientes a semanas de EG (+/- 5 días).
Translucencia nucal: mm.
Hueso nasal: presente.
Trofoblasto: envolvente, homogéneo.
Cuello: con ambos orificios cervicales cerrados al momento del estudio.
Regiones anexiales: de características conservadas.
Fondo de saco de Douglas: libre.
FPP:

CONCLUSIÓN: embarazo único y vital de semanas de EG. Translucencia nucal y hueso nasal dentro de parámetros normales.`,
  },
  {
    name: 'Ecografía Obstétrica 3D/4D/5D',
    content: `Útero ocupado por feto único, vital y móvil. FCF: lat. x min.
Biometría fetal acorde a la EG de referencia (ver estudio morfológico/obstétrico previo).
Se obtienen reconstrucciones volumétricas de superficie (3D/4D) de cara y/o segmento corporal solicitado, de adecuada calidad técnica según posición fetal y cantidad de líquido amniótico.
Rasgos faciales/segmento explorado sin alteraciones morfológicas a destacar.
Líquido amniótico: normal cantidad.
Placenta: normoinserta.

CONCLUSIÓN: estudio volumétrico (3D/4D) complementario sin hallazgos a destacar; biometría acorde a EG.`,
  },
  {
    name: 'Ginecológica con Recuento Folicular',
    content: `Vía: [transvaginal / transabdominal].
Útero: en AVF, de forma, tamaño y ecoestructura miometrial conservados.
Medidas: Long: mm. AP: mm. Axial: mm.
Endometrio homogéneo de mm.

Ovario derecho: mm x mm. Folículos antrales: n° __, mayor de __ mm.
Ovario izquierdo: mm x mm. Folículos antrales: n° __, mayor de __ mm.

Fondo de saco de Douglas libre.

CONCLUSIÓN: recuento de folículos antrales consignado arriba por ovario.`,
  },
  {
    name: 'Ginecológica con Monitoreo de la Ovulación',
    content: `Vía: [transvaginal / transabdominal].

CONTROL 1 — Fecha: __/__/____. Día del ciclo: __
Útero: en AVF, de forma, tamaño y ecoestructura miometrial conservados.
Medidas: Long: mm. AP: mm. Axial: mm.
Endometrio: mm, patrón [trilaminar / homogéneo].
Ovario derecho: mm x mm. Folículo dominante: __ mm.
Ovario izquierdo: mm x mm. Folículo dominante: __ mm.
Fondo de saco de Douglas libre.

CONTROL 2 — Fecha: __/__/____. Día del ciclo: __
Endometrio: mm, patrón [trilaminar / homogéneo].
Ovario derecho: folículo dominante __ mm.
Ovario izquierdo: folículo dominante __ mm.

CONTROL 3 — Fecha: __/__/____. Día del ciclo: __
Endometrio: mm, patrón [trilaminar / homogéneo].
Ovario derecho: folículo dominante __ mm [/ signos de ovulación: colapso folicular, líquido libre en Douglas].
Ovario izquierdo: folículo dominante __ mm.

CONCLUSIÓN: evolución folicular y endometrial descripta en los controles seriados de arriba.`,
  },
  {
    name: 'Doppler Ginecológico Transvaginal',
    content: `Útero: en AVF, de forma, tamaño y ecoestructura miometrial conservados.
Medidas: Long: mm. AP: mm. Axial: mm.
Endometrio homogéneo de mm, con adecuada vascularización al Doppler color.
Arteria uterina derecha: IP: . IR: .
Arteria uterina izquierda: IP: . IR: .
Ovario derecho: mm x mm, vascularización conservada al Doppler color.
Ovario izquierdo: mm x mm, vascularización conservada al Doppler color.
Fondo de saco de Douglas libre.

CONCLUSIÓN: estudio Doppler ginecológico transvaginal dentro de parámetros normales.`,
  },
  {
    name: 'Doppler de Partes Blandas',
    content: `Se realiza rastreo ecográfico con modo B y Doppler color/power de la región referida.
Planos cutáneo, celular subcutáneo y muscular de características ecográficas conservadas.
No se evidencian colecciones ni formaciones nodulares a destacar por este método.
Vascularización al Doppler: sin hipervascularización focal ni signos de proceso inflamatorio/vascular activo.
Si la clínica lo sugiere completar con otros métodos diagnósticos.`,
  },
];
