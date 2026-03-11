export type StudyStatus = 'pending' | 'in-study' | 'reported' | 'sent';

export type StudyType = string;

export interface Patient {
  id: string;
  dni: string;
  name: string;
  age: number;
  phone: string;
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
];

export const STATUS_LABELS: Record<StudyStatus, string> = {
  'pending': 'Pendiente',
  'in-study': 'En estudio',
  'reported': 'Reportado',
  'sent': 'Enviado',
};
