import { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, List, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { STATUS_LABELS, type StudyStatus } from '@/types/medical';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import WeeklyGrid from '@/components/WeeklyGrid';
import { Clock, Phone, ChevronRight as ChevronRightIcon } from 'lucide-react';

const statusClass: Record<StudyStatus, string> = {
  'pending': 'status-badge-pending',
  'in-study': 'status-badge-in-study',
  'reported': 'status-badge-reported',
  'sent': 'status-badge-sent',
};

const Index = () => {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today, { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const allAppointments = useClinicStore((s) => s.appointments);
  const fetchAppointments = useClinicStore((s) => s.fetchAppointments);
  const fetchPatients = useClinicStore((s) => s.fetchPatients);
  const loading = useClinicStore((s) => s.loading);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  const todayStr = format(today, 'yyyy-MM-dd');
  const todayAppointments = allAppointments
    .filter((a) => a.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <AppLayout title="Agenda">
      <div className="p-4 space-y-4">
        {/* View toggle + Week navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(w => subWeeks(w, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold">
              {format(weekStart, "d MMM", { locale: es })} — {format(addWeeks(weekStart, 0).setDate(weekStart.getDate() + 4) ? new Date(weekStart.getTime() + 4 * 86400000) : weekStart, "d MMM yyyy", { locale: es })}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))}>
              Hoy
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <p className="text-base font-medium">Cargando citas...</p>
          </div>
        ) : viewMode === 'grid' ? (
          <WeeklyGrid appointments={allAppointments} weekStart={weekStart} />
        ) : (
          /* List view - today's appointments */
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Citas de hoy — {format(today, "d 'de' MMMM", { locale: es })}
            </h2>
            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-base font-medium">No hay citas para hoy</p>
                <p className="text-sm mt-1">Presiona "Nueva" para agregar una cita</p>
              </div>
            ) : (
              todayAppointments.map((apt, i) => (
                <button
                  key={apt.id}
                  onClick={() => navigate(`/appointment/${apt.id}`)}
                  className="w-full bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all animate-slide-up text-left"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-semibold text-primary">{apt.time}</span>
                        <Badge variant="outline" className={`text-xs ${statusClass[apt.status]}`}>
                          {STATUS_LABELS[apt.status]}
                        </Badge>
                      </div>
                      <p className="font-semibold text-foreground truncate">{apt.patient.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {apt.patient.phone}
                        </span>
                        <span className="uppercase font-bold">{apt.studyType}</span>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
