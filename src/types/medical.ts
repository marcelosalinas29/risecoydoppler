export type StudyStatus = 'pending' | 'in-study' | 'reported' | 'sent' | 'cancelled' | 'no-show';

/** Turno cancelado o ausente: se marca, no se borra, y libera el horario. */
export function isInactiveStatus(status: string): boolean {
  return status === 'cancelled' || status === 'no-show';
}

export type StudyType = string;

/** Llegada del paciente a la sala: llegó (verde), demorado / avisó (amarillo), no llegó (rojo). null = sin marcar. */
export type ArrivalState = 'arrived' | 'late' | 'missed' | null;
export const ARRIVAL_LABELS: Record<'arrived' | 'late' | 'missed', string> = {
  arrived: 'Llegó',
  late: 'Demorado / avisó',
  missed: 'No llegó',
};
export function resolveArrival(a: { arrivalState?: ArrivalState; asistio?: boolean }): ArrivalState {
  return a.arrivalState ?? (a.asistio ? 'arrived' : null);
}

export interface Patient {
  id: string;
  dni: string;
  name: string;
  age: number;
  phone: string;
  fechaNacimiento?: string; // ISO date
  obraSocial?: string;
  dniTipo?: string; // 'DNI' | 'PASAPORTE' | 'OTRO'
  dniMaterno?: boolean; // recién nacido que usa el DNI de la madre
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  studyType: string;
  status: StudyStatus;
  date: string; // ISO date
  time: string; // HH:mm
  report: string;
  images: string[]; // base64 data URLs (legacy)
  imageUrls: string[]; // Storage URLs (new)
  observations?: string;
  reportedBy?: string | null;
  asistio: boolean;
  arrivalState?: ArrivalState; // llegada del paciente: null = sin marcar
  wasBypassed?: boolean; // se lo saltó el "próximo turno" (llegó tarde o no vino en su momento)
  rejoinedAt?: string | null; // cuándo volvió a marcarse "llegó" después de haber sido salteado
  createdAt: string;
  doctorId?: string | null; // médico asignado al turno (los turnos viejos no tienen)
  sobreturnoAcordadoCon?: string | null; // con quién se acordó un sobreturno fuera del horario del médico
  esSobreturno?: boolean; // se atiende por encima de la agenda: no ocupa ni bloquea horarios
}

export function normalizeDni(dni?: string | null): string {
  return (dni || '').toUpperCase().replace(/[\s.\-_/]/g, '').trim();
}

/** Al escribir el DNI: sin puntos, espacios ni guiones, sin importar cómo se tipee. Conserva letras (documentos extranjeros). */
export function cleanDniInput(value: string): string {
  return value.toUpperCase().replace(/[\s.\-_/]/g, '');
}

/** Teléfono: característica por defecto de Argentina (celular), modificable. */
export const PHONE_DEFAULT_PREFIX = '+549';
export function cleanPhoneInput(value: string): string {
  return value.replace(/[\s.\-()]/g, '');
}
/** Hay un número real si, además de la característica, quedan más de 4 dígitos. */
export function hasPhoneNumber(value: string): boolean {
  return value.replace(/\D/g, '').length > 6;
}
/** Qué se guarda: vacío si solo quedó la característica por defecto. */
export function phoneToSave(value: string): string {
  const v = cleanPhoneInput(value);
  return hasPhoneNumber(v) ? v : '';
}

/** Arma el nombre completo: primero apellido, después nombres. */
export function composePatientName(apellido: string, nombres: string): string {
  return `${apellido.trim()} ${nombres.trim()}`.replace(/\s+/g, ' ').trim();
}

/** DNI que sirve para reconocer a la persona. Un recién nacido con DNI de la madre NO se une con ella. */
export function identityDni(patient: Pick<Patient, 'dni' | 'dniMaterno'>): string {
  return patient.dniMaterno ? '' : normalizeDni(patient.dni);
}

export const DNI_TIPOS: { value: string; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'OTRO', label: 'Otro documento' },
];

export function getPatientHistoryKey(patient: Pick<Patient, 'id' | 'dni' | 'dniMaterno'>): string {
  const normalizedDni = identityDni(patient);
  return normalizedDni ? `dni:${normalizedDni}` : `patient:${patient.id}`;
}

