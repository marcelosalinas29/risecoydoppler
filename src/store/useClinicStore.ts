import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Appointment, Patient, StudyStatus } from '@/types/medical';
import { calcularEdad } from '@/types/medical';

interface ClinicStore {
  patients: Patient[];
  appointments: Appointment[];
  loading: boolean;
  fetchPatients: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id' | 'age'> & { age?: number }) => Promise<Patient>;
  addAppointment: (data: { patientId: string; studyType: string; date: string; time: string }) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: StudyStatus) => Promise<void>;
  updateAppointmentReport: (id: string, report: string) => Promise<void>;
  updateAppointmentStudyType: (id: string, studyType: string) => Promise<void>;
  addImagesToAppointment: (id: string, images: string[]) => Promise<void>;
  removeImageFromAppointment: (id: string, index: number) => Promise<void>;
  getAppointmentsByDate: (date: string) => Appointment[];
  getPatientAppointments: (patientId: string) => Appointment[];
  searchPatients: (query: string) => Patient[];
  getAppointment: (id: string) => Appointment | undefined;
  getPatient: (id: string) => Patient | undefined;
  findPatientByDni: (dni: string) => Promise<Patient | null>;
}

export const useClinicStore = create<ClinicStore>()((set, get) => ({
  patients: [],
  appointments: [],
  loading: false,

  fetchPatients: async () => {
    const { data } = await supabase.from('patients').select('*').order('name');
    if (data) {
      set({
        patients: data.map((p: any) => ({
          id: p.id,
          dni: p.dni || '',
          name: p.name,
          age: p.fecha_nacimiento ? calcularEdad(p.fecha_nacimiento) : p.age,
          phone: p.phone,
          fechaNacimiento: p.fecha_nacimiento || undefined,
          obraSocial: p.obra_social || '',
        })),
      });
    }
  },

  fetchAppointments: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('appointments')
      .select('*, patients(*)')
      .order('created_at', { ascending: false });
    if (data) {
      set({
        appointments: data.map((a: any) => ({
          id: a.id,
          patientId: a.patient_id,
          patient: {
            id: a.patients.id,
            dni: a.patients.dni || '',
            name: a.patients.name,
            age: a.patients.fecha_nacimiento ? calcularEdad(a.patients.fecha_nacimiento) : a.patients.age,
            phone: a.patients.phone,
            fechaNacimiento: a.patients.fecha_nacimiento || undefined,
            obraSocial: a.patients.obra_social || '',
          },
          studyType: a.study_type,
          status: a.status as StudyStatus,
          date: a.date,
          time: a.time,
          report: a.report || '',
          images: (a.images as string[]) || [],
          createdAt: a.created_at,
        })),
      });
    }
    set({ loading: false });
  },

  addPatient: async (data) => {
    const age = data.fechaNacimiento ? calcularEdad(data.fechaNacimiento) : (data.age || 0);
    const { data: inserted, error } = await supabase
      .from('patients')
      .insert({
        dni: data.dni,
        name: data.name,
        age,
        phone: data.phone,
        fecha_nacimiento: data.fechaNacimiento || null,
        obra_social: data.obraSocial || '',
      } as any)
      .select()
      .single();
    if (error) throw error;
    const patient: Patient = {
      id: inserted.id,
      dni: inserted.dni || '',
      name: inserted.name,
      age,
      phone: inserted.phone,
      fechaNacimiento: (inserted as any).fecha_nacimiento || undefined,
      obraSocial: (inserted as any).obra_social || '',
    };
    set((s) => ({ patients: [...s.patients, patient] }));
    return patient;
  },

  addAppointment: async (data) => {
    const patient = get().patients.find((p) => p.id === data.patientId);
    if (!patient) throw new Error('Patient not found');
    const { data: inserted, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: data.patientId,
        study_type: data.studyType,
        status: 'pending',
        date: data.date,
        time: data.time,
        report: '',
        images: [],
      })
      .select()
      .single();
    if (error) throw error;
    const appointment: Appointment = {
      id: inserted.id,
      patientId: data.patientId,
      patient,
      studyType: data.studyType,
      status: 'pending',
      date: data.date,
      time: data.time,
      report: '',
      images: [],
      createdAt: inserted.created_at,
    };
    set((s) => ({ appointments: [appointment, ...s.appointments] }));
    return appointment;
  },

  updateAppointmentStatus: async (id, status) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
  },

  updateAppointmentReport: async (id, report) => {
    await supabase.from('appointments').update({ report }).eq('id', id);
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, report } : a)),
    }));
  },

  updateAppointmentStudyType: async (id, studyType) => {
    await supabase.from('appointments').update({ study_type: studyType }).eq('id', id);
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, studyType } : a)),
    }));
  },

  addImagesToAppointment: async (id, images) => {
    const current = get().appointments.find((a) => a.id === id);
    if (!current) return;
    const updated = [...current.images, ...images];
    await supabase.from('appointments').update({ images: updated }).eq('id', id);
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, images: updated } : a
      ),
    }));
  },

  removeImageFromAppointment: async (id, index) => {
    const current = get().appointments.find((a) => a.id === id);
    if (!current) return;
    const updated = current.images.filter((_, i) => i !== index);
    await supabase.from('appointments').update({ images: updated }).eq('id', id);
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === id ? { ...a, images: updated } : a
      ),
    }));
  },

  getAppointmentsByDate: (date) => get().appointments.filter((a) => a.date === date),

  getPatientAppointments: (patientId) =>
    get()
      .appointments.filter((a) => a.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  searchPatients: (query) => {
    const q = query.toLowerCase();
    return get().patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.dni && p.dni.includes(q))
    );
  },

  getAppointment: (id) => get().appointments.find((a) => a.id === id),
  getPatient: (id) => get().patients.find((p) => p.id === id),

  findPatientByDni: async (dni: string) => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('dni', dni)
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      dni: data.dni || '',
      name: data.name,
      age: (data as any).fecha_nacimiento ? calcularEdad((data as any).fecha_nacimiento) : data.age,
      phone: data.phone,
      fechaNacimiento: (data as any).fecha_nacimiento || undefined,
      obraSocial: (data as any).obra_social || '',
    };
  },
}));
