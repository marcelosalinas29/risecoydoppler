export type StudyStatus = 'pending' | 'in-study' | 'reported' | 'sent';

export type StudyType =
  | 'Ecografía Abdominal'
  | 'Ecografía Tiroidea'
  | 'Ecografía Obstétrica'
  | 'Ecografía Pélvica'
  | 'Ecografía Renal'
  | 'Ecografía de Tejidos Blandos'
  | 'Ecografía Mamaria'
  | 'Ecografía Doppler';

export interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  studyType: StudyType;
  status: StudyStatus;
  date: string; // ISO date
  time: string; // HH:mm
  report: string;
  images: string[]; // base64 data URLs
  createdAt: string;
}

export const STUDY_TYPES: StudyType[] = [
  'Ecografía Abdominal',
  'Ecografía Tiroidea',
  'Ecografía Obstétrica',
  'Ecografía Pélvica',
  'Ecografía Renal',
  'Ecografía de Tejidos Blandos',
  'Ecografía Mamaria',
  'Ecografía Doppler',
];

export const STATUS_LABELS: Record<StudyStatus, string> = {
  'pending': 'Pendiente',
  'in-study': 'En estudio',
  'reported': 'Reportado',
  'sent': 'Enviado',
};