export const STUDY_TYPES: string[] = [
  // Abdominal / general
  'Ecografía Abdominal',
  'Ecografía Hepatobiliopancreática (Abdomen Superior)',
  'Ecografía de Pared Abdominal',
  'Ecografía Renal',
  'Ecografía Renal y Vesicoprostática',
  'Ecografía Vesical',
  'Ecografía Prostática',
  'Ecografía Vesical y Prostática',
  'Ecografía Pélvica',
  // Tiroides / cuello
  'Ecografía Tiroidea',
  'Ecografía de Partes Blandas de Cuello',
  // Mamaria / ginecológica
  'Ecografía Mamaria',
  'Ecografía Ginecológica',
  'Ecografía Ginecológica Transvaginal',
  'Ecografía Mamaria y Ecografía Ginecológica Transvaginal',
  'Ecografía Ginecológica con Recuento Folicular',
  'Ecografía Ginecológica con Monitoreo de la Ovulación',
  'Doppler Ginecológico Transvaginal',
  // Obstétrica
  'Ecografía Obstétrica',
  'Ecografía Obstétrica Morfológica',
  'Ecografía Obstétrica TN',
  'TN y Doppler Uterino',
  'Ecografía Obstétrica 3D',
  'Ecografía Obstétrica 4D',
  'Ecografía Obstétrica 5D',
  'Doppler Materno-Fetal',
  // Testicular / peneano
  'Ecografía Testicular',
  'Doppler Testicular',
  'Doppler Peneano',
  // Otros órganos (Doppler)
  'Doppler Tiroideo',
  'Doppler Hepático',
  'Doppler Renal',
  'Doppler Aorta Abdominal',
  'Doppler Oftálmico',
  'Ecografía Ocular',
  'Doppler de Arterias Temporales',
  // Partes blandas / articular
  'Ecografía de Partes Blandas',
  'Doppler de Partes Blandas',
  'Ecografía Muscular',
  'Ecografía Articular',
  'Doppler Power Articular',
  'Ecografía de Hombro',
  'Ecografía de Tendón de Aquiles',
  'Ecografía de Rodilla',
  'Ecografía de Muñeca',
  'Ecografía de Tobillo',
  'Ecografía de Codo',
  'Ecografía de Tejido Celular Subcutáneo',
  'Ecografía de Caderas',
  // Pleural / cerebral
  'Ecografía Pleural',
  'Ecografía Cerebral Transfontanelar',
  // Doppler de cuello
  'Doppler Arterial de Vasos de Cuello',
  'Doppler Venoso de Vasos de Cuello',
  'Doppler de Troncos Supraaórticos',
  'Doppler de Sustancia Nigra',
  // Doppler de miembros
  'Doppler Arterial de Miembros Inferiores',
  'Doppler Venoso de Miembros Inferiores (TVP)',
  'Doppler Venoso de Miembros Inferiores (Insuficiencia / Mapeo)',
  'Doppler Arterial de Miembros Superiores',
  'Doppler Venoso de Miembros Superiores',
  // Funcional / procedimientos
  'Test de Función Endotelial',
  'Punción Aspiración con Aguja Fina (PAAF) guiada por Ecografía',
  'Biopsia con Aguja Gruesa (Trucut) guiada por Ecografía',
];

/** Texto "pelado" para comparar (sin tildes, mayúsculas, sin puntuación de los costados). */
function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca tildes
    .toUpperCase()
    .replace(/[.,;:()]/g, ' ') // paréntesis también se ignoran (ej. "MMII (TVP)")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Diccionario de sinónimos / jerga / abreviaturas que anotan las secretarias,
 * mapeado al nombre OFICIAL del estudio (el que figura en STUDY_TYPES). La
 * clave ya está normalizada (ver normalizeForMatch). Esto es lo que permite
 * que no importe cómo se tipee: el título final siempre es el oficial.
 */
