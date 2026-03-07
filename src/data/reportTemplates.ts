export interface ReportTemplate {
  name: string;
  content: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    name: 'Ecografía Abdominal Normal',
    content: `ECOGRAFÍA ABDOMINAL

HÍGADO: De tamaño, forma y ecogenicidad normal. No se observan lesiones focales. Venas suprahepáticas y porta de calibre normal.

VESÍCULA BILIAR: De paredes delgadas, sin litiasis ni pólipos. Colédoco de calibre normal.

PÁNCREAS: De tamaño y ecogenicidad normal. Sin dilatación del conducto de Wirsung.

BAZO: De tamaño normal, homogéneo, sin lesiones focales.

RIÑONES: Ambos riñones de tamaño, forma y ecogenicidad normal. Buena diferenciación corticomedular. Sin dilatación del sistema colector. Sin litiasis.

AORTA ABDOMINAL: De calibre normal.

VEJIGA: De paredes delgadas y regulares. Sin lesiones endoluminales.

CONCLUSIÓN: Ecografía abdominal dentro de límites normales.`,
  },
  {
    name: 'Esteatosis Hepática',
    content: `ECOGRAFÍA ABDOMINAL

HÍGADO: Aumentado de tamaño. Ecogenicidad difusamente incrementada con atenuación posterior del haz ultrasónico, compatible con esteatosis hepática grado II. No se observan lesiones focales.

VESÍCULA BILIAR: De paredes delgadas, sin litiasis ni pólipos.

PÁNCREAS: De ecogenicidad normal.

BAZO: Normal.

RIÑONES: Sin alteraciones.

CONCLUSIÓN: Hallazgos compatibles con esteatosis hepática moderada (Grado II).`,
  },
  {
    name: 'Cálculos Biliares',
    content: `ECOGRAFÍA ABDOMINAL

HÍGADO: De tamaño y ecogenicidad normal. Sin lesiones focales.

VESÍCULA BILIAR: Distendida, de paredes delgadas. Se observa(n) imagen(es) ecogénica(s) intraluminal(es) con sombra acústica posterior, compatible(s) con litiasis biliar. La mayor mide aproximadamente ___ mm.

COLÉDOCO: De calibre normal (___ mm).

PÁNCREAS: Sin alteraciones visibles.

RIÑONES: Normales.

CONCLUSIÓN: Litiasis vesicular. Vía biliar no dilatada.`,
  },
  {
    name: 'Riñones Normales',
    content: `ECOGRAFÍA RENAL

RIÑÓN DERECHO: Mide ___ x ___ mm. De forma y ecogenicidad normal. Buena diferenciación corticomedular. Parénquima de grosor conservado. Sin dilatación del sistema pielocalicial. No se observan imágenes litiásicas ni masas.

RIÑÓN IZQUIERDO: Mide ___ x ___ mm. De forma y ecogenicidad normal. Buena diferenciación corticomedular. Parénquima de grosor conservado. Sin dilatación del sistema pielocalicial. No se observan imágenes litiásicas ni masas.

VEJIGA: De paredes delgadas y regulares. Sin lesiones endoluminales.

CONCLUSIÓN: Ecografía renal dentro de límites normales.`,
  },
  {
    name: 'Ecografía Tiroidea Normal',
    content: `ECOGRAFÍA DE TIROIDES

LÓBULO DERECHO: Mide ___ x ___ x ___ mm. De ecogenicidad homogénea normal. Sin nódulos.

LÓBULO IZQUIERDO: Mide ___ x ___ x ___ mm. De ecogenicidad homogénea normal. Sin nódulos.

ISTMO: De grosor normal (___ mm).

VASCULARIZACIÓN: Patrón vascular normal por Doppler color.

GANGLIOS CERVICALES: No se observan adenopatías cervicales de aspecto patológico.

CONCLUSIÓN: Tiroides de tamaño, forma y ecogenicidad normal. Sin nódulos tiroideos.`,
  },
  {
    name: 'Embarazo Primer Trimestre',
    content: `ECOGRAFÍA OBSTÉTRICA - PRIMER TRIMESTRE

ÚTERO: Se observa saco gestacional intrauterino con embrión único vivo.

EMBRIÓN: Se identifica embrión con actividad cardíaca presente. Frecuencia cardíaca fetal: ___ lpm.

LONGITUD CRÁNEO-CAUDAL (LCC): ___ mm, correspondiente a ___ semanas de gestación.

SACO GESTACIONAL: De morfología regular, con diámetro medio de ___ mm.

SACO VITELINO: Presente, de tamaño normal.

ANEXOS: Ovarios de aspecto normal. No se observa líquido libre en fondo de saco.

CONCLUSIÓN: Embarazo intrauterino de ___ semanas por LCC. Embrión único vivo.
Fecha probable de parto estimada: ___`,
  },
];
