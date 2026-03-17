export type StudyStatus = 'pending' | 'in-study' | 'reported' | 'sent';

export type StudyType = string;

export interface Patient {
  id: string;
  dni: string;
  name: string;
  age: number;
  phone: string;
  fechaNacimiento?: string; // ISO date
  obraSocial?: string;
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
  images: string[]; // base64 data URLs
  observations?: string;
  reportedBy?: string | null;
  asistio: boolean;
  createdAt: string;
}

export const STUDY_TYPES: string[] = [
  'Ecografía Abdominal',
  'Ecografía Tiroidea',
  'Ecografía Obstétrica',
  'Ecografía Pélvica',
  'Ecografía Renal',
  'Ecografía de Tejidos Blandos',
  'Ecografía Mamaria',
  'Ecografía Doppler',
  'Ecografía Vesical',
  'Ecografía Prostática',
  'Ecografía Vesical y Prostática',
  'Ecografía Transvaginal',
  'Ecografía Ginecológica',
  'Ecografía Mamaria y Transvaginal',
  'Ecografía Testicular',
  'Ecografía de Partes Blandas',
  'Ecografía Muscular',
  'Ecografía Articular',
  'Ecografía Doppler Venoso',
  'Ecografía Doppler Arterial',
  'Ecografía Doppler de Vasos de Cuello',
  'Ecografía Mamaria y Ginecológica TV',
  'Ecografía Renal y Vesicoprostática',
  'Ecografía Cerebral',
  'Ecografía de Caderas',
  'Ecografía de Hombro',
  'TN y Doppler Uterino',
  'Scan Fetal',
  'Doppler Materno-Fetal',
  'Eco Doppler Aorta Abdominal',
  'Eco Doppler Arterias Renales',
  'Eco Doppler Hepático',
  'Eco Doppler TSA',
  'Eco Doppler Sustancia Nigra',
  'Eco Doppler Arterial MMII',
  'Eco Doppler Venoso MMII',
  'Eco Doppler Arterial MMSS',
  'Test de Función Endotelial',
];

export const STATUS_LABELS: Record<StudyStatus, string> = {
  'pending': 'Pendiente',
  'in-study': 'En estudio',
  'reported': 'Reportado',
  'sent': 'Enviado',
};

/** Calculate age from birth date */
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

/** Format study type string: replace "+" with "," and last with "y" */
export function formatStudyType(studyType: string): string {
  const parts = studyType.split(/\s*\+\s*/).map(s => s.trim().toUpperCase()).filter(Boolean);
  if (parts.length <= 1) return parts[0] || studyType.toUpperCase();
  if (parts.length === 2) return `${parts[0]} Y ${parts[1]}`;
  return parts.slice(0, -1).join(', ') + ' Y ' + parts[parts.length - 1];
}