const STUDY_TYPE_SYNONYMS: Record<string, string> = {
  'SCAN FETAL': 'Ecografía Obstétrica Morfológica',
  'ECOGRAFIA MORFOLOGICA': 'Ecografía Obstétrica Morfológica',
  'ECOGRAFIA OBSTETRICA MORFOLOGICA': 'Ecografía Obstétrica Morfológica',
  'MORFOLOGICA': 'Ecografía Obstétrica Morfológica',
  '5D': 'Ecografía Obstétrica 5D',
  'ECOGRAFIA 5D': 'Ecografía Obstétrica 5D',
  'ECOGRAFIA OBSTETRICA 5D': 'Ecografía Obstétrica 5D',
  '4D': 'Ecografía Obstétrica 4D',
  'ECOGRAFIA 4D': 'Ecografía Obstétrica 4D',
  'ECOGRAFIA OBSTETRICA 4D': 'Ecografía Obstétrica 4D',
  '3D': 'Ecografía Obstétrica 3D',
  'ECOGRAFIA 3D': 'Ecografía Obstétrica 3D',
  'ECOGRAFIA OBSTETRICA 3D': 'Ecografía Obstétrica 3D',
  'TN': 'Ecografía Obstétrica TN',
  'ECOGRAFIA OBSTETRICA TN': 'Ecografía Obstétrica TN',
  'TB': 'Ecografía de Partes Blandas',
  'PB': 'Ecografía de Partes Blandas',
  'PARTES': 'Ecografía de Partes Blandas',
  'ECOGRAFIA TB': 'Ecografía de Partes Blandas',
  'ECOGRAFIA PB': 'Ecografía de Partes Blandas',
  'TEJIDOS BLANDOS': 'Ecografía de Partes Blandas',
  'ECOGRAFIA DE TEJIDOS BLANDOS': 'Ecografía de Partes Blandas',
  'ECOGRAFIA DE TEJIDO BLANDO': 'Ecografía de Partes Blandas',
  'DOPPLER PB': 'Doppler de Partes Blandas',
  'DOPPLER TB': 'Doppler de Partes Blandas',
  'TV': 'Ecografía Ginecológica Transvaginal',
  'ECOGRAFIA TV': 'Ecografía Ginecológica Transvaginal',
  'ECOGRAFIA TRANSVAGINAL': 'Ecografía Ginecológica Transvaginal',
  'TRANSVAGINAL': 'Ecografía Ginecológica Transvaginal',
  'GINECOLOGICA TV': 'Ecografía Ginecológica Transvaginal',
  'ECOGRAFIA GINECOLOGICA TV': 'Ecografía Ginecológica Transvaginal',
  'GINECOLOGICA TRANSVAGINAL': 'Ecografía Ginecológica Transvaginal',
  'MAMARIA Y TRANSVAGINAL': 'Ecografía Mamaria y Ecografía Ginecológica Transvaginal',
  'ECOGRAFIA MAMARIA Y TRANSVAGINAL': 'Ecografía Mamaria y Ecografía Ginecológica Transvaginal',
  'MAMARIA Y GINECOLOGICA TV': 'Ecografía Mamaria y Ecografía Ginecológica Transvaginal',
  'ECOGRAFIA MAMARIA Y GINECOLOGICA TV': 'Ecografía Mamaria y Ecografía Ginecológica Transvaginal',
  'RECUENTO FOLICULAR': 'Ecografía Ginecológica con Recuento Folicular',
  'MONITOREO DE LA OVULACION': 'Ecografía Ginecológica con Monitoreo de la Ovulación',
  'MONITOREO OVULACION': 'Ecografía Ginecológica con Monitoreo de la Ovulación',
  'CADERITAS': 'Ecografía de Caderas',
  'CADERA': 'Ecografía de Caderas',
  'CEREBRO': 'Ecografía Cerebral Transfontanelar',
  'ECOGRAFIA CEREBRAL': 'Ecografía Cerebral Transfontanelar',
  'TRANSFONTANELAR': 'Ecografía Cerebral Transfontanelar',
  'PLEURA': 'Ecografía Pleural',
  'ECOGRAFIA PLEURAL': 'Ecografía Pleural',
  'MAPEO': 'Doppler Venoso de Miembros Inferiores (Insuficiencia / Mapeo)',
  'MAPEO VENOSO': 'Doppler Venoso de Miembros Inferiores (Insuficiencia / Mapeo)',
  'TVP': 'Doppler Venoso de Miembros Inferiores (TVP)',
  'TSA': 'Doppler de Troncos Supraaórticos',
  'ECO DOPPLER TSA': 'Doppler de Troncos Supraaórticos',
  'DOPPLER TSA': 'Doppler de Troncos Supraaórticos',
  'DOPPLER DE TRONCOS SUPRAAORTICOS': 'Doppler de Troncos Supraaórticos',
  'DOPPLER DE VASOS DE CUELLO': 'Doppler de Troncos Supraaórticos',
  'ECOGRAFIA DOPPLER DE VASOS DE CUELLO': 'Doppler de Troncos Supraaórticos',
  'DOPPLER ARTERIAL MMII': 'Doppler Arterial de Miembros Inferiores',
  'ECO DOPPLER ARTERIAL MMII': 'Doppler Arterial de Miembros Inferiores',
  'DOPPLER VENOSO MMII': 'Doppler Venoso de Miembros Inferiores (Insuficiencia / Mapeo)',
  'ECO DOPPLER VENOSO MMII': 'Doppler Venoso de Miembros Inferiores (Insuficiencia / Mapeo)',
  'ECO DOPPLER VENOSO MMII TVP': 'Doppler Venoso de Miembros Inferiores (TVP)',
  'DOPPLER ARTERIAL MMSS': 'Doppler Arterial de Miembros Superiores',
  'ECO DOPPLER ARTERIAL MMSS': 'Doppler Arterial de Miembros Superiores',
  'DOPPLER VENOSO MMSS': 'Doppler Venoso de Miembros Superiores',
  'ECO DOPPLER VENOSO MMSS': 'Doppler Venoso de Miembros Superiores',
  'DOPPLER RENAL': 'Doppler Renal',
  'ECO DOPPLER ARTERIAS RENALES': 'Doppler Renal',
  'ECO DOPPLER RENAL': 'Doppler Renal',
  'DOPPLER HEPATICO': 'Doppler Hepático',
  'ECO DOPPLER HEPATICO': 'Doppler Hepático',
  'DOPPLER AORTA ABDOMINAL': 'Doppler Aorta Abdominal',
  'ECO DOPPLER AORTA ABDOMINAL': 'Doppler Aorta Abdominal',
  'SUSTANCIA NIGRA': 'Doppler de Sustancia Nigra',
  'ECO DOPPLER SUSTANCIA NIGRA': 'Doppler de Sustancia Nigra',
  'DOPPLER TESTICULAR': 'Doppler Testicular',
  'DOPPLER TIROIDEO': 'Doppler Tiroideo',
  'DOPPLER OFTALMICO': 'Doppler Oftálmico',
  'OCULAR': 'Ecografía Ocular',
  'ECOGRAFIA OCULAR': 'Ecografía Ocular',
  'DOPPLER ARTERIAS TEMPORALES': 'Doppler de Arterias Temporales',
  'DOPPLER TEMPORALES': 'Doppler de Arterias Temporales',
  'DOPPLER PENEANO': 'Doppler Peneano',
  'DOPPLER DE ARTERIAS PENEANAS': 'Doppler Peneano',
  'POWER DOPPLER ARTICULAR': 'Doppler Power Articular',
  'DOPPLER POWER ARTICULAR': 'Doppler Power Articular',
  'DOPPLER ARTICULAR': 'Doppler Power Articular',
  'AQUILES': 'Ecografía de Tendón de Aquiles',
  'TENDON DE AQUILES': 'Ecografía de Tendón de Aquiles',
  'MUÑECA': 'Ecografía de Muñeca',
  'MUNECA': 'Ecografía de Muñeca',
  'TOBILLO': 'Ecografía de Tobillo',
  'CODO': 'Ecografía de Codo',
  'RODILLA': 'Ecografía de Rodilla',
  'TEJIDO CELULAR SUBCUTANEO': 'Ecografía de Tejido Celular Subcutáneo',
  'TCS': 'Ecografía de Tejido Celular Subcutáneo',
  'PARTES BLANDAS DE CUELLO': 'Ecografía de Partes Blandas de Cuello',
  'PAROTIDA': 'Ecografía de Partes Blandas de Cuello',
  'GLANDULAS SALIVALES': 'Ecografía de Partes Blandas de Cuello',
  'PARED ABDOMINAL': 'Ecografía de Pared Abdominal',
  'HERNIA': 'Ecografía de Pared Abdominal',
  'HERNIA INGUINAL': 'Ecografía de Pared Abdominal',
  'HERNIA UMBILICAL': 'Ecografía de Pared Abdominal',
};

