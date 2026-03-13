import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import DailyView from '@/components/DailyView';

const Index = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const allAppointments = useClinicStore((s) => s.appointments);
  const fetchAppointments = useClinicStore((s) => s.fetchAppointments);
  const fetchPatients = useClinicStore((s) => s.fetchPatients);
  const loading = useClinicStore((s) => s.loading);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  return (
    <AppLayout title="Agenda">
      <div className="p-4 space-y-4">
        {/* Day navigation */}
        <div className="flex items-center justify-between">
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
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)}>
            Hoy
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <p className="text-base font-medium">Cargando citas...</p>
          </div>
        ) : (
          <DailyView appointments={allAppointments} selectedDate={selectedDate} />
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
