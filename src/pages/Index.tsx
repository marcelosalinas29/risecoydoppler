import { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Wifi, Ban, ShieldOff } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import DailyView from '@/components/DailyView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const today = new Date();
  const { role, isViewer } = useAuth();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [testingConnection, setTestingConnection] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const allAppointments = useClinicStore((s) => s.appointments);
  const fetchAppointments = useClinicStore((s) => s.fetchAppointments);
  const fetchPatients = useClinicStore((s) => s.fetchPatients);
  const loading = useClinicStore((s) => s.loading);
  const { doctors, fetchDoctors, fetchAllSchedules, generateAvailableSlots, blockedDates, fetchBlockedDates, addBlockedDate, removeBlockedDate, isDateBlocked } = useScheduleStore();

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

  // Realtime is now handled globally by useRealtimeSync hook in App.tsx

  const dayOfWeek = getDay(selectedDate);
  const doctorSlots = selectedDoctorId !== 'all'
    ? generateAvailableSlots(selectedDoctorId, dayOfWeek)
    : null;

  const handleConnectionTest = async () => {
    setTestingConnection(true);
    try {
      const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

      const { data: testPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          dni: `TEST-${stamp}`,
          name: `TEST CONEXION ${stamp}`,
          age: 1,
          phone: `TEST-${stamp}`,
          obra_social: 'TEST',
        } as any)
        .select()
        .single();

      if (patientError) throw new Error(`Paciente: ${patientError.message}`);

      const { data: testAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: testPatient.id,
          study_type: 'TEST DE CONEXIÓN',
          status: 'pending',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: '23:59',
          report: '',
          images: [],
          observations: 'TEST TEMPORAL DE CONEXIÓN',
        } as any)
        .select('id')
        .single();

      if (appointmentError) throw new Error(`Turno: ${appointmentError.message}`);

      console.log('Connection test success', {
        patientId: testPatient.id,
        appointmentId: testAppointment.id,
      });

      await Promise.all([fetchPatients(true), fetchAppointments(true)]);
      toast.success(`Conexión OK: escribió en appointments (${testAppointment.id.slice(0, 8)})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falló el test de conexión';
      console.error('Connection test failed:', error);
      toast.error(message);
    } finally {
      setTestingConnection(false);
    }
  };

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
            <Button variant="outline" size="sm" onClick={handleConnectionTest} disabled={testingConnection}>
              <Wifi className="w-4 h-4 mr-1" />
              {testingConnection ? 'Probando...' : 'Test de conexión'}
            </Button>
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