/**
 * Términos que las secretarias a veces anotan pero que NO son un estudio
 * médico real: en vez de mapear solo, hay que preguntar y sugerir la opción
 * correcta (ej. "pulmón" no existe como ecografía; lo real es pleural).
 */
const STUDY_TYPE_NEEDS_CONFIRMATION: Record<string, string> = {
  'PULMON': 'Ecografía Pleural',
  'PULMONES': 'Ecografía Pleural',
  'ECOGRAFIA DE PULMON': 'Ecografía Pleural',
  'ECOGRAFIA DE PULMONES': 'Ecografía Pleural',
  'ECOGRAFIA PULMONAR': 'Ecografía Pleural',
};

/** Marca visible (en rojo) cuando se cargó "Ecografía" sin especificar de qué, a la espera de que se corrija. */
export const PENDING_DEFINITION_SUFFIX = ' (PENDIENTE DE DEFINIR)';

export function isPendingDefinition(studyType: string): boolean {
  return studyType.includes(PENDING_DEFINITION_SUFFIX);
}

export type StudyTextResolution =
  | { kind: 'empty' }
  | { kind: 'bare' } // "Ecografía" sola, sin especificar
  | { kind: 'needs_confirmation'; suggestion: string }
  | { kind: 'matched'; canonical: string }
  | { kind: 'freeform'; text: string };

