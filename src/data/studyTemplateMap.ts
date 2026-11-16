import { REPORT_TEMPLATES } from '@/data/reportTemplates';

/** Tipo de estudio -> nombres de plantillas candidatas. Solo relaciones claras; el médico siempre confirma. */
const MAP: Record<string, string[]> = {
  'Ecografía Abdominal': ['Ecografía Abdominal'],
  'Ecografía Hepatobiliopancreática (Abdomen Superior)': ['Ecografía Hepatobiliopancreática'],
  'Ecografía de Pared Abdominal': ['Ecografía de Pared Abdominal'],
  'Ecografía Pélvica': ['Ecografía Pélvica'],
  'Ecografía Vesical': ['Ecografía Vesical'],
  'Ecografía Prostática': ['Ecografía Prostática'],
  'Ecografía Vesical y Prostática': ['Ecografía Vesical y Prostática'],
  'Ecografía Renal': ['Ecografía Renal'],
  'Ecografía Renal y Vesicoprostática': ['Renal y Vesicoprostática'],
  'Ecografía Tiroidea': ['Ecografía Tiroidea'],
  'Ecografía de Partes Blandas de Cuello': ['Ecografía de Partes Blandas de Cuello'],
  'Ecografía Mamaria': ['Ecografía Mamaria'],
  'Ecografía Ginecológica': ['Ecografía Ginecológica'],
  'Ecografía Ginecológica Transvaginal': ['Ginecológica TV'],
  'Ecografía Mamaria y Ecografía Ginecológica Transvaginal': ['Mamaria y Ginecológica TV'],
  'Ecografía Ginecológica con Recuento Folicular': ['Ginecológica con Recuento Folicular'],
  'Ecografía Ginecológica con Monitoreo de la Ovulación': ['Ginecológica con Monitoreo de la Ovulación'],
  'Doppler Ginecológico Transvaginal': ['Doppler Ginecológico Transvaginal'],
  'Ecografía Obstétrica': ['Obstétrica 1er Trimestre', 'Ecografía Obstétrica'],
  'Ecografía Obstétrica Morfológica': ['Ecografía Obstétrica Morfológica'],
  'Ecografía Obstétrica TN': ['Ecografía Obstétrica TN'],
  'TN y Doppler Uterino': ['TN y Doppler Uterino'],
  'Ecografía Obstétrica 3D': ['Ecografía Obstétrica 3D/4D/5D'],
  'Ecografía Obstétrica 4D': ['Ecografía Obstétrica 3D/4D/5D'],
  'Ecografía Obstétrica 5D': ['Ecografía Obstétrica 3D/4D/5D'],
  'Doppler Materno-Fetal': ['Doppler Maternofetal'],
  'Ecografía Testicular': ['Ecografía Testicular'],
  'Doppler Testicular': ['Doppler Testicular'],
  'Doppler Peneano': ['Doppler Peneano'],
  'Doppler Tiroideo': ['Doppler Tiroideo'],
  'Doppler Hepático': ['Doppler Hepático'],
  'Doppler Renal': ['Ecodoppler Arterias Renales'],
  'Doppler Aorta Abdominal': ['Ecodoppler Aorta Abdominal'],
  'Doppler Oftálmico': ['Doppler Oftálmico'],
  'Ecografía Ocular': ['Ecografía Ocular'],
  'Doppler de Arterias Temporales': ['Doppler de Arterias Temporales'],
  'Ecografía Muscular': ['Ecografía Muscular'],
  'Ecografía Articular': ['Ecografía Articular'],
  'Doppler Power Articular': ['Doppler Power Articular'],
  'Ecografía de Hombro': ['Ecografía de Hombro'],
  'Ecografía de Tendón de Aquiles': ['Ecografía de Tendón de Aquiles'],
  'Ecografía de Rodilla': ['Ecografía de Rodilla'],
  'Ecografía de Muñeca': ['Ecografía de Muñeca'],
  'Ecografía de Tobillo': ['Ecografía de Tobillo'],
  'Ecografía de Codo': ['Ecografía de Codo'],
  'Ecografía de Tejido Celular Subcutáneo': ['Ecografía de Tejido Celular Subcutáneo'],
  'Ecografía de Caderas': ['Ecografía de Caderas'],
  'Ecografía Pleural': ['Ecografía Pleural'],
  'Ecografía Cerebral Transfontanelar': ['Ecografía Cerebral Transfontanelar'],
  'Doppler Arterial de Vasos de Cuello': ['Doppler Arterial de Vasos de Cuello (Carótidas)'],
  'Doppler Venoso de Vasos de Cuello': ['Doppler Venoso de Vasos de Cuello (Yugulares)'],
  'Doppler de Troncos Supraaórticos': ['Doppler de Troncos Supraaórticos'],
  'Doppler de Sustancia Nigra': ['Doppler de Sustancia Nigra'],
  'Doppler Arterial de Miembros Inferiores': ['Doppler Arterial MMII'],
  'Doppler Venoso de Miembros Inferiores (TVP)': ['Doppler Venoso MMII (TVP)'],
  'Doppler Venoso de Miembros Inferiores (Insuficiencia / Mapeo)': ['Doppler Venoso MMII (Insuficiencia / Mapeo)', 'MIV (Mapeo Insuf. Venosa)'],
  'Doppler Arterial de Miembros Superiores': ['Doppler Arterial MMSS'],
  'Doppler Venoso de Miembros Superiores': ['Doppler Venoso MMSS'],
  'Test de Función Endotelial': ['Test Función Endotelial'],

  // "Ecografía de Partes Blandas" es el estudio más cargado por las
  // secretarias cuando el pedido no especifica la zona exacta (porque la
  // orden médica no lo aclara). Por eso, al informar, el médico tiene que
  // poder elegir A MANO cualquiera de las plantillas específicas de abajo,
  // sin que eso cambie el título del turno. Ver optionsForStudy/pickForStudy
  // en templateResolve.ts: cuando hay más de una opción, no se autocarga
  // sola (canAutoLoad exige una sola plantilla por defecto), así que el
  // médico siempre elige.
  'Ecografía de Partes Blandas': [
    'Ecografía de Partes Blandas',
    'Ecografía de Hombro',
    'Ecografía de Tendón de Aquiles',
    'Ecografía de Rodilla',
    'Ecografía de Muñeca',
    'Ecografía de Tobillo',
    'Ecografía de Codo',
    'Ecografía de Tejido Celular Subcutáneo',
    'Ecografía de Partes Blandas de Cuello',
    'Ecografía de Pared Abdominal',
  ],
  'Doppler de Partes Blandas': ['Doppler de Partes Blandas'],
};

/** Plantillas sugeridas para un tipo de estudio (puede ser varios unidos con " + "). */
export function suggestTemplates(studyType: string) {
  const names: string[] = [];
  for (const part of studyType.split(' + ')) {
    for (const n of MAP[part.trim()] || []) if (!names.includes(n)) names.push(n);
  }
  return REPORT_TEMPLATES.filter((t) => names.includes(t.name));
}

/** Estudio de la lista al que corresponde una plantilla de la app (para sugerirlo al crear tu versión). */
export function studyForTemplate(templateName: string): string {
  const hit = Object.entries(MAP).find(([, names]) => names.includes(templateName));
  return hit ? hit[0] : '';
}
