import { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import DailyView from '@/components/DailyView';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const allAppointments = useClinicStore((s) => s.appointments);
  const fetchAppointments = useClinicStore((s) => s.fetchAppointments);
  const fetchPatients = useClinicStore((s) => s.fetchPatients);
  const loading = useClinicStore((s) => s.loading);
  const { doctors, fetchDoctors, fetchAllSchedules, generateAvailableSlots } = useScheduleStore();

  const dateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const dayAppointments = useMemo(
    () => allAppointments.filter(a => a.date === dateStr),
    [allAppointments, dateStr]
  );
  const patientsWithHistory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of allAppointments) {
      counts.set(a.patientId, (counts.get(a.patientId) || 0) + 1);
    }
    return new Set(Array.from(counts.entries()).filter(([, c]) => c > 1).map(([id]) => id));
  }, [allAppointments]);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchDoctors();
    fetchAllSchedules();
  }, []);

  // Realtime subscription — apply changes incrementally instead of full refetch
  useEffect(() => {
    const channel = supabase
      .channel('appointments-realtime')
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
          // For INSERT and UPDATE, refetch only that single appointment
          const newRow = payload.new as any;
          if (!newRow?.id) return;
          supabase
            .from('appointments')
            .select('id, patient_id, study_type, status, date, time, observations, reported_by, asistio, created_at, created_by, patients(*)')
            .eq('id', newRow.id)
            .single()
            .then(({ data }) => {
              if (!data) return;
              useClinicStore.setState((s) => {
                const existing = s.appointments.find((a) => a.id === data.id);
                const mapped = {
                  id: data.id,
                  patientId: data.patient_id,
                  patient: {
                    id: data.patients.id,
                    dni: data.patients.dni || '',
                    name: data.patients.name,
                    age: data.patients.fecha_nacimiento
                      ? Math.floor((Date.now() - new Date(data.patients.fecha_nacimiento + 'T00:00:00').getTime()) / 31557600000)
                      : data.patients.age,
                    phone: data.patients.phone,
                    fechaNacimiento: data.patients.fecha_nacimiento || undefined,
                    obraSocial: data.patients.obra_social || '',
                  },
                  studyType: data.study_type,
                  status: data.status as any,
                  date: data.date,
                  time: data.time,
                  report: existing?.report || '',
                  images: existing?.images || [],
                  imageUrls: existing?.imageUrls || [],
                  observations: data.observations || '',
                  reportedBy: data.reported_by || null,
                  asistio: data.asistio ?? false,
                  createdAt: data.created_at,
                };
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dayOfWeek = getDay(selectedDate);
  const doctorSlots = selectedDoctorId !== 'all'
    ? generateAvailableSlots(selectedDoctorId, dayOfWeek)
    : null;

  return (
    <AppLayout title="Agenda">
      <div className="p-4 space-y-4">
        {/* Top bar: date nav + doctor filter */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(d => subDays(d, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  <span className="capitalize">
                    {format(selectedDate, "EEE d MMM yyyy", { locale: es })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                  locale={es}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(d => addDays(d, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="Todos los médicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los médicos</SelectItem>
                {doctors.map(doc => (
                  <SelectItem key={doc.userId} value={doc.userId}>
                    {doc.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)}>
              Hoy
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <p className="text-base font-medium">Cargando citas...</p>
          </div>
        ) : (
          <DailyView
            appointments={dayAppointments}
            selectedDate={selectedDate}
            doctorSlots={doctorSlots}
            patientsWithHistory={patientsWithHistory}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