/**
 * Analiza lo que escribió la secretaria en el campo de texto libre y decide
 * qué hacer: reconocerlo y traducirlo al nombre oficial, dejarlo pasar tal
 * cual (si no hay ninguna coincidencia, es un estudio realmente nuevo/raro),
 * o pedir confirmación (si es ambiguo o no es un estudio real).
 */
export function resolveStudyTypeText(raw: string): StudyTextResolution {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'empty' };
  const norm = normalizeForMatch(trimmed);
  if (norm === 'ECOGRAFIA' || norm === 'ECO') return { kind: 'bare' };
  if (STUDY_TYPE_NEEDS_CONFIRMATION[norm]) {
    return { kind: 'needs_confirmation', suggestion: STUDY_TYPE_NEEDS_CONFIRMATION[norm] };
  }
  if (STUDY_TYPE_SYNONYMS[norm]) return { kind: 'matched', canonical: STUDY_TYPE_SYNONYMS[norm] };
  // ¿Ya es exactamente uno de los nombres oficiales (con otra may/min o tildes)?
  const exact = STUDY_TYPES.find((t) => normalizeForMatch(t) === norm);
  if (exact) return { kind: 'matched', canonical: exact };
  // Última chance antes de darlo por texto libre: si coincide, sin ambigüedad,
  // con el nombre de un solo estudio de la lista (coincidencia parcial), se
  // toma ese. Si hay más de uno que coincide, queda como texto libre (mejor
  // pedir que se aclare que adivinar mal).
  if (norm.length >= 4) {
    const partial = STUDY_TYPES.filter((t) => normalizeForMatch(t).includes(norm));
    if (partial.length === 1) return { kind: 'matched', canonical: partial[0] };
  }
  return { kind: 'freeform', text: trimmed };
}

/**
 * Divide un texto en varios estudios (separados por "+" o coma) y resuelve
 * cada uno por separado. Así, aunque se escriban varios estudios juntos en
 * el cuadro de texto libre, cada uno se reconoce individualmente en vez de
 * quedar todo como un solo texto libre sin reconocer.
 */
export function resolveMultipleStudyTexts(raw: string): { text: string; resolution: StudyTextResolution }[] {
  return raw.split(/[+,]/).map((s) => s.trim()).filter(Boolean)
    .map((text) => ({ text, resolution: resolveStudyTypeText(text) }));
}

