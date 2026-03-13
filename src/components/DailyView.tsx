import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, StudyStatus } from '@/types/medical';
import { STATUS_LABELS, formatStudyType } from '@/types/medical';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClinicStore } from '@/store/useClinicStore';
import { toast } from 'sonner';
import { Save, Edit2, X, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PatientHistoryModal from '@/components/PatientHistoryModal';

const statusClass: Record<StudyStatus, string> = {
  'pending': 'status-badge-pending',
  'in-study': 'status-badge-in-study',
  'reported': 'status-badge-reported',
  'sent': 'status-badge-sent',
};

// Default fallback slots (morning + afternoon)
function generateDefaultTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 13; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  for (let h = 15; h < 21; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const DEFAULT_TIME_SLOTS = generateDefaultTimeSlots();

interface DailyViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  doctorSlots?: string[] | null; // filtered slots from doctor schedule
}

const DailyView = ({ appointments, selectedDate, doctorSlots }: DailyViewProps) => {
  const navigate = useNavigate();
  const store = useClinicStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    time: string;
    studyType: string;
    status: StudyStatus;
    observations: string;
  }>({ time: '', studyType: '', status: 'pending', observations: '' });

  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);
  const [historyPatientName, setHistoryPatientName] = useState('');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    for (const a of appointments) {
      if (a.date === dateStr) {
        map.set(a.time, a);
      }
    }
    return map;
  }, [appointments, dateStr]);

  // Build final time slots: use doctor schedule if provided, otherwise defaults.
  // Always include any appointment times that fall outside the schedule (sobreturnos).
  const timeSlots = useMemo(() => {
    const baseSlots = doctorSlots && doctorSlots.length > 0 ? doctorSlots : DEFAULT_TIME_SLOTS;
    const slotSet = new Set(baseSlots);
    // Add any occupied slots not in the schedule
    for (const time of appointmentMap.keys()) {
      slotSet.add(time);
    }
    return [...slotSet].sort();
  }, [doctorSlots, appointmentMap]);

  const patientAppointmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of appointments) {
      counts.set(a.patientId, (counts.get(a.patientId) || 0) + 1);
    }
    return counts;
  }, [appointments]);

  const occupiedCount = appointmentMap.size;

  const startEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setEditData({
      time: apt.time,
      studyType: apt.studyType,
      status: apt.status,
      observations: apt.observations || '',
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (apt: Appointment) => {
    try {
      if (editData.time !== apt.time) await store.updateAppointmentTime(apt.id, editData.time);
      if (editData.studyType !== apt.studyType) await store.updateAppointmentStudyType(apt.id, editData.studyType);
      if (editData.status !== apt.status) await store.updateAppointmentStatus(apt.id, editData.status);
      if (editData.observations !== (apt.observations || '')) await store.updateAppointmentObservations(apt.id, editData.observations);
      setEditingId(null);
      toast.success('Cita actualizada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  // Determine if a slot is a "sobreturno" (outside doctor schedule)
  const isOverbook = (slot: string) => {
    if (!doctorSlots || doctorSlots.length === 0) return false;
    return !doctorSlots.includes(slot) && appointmentMap.has(slot);
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })} — {occupiedCount} cita(s)
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground w-16">Hora</th>
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Paciente</th>
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground w-24">DNI</th>
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground w-28">Teléfono</th>
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Obra Social</th>
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Estudio</th>
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground w-24">Estado</th>
              <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Observaciones</th>
              <th className="p-2 border border-border text-center font-semibold text-muted-foreground w-16">Acc.</th>
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, idx) => {
              const apt = appointmentMap.get(slot);
              const isOccupied = !!apt;
              const isEditing = apt && editingId === apt.id;
              const hasHistory = apt && (patientAppointmentCounts.get(apt.patientId) || 0) > 1;
              const overbook = isOverbook(slot);

              // Show morning/afternoon separators
              const prevSlot = idx > 0 ? timeSlots[idx - 1] : null;
              const slotHour = parseInt(slot.split(':')[0]);
              const prevHour = prevSlot ? parseInt(prevSlot.split(':')[0]) : null;
              const showMorningSep = slot === '08:00' || (idx === 0 && slotHour < 13);
              const showAfternoonSep = prevHour !== null && prevHour < 13 && slotHour >= 13;

              return (
                <>
                  {showMorningSep && (
                    <tr key="morning-sep">
                      <td colSpan={9} className="p-1 bg-muted/40 text-center text-[10px] text-muted-foreground font-bold border border-border tracking-wider">
                        — MAÑANA —
                      </td>
                    </tr>
                  )}
                  {showAfternoonSep && (
                    <tr key="afternoon-sep">
                      <td colSpan={9} className="p-1 bg-muted/40 text-center text-[10px] text-muted-foreground font-bold border border-border tracking-wider">
                        — TARDE —
                      </td>
                    </tr>
                  )}
                  <tr
                    key={slot}
                    className={`transition-colors ${overbook ? 'bg-accent/30 border-l-2 border-l-accent' : isOccupied ? 'bg-card hover:bg-muted/30' : 'opacity-50 hover:opacity-80 hover:bg-muted/20'}`}
                  >
                    <td className="p-1.5 border border-border font-mono text-center text-muted-foreground font-semibold">
                      {slot}
                      {overbook && <span className="ml-1 text-[9px] text-accent-foreground font-bold">ST</span>}
                    </td>

                    {isOccupied && apt ? (
                      <>
                        <td
                          className="p-1.5 border border-border font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/appointment/${apt.id}`)}
                        >
                          {apt.patient.name}
                        </td>
                        <td className="p-1.5 border border-border text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {apt.patient.dni || '-'}
                            {hasHistory && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryPatientId(apt.patientId);
                                  setHistoryPatientName(apt.patient.name);
                                }}
                                className="text-primary hover:text-primary/80 transition-colors"
                                title="Ver historial de estudios"
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </span>
                        </td>
                        <td className="p-1.5 border border-border text-muted-foreground">{apt.patient.phone}</td>
                        <td className="p-1.5 border border-border text-muted-foreground">{apt.patient.obraSocial || '-'}</td>
                        <td className="p-1.5 border border-border">
                          {isEditing ? (
                            <Input value={editData.studyType} onChange={(e) => setEditData(d => ({ ...d, studyType: e.target.value }))} className="h-7 text-xs" />
                          ) : (
                            <span className="uppercase font-bold">{formatStudyType(apt.studyType)}</span>
                          )}
                        </td>
                        <td className="p-1.5 border border-border">
                          {isEditing ? (
                            <Select value={editData.status} onValueChange={(v) => setEditData(d => ({ ...d, status: v as StudyStatus }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="in-study">En estudio</SelectItem>
                                <SelectItem value="reported">Reportado</SelectItem>
                                <SelectItem value="sent">Enviado</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={`text-[10px] ${statusClass[apt.status]}`}>
                              {STATUS_LABELS[apt.status]}
                            </Badge>
                          )}
                        </td>
                        <td className="p-1.5 border border-border">
                          {isEditing ? (
                            <Input value={editData.observations} onChange={(e) => setEditData(d => ({ ...d, observations: e.target.value }))} className="h-7 text-xs" placeholder="Observaciones..." />
                          ) : (
                            <span className="text-muted-foreground">{apt.observations || '-'}</span>
                          )}
                        </td>
                        <td className="p-1.5 border border-border text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => saveEdit(apt)}>
                                <Save className="w-3 h-3 text-primary" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={cancelEdit}>
                                <X className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startEdit(apt)}>
                              <Edit2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                        </td>
                      </>
                    ) : (
                      <td colSpan={8} className="p-1.5 border border-border text-center text-muted-foreground/60 italic">
                        Disponible
                      </td>
                    )}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {historyPatientId && (
        <PatientHistoryModal
          patientId={historyPatientId}
          patientName={historyPatientName}
          open={!!historyPatientId}
          onOpenChange={(open) => { if (!open) setHistoryPatientId(null); }}
        />
      )}
    </div>
  );
};

export default DailyView;
