import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicStore } from '@/store/useClinicStore';
import { calcularEdad } from '@/types/medical';

// Track recently mutated IDs to avoid re-fetching from realtime
const recentMutations = new Map<string, number>();
const MUTATION_COOLDOWN = 3000; // 3 seconds

export function trackMutation(id: string) {
  recentMutations.set(id, Date.now());
}

function wasRecentlyMutated(id: string): boolean {
  const ts = recentMutations.get(id);
  if (!ts) return false;
  if (Date.now() - ts < MUTATION_COOLDOWN) return true;
  recentMutations.delete(id);
  return false;
}

/**
 * Global realtime subscription for appointments AND patients.
 * Mount once in App.tsx so every page/device stays in sync.
 */
export function useRealtimeSync() {
  useEffect(() => {
    const appointmentsChannel = supabase
      .channel('global-appointments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          const event = payload.eventType;

          if (event === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              useClinicStore.setState((s) => ({
                appointments: s.appointments.filter((a) => a.id !== oldId),
              }));
            }
            return;
          }

          const newRow = payload.new as any;
          if (!newRow?.id) return;

          // Skip if this client just mutated this row
          if (wasRecentlyMutated(newRow.id)) return;

          supabase
            .from('appointments')
            .select('id, patient_id, study_type, status, date, time, report, images, image_urls, observations, reported_by, asistio, created_at, created_by, patients(*)')
            .eq('id', newRow.id)
            .single()
            .then(({ data }) => {
              if (!data) return;
              useClinicStore.setState((s) => {
                const mapped = {
                  id: data.id,
                  patientId: data.patient_id,
                  patient: {
                    id: data.patients.id,
                    dni: data.patients.dni || '',
                    name: data.patients.name,
                    age: data.patients.fecha_nacimiento
                      ? calcularEdad(data.patients.fecha_nacimiento)
                      : data.patients.age,
                    phone: data.patients.phone,
                    fechaNacimiento: data.patients.fecha_nacimiento || undefined,
                    obraSocial: data.patients.obra_social || '',
                  },
                  studyType: data.study_type,
                  status: data.status as any,
                  date: data.date,
                  time: data.time,
                  report: data.report || '',
                  images: (data.images as string[]) || [],
                  imageUrls: (data.image_urls as string[]) || [],
                  observations: data.observations || '',
                  reportedBy: data.reported_by || null,
                  asistio: data.asistio ?? false,
                  createdAt: data.created_at,
                };

                const existing = s.appointments.find((a) => a.id === data.id);
                if (existing) {
                  return { appointments: s.appointments.map((a) => a.id === data.id ? mapped : a) };
                } else {
                  return { appointments: [mapped, ...s.appointments] };
                }
              });
            });
        }
      )
      .subscribe();

    const patientsChannel = supabase
      .channel('global-patients-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          const event = payload.eventType;

          if (event === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              useClinicStore.setState((s) => ({
                patients: s.patients.filter((p) => p.id !== oldId),
              }));
            }
            return;
          }

          const newRow = payload.new as any;
          if (!newRow?.id) return;

          // Skip if this client just mutated this row
          if (wasRecentlyMutated(newRow.id)) return;

          const mapped = {
            id: newRow.id,
            dni: newRow.dni || '',
            name: newRow.name,
            age: newRow.fecha_nacimiento
              ? calcularEdad(newRow.fecha_nacimiento)
              : newRow.age,
            phone: newRow.phone,
            fechaNacimiento: newRow.fecha_nacimiento || undefined,
            obraSocial: newRow.obra_social || '',
          };

          useClinicStore.setState((s) => {
            const existing = s.patients.find((p) => p.id === newRow.id);
            if (existing) {
              return { patients: s.patients.map((p) => p.id === newRow.id ? mapped : p) };
            } else {
              return { patients: [mapped, ...s.patients] };
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(patientsChannel);
    };
  }, []);
}