/**
 * Sugerencias de estudios oficiales (de la lista, o por apodo/abreviatura
 * conocida) que coinciden con lo que se va escribiendo. Para el autocompletado
 * del cuadro de texto libre: así, si ya existe en la lista, se tilda en vez
 * de dejarlo como texto libre.
 */
export function suggestStudyTypes(query: string, limit = 6): string[] {
  const q = normalizeForMatch(query);
  if (!q) return [];
  const results: string[] = [];
  const add = (name: string) => { if (!results.includes(name)) results.push(name); };
  for (const t of STUDY_TYPES) {
    if (normalizeForMatch(t).includes(q)) add(t);
  }
  for (const [alias, canonical] of Object.entries(STUDY_TYPE_SYNONYMS)) {
    if (alias.includes(q)) add(canonical);
  }
  return results.slice(0, limit);
}

/**
 * Orden fijo de las combinaciones (ej. "Mamaria + Ginecológica" siempre en
 * el mismo orden, sin importar en qué orden se tildaron). Los estudios que
 * no están en el catálogo oficial (texto libre) van al final, en el orden
 * en que se escribieron.
 */
export function orderStudyParts(parts: string[]): string[] {
  const known = parts.filter((p) => STUDY_TYPES.includes(p));
  const unknown = parts.filter((p) => !STUDY_TYPES.includes(p));
  known.sort((a, b) => STUDY_TYPES.indexOf(a) - STUDY_TYPES.indexOf(b));
  return [...known, ...unknown];
}

export const STATUS_LABELS: Record<StudyStatus, string> = {
  'pending': 'Pendiente',
  'in-study': 'En estudio',
  'reported': 'Reportado',
  'sent': 'Enviado',
  'cancelled': 'Cancelado',
  'no-show': 'Ausente',
};

/** Calculate age in years from birth date (legacy, returns number of years) */
export function calcularEdad(fechaNacimiento: string | Date): number {
  const birth = new Date(fechaNacimiento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export type EdadUnit = 'días' | 'semanas' | 'meses' | 'años';
export interface EdadDetallada {
  value: number;
  unit: EdadUnit;
}

/**
 * Calendar-exact age with smart unit:
 *  < 7 días → días
 *  7 días a < 1 mes → semanas
 *  1 mes a < 1 año → meses
 *  ≥ 1 año → años
 */
export function calcularEdadDetallada(fechaNacimiento: string | Date): EdadDetallada {
  const birth = typeof fechaNacimiento === 'string'
    ? (() => {
        const [y, m, d] = fechaNacimiento.split('T')[0].split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
      })()
    : new Date(fechaNacimiento);
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthMid = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());

  // Years (calendar-exact)
  let years = todayMid.getFullYear() - birthMid.getFullYear();
  const monthDiff = todayMid.getMonth() - birthMid.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && todayMid.getDate() < birthMid.getDate())) {
    years--;
  }
  if (years >= 1) return { value: years, unit: 'años' };

  // Months (calendar-exact)
  let months = (todayMid.getFullYear() - birthMid.getFullYear()) * 12 + (todayMid.getMonth() - birthMid.getMonth());
  if (todayMid.getDate() < birthMid.getDate()) months--;
  if (months >= 1) return { value: months, unit: 'meses' };

  // Days
  const days = Math.max(0, Math.floor((todayMid.getTime() - birthMid.getTime()) / 86400000));
  if (days >= 7) return { value: Math.floor(days / 7), unit: 'semanas' };
  return { value: days, unit: 'días' };
}

/** Formatted string e.g. "3 meses", "44 años" */
export function formatEdad(fechaNacimiento?: string | Date | null, fallbackYears?: number): string {
  if (fechaNacimiento) {
    const e = calcularEdadDetallada(fechaNacimiento);
    return `${e.value} ${e.unit}`;
  }
  if (typeof fallbackYears === 'number') return `${fallbackYears} años`;
  return '';
}

