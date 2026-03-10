import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appointment, Patient, StudyStatus, StudyType } from '@/types/medical';

interface ClinicStore {
  patients: Patient[];
  appointments: Appointment[];
  addPatient: (patient: Omit<Patient, 'id'>) => Patient;
  addAppointment: (data: { patientId: string; studyType: StudyType; date: string; time: string }) => Appointment;
  updateAppointmentStatus: (id: string, status: StudyStatus) => void;
  updateAppointmentReport: (id: string, report: string) => void;
  updateAppointmentStudyType: (id: string, studyType: string) => void;
  addImagesToAppointment: (id: string, images: string[]) => void;
  removeImageFromAppointment: (id: string, index: number) => void;
  getAppointmentsByDate: (date: string) => Appointment[];
  getPatientAppointments: (patientId: string) => Appointment[];
  searchPatients: (query: string) => Patient[];
  getAppointment: (id: string) => Appointment | undefined;
  getPatient: (id: string) => Patient | undefined;
}

const generateId = () => crypto.randomUUID();

export const useClinicStore = create<ClinicStore>()(
  persist(
    (set, get) => ({
      patients: [],
      appointments: [],

      addPatient: (data) => {
        const patient: Patient = { ...data, id: generateId() };
        set((s) => ({ patients: [...s.patients, patient] }));
        return patient;
      },

      addAppointment: (data) => {
        const patient = get().patients.find((p) => p.id === data.patientId);
        if (!patient) throw new Error('Patient not found');
        const appointment: Appointment = {
          id: generateId(),
          patientId: data.patientId,
          patient,
          studyType: data.studyType,
          status: 'pending',
          date: data.date,
          time: data.time,
          report: '',
          images: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ appointments: [...s.appointments, appointment] }));
        return appointment;
      },

      updateAppointmentStatus: (id, status) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      updateAppointmentReport: (id, report) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, report } : a)),
        })),

      addImagesToAppointment: (id, images) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, images: [...a.images, ...images] } : a
          ),
        })),

      removeImageFromAppointment: (id, index) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, images: a.images.filter((_, i) => i !== index) } : a
          ),
        })),

      getAppointmentsByDate: (date) =>
        get().appointments.filter((a) => a.date === date),

      getPatientAppointments: (patientId) =>
        get()
          .appointments.filter((a) => a.patientId === patientId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      searchPatients: (query) => {
        const q = query.toLowerCase();
        return get().patients.filter(
          (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q)
        );
      },

      getAppointment: (id) => get().appointments.find((a) => a.id === id),
      getPatient: (id) => get().patients.find((p) => p.id === id),
    }),
    {
      name: 'clinic-store',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // Quota exceeded – remove images from stored data to free space
            try {
              const slim = JSON.parse(JSON.stringify(value));
              if (slim?.state?.appointments) {
                slim.state.appointments = slim.state.appointments.map((a: any) => ({
                  ...a,
                  images: [],
                }));
              }
              localStorage.setItem(name, JSON.stringify(slim));
            } catch {
              // silently fail
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
