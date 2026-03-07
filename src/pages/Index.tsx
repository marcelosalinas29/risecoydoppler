import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Phone, ChevronRight, CalendarDays } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { STATUS_LABELS, type StudyStatus } from '@/types/medical';
import { Badge } from '@/components/ui/badge';

const statusClass: Record<StudyStatus, string> = {
  'pending': 'status-badge-pending',
  'in-study': 'status-badge-in-study',
  'reported': 'status-badge-reported',
  'sent': 'status-badge-sent',
};

const Index = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate] = useState(today);
  const allAppointments = useClinicStore((s) => s.appointments);
  const navigate = useNavigate();

  const sorted = useMemo(() => 
    allAppointments
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [allAppointments, selectedDate]
  );

  return (
    <AppLayout title={`Citas — ${format(new Date(selectedDate), "d 'de' MMMM", { locale: es })}`}>
      <div className="p-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-base font-medium">No hay citas para hoy</p>
            <p className="text-sm mt-1">Presiona "Nueva" para agregar una cita</p>
          </div>
        ) : (
          sorted.map((apt, i) => (
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
                    <span>{apt.studyType}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
              </div>
            </button>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