/** 
 * Calculate study duration in minutes based on study type.
 * Doppler / Obstétrica Morfológica / Obstétrica TN / Scan Fetal → 20 min
 * Combinados con Doppler → 20 min
 * Punción / biopsia guiada por ecografía → 30 min (3 turnos)
 * Otherwise → uses the doctor's base interval (default 10)
 */
export function getStudyDuration(studyType: string, baseInterval: number = 10): number {
  if (!studyType) return baseInterval;
  const upper = studyType.toUpperCase();
  const parts = upper.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);

  const isSpecial = (s: string) =>
    s.includes('DOPPLER') ||
    s.includes('MORFOLÓGICA') ||
    s.includes('MORFOLOGICA') ||
    s.includes(' TN') ||
    s.startsWith('TN ') ||
    s === 'TN' ||
    s.includes('SCAN FETAL') ||
    s.includes('DOPPLER MATERNO') ||
    s.includes('TEST DE FUNCIÓN ENDOTELIAL') ||
    s.includes('TEST DE FUNCION ENDOTELIAL');

  // Punciones y biopsias guiadas por ecografía: 3 turnos (30 min)
  const isTriple = (s: string) =>
    s.includes('PUNCIÓN') || s.includes('PUNCION') || s.includes('BIOPSIA') || s.includes('PAAF') || s.includes('TRUCUT');

  if (parts.some(isTriple)) return 30;
  if (parts.some(isSpecial)) return 20;
  return baseInterval;
}

/** Format study type string: replace "+" with "," and last with "y" */
/** Abreviaturas que se escriben completas en cualquier lugar donde se muestre el nombre del estudio. */
const STUDY_ABBREVIATIONS: [RegExp, string][] = [
  [/^ECO DOPPLER\b/, 'DOPPLER'],
  [/^ECO\b(?!GRAF)/, 'ECOGRAFÍA'],
  [/\bMMII\b/g, 'DE MIEMBROS INFERIORES'],
  [/\bMMSS\b/g, 'DE MIEMBROS SUPERIORES'],
  [/\bTVP\b/g, 'TROMBOSIS VENOSA PROFUNDA'],
  [/\bTSA\b/g, 'TRONCOS SUPRAAÓRTICOS'],
  [/\bTN\b/g, 'TRANSLUCENCIA NUCAL'],
  [/\bTV\b/g, 'TRANSVAGINAL'],
  [/\bABD\.?(?=\s|$)/g, 'ABDOMINAL'],
];

/** Nombre completo del estudio: mayúscula y sin abreviar (los estudios viejos guardados abreviados también se ven completos). */
export function expandStudyName(name: string): string {
  let out = name.toUpperCase().replace(/\s+/g, ' ').trim();
  for (const [re, full] of STUDY_ABBREVIATIONS) out = out.replace(re, full);
  return out.replace(/\s+/g, ' ').trim();
}

/** El protocolo (TVP, Insuficiencia/Mapeo) solo orienta al médico qué plantilla usar: no va en el título del estudio. */
export function studyTitle(name: string): string {
  const pending = isPendingDefinition(name);
  const clean = name.replace(PENDING_DEFINITION_SUFFIX, '').replace(/\s*\((TVP|Insuficiencia\s*\/\s*Mapeo)\)/gi, '');
  const title = expandStudyName(clean);
  return pending ? `${title} ⚠ PENDIENTE DE DEFINIR` : title;
}

/** Protocolo entre paréntesis (solo identificativo para el médico), si lo tiene. */
export function studyProtocol(name: string): string {
  const m = name.match(/\((TVP|Insuficiencia\s*\/\s*Mapeo)\)/i);
  if (!m) return '';
  return m[1].toUpperCase() === 'TVP' ? 'Protocolo: trombosis venosa profunda' : 'Protocolo: insuficiencia venosa / mapeo';
}

export function formatStudyType(studyType: string): string {
  const parts = studyType.split(/\s*\+\s*/).map(s => studyTitle(s)).filter(Boolean);
  if (parts.length <= 1) return parts[0] || studyType.toUpperCase();
  if (parts.length === 2) return `${parts[0]} Y ${parts[1]}`;
  return parts.slice(0, -1).join(', ') + ' Y ' + parts[parts.length - 1];
}
