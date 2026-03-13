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
import { Save, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusClass: Record<StudyStatus, string> = {
  'pending': 'status-badge-pending',
  'in-study': 'status-badge-in-study',
  'reported': 'status-badge-reported',
  'sent': 'status-badge-sent',
};

// Generate all 10-minute time slots for the day
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  // Morning: 8:00 - 12:50
  for (let h = 8; h < 13; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  // Afternoon: 15:00 - 20:50
  for (let h = 15; h < 21; h++) {
    for (let m = 0; m < 60; m += 10) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface DailyViewProps {
  appointments: Appointment[];
  selectedDate: Date;
}

const DailyView = ({ appointments, selectedDate }: DailyViewProps) => {
  const navigate = useNavigate();
  const store = useClinicStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    time: string;
    studyType: string;
    status: StudyStatus;
    observations: string;
  }>({ time: '', studyType: '', status: 'pending', observations: '' });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Map appointments by time slot
  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    for (const a of appointments) {
      if (a.date === dateStr) {
        map.set(a.time, a);
      }
    }
    return map;
  }, [appointments, dateStr]);

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
            {TIME_SLOTS.map((slot, idx) => {
              const apt = appointmentMap.get(slot);
              const isOccupied = !!apt;
              const isEditing = apt && editingId === apt.id;
              const isMorningStart = slot === '08:00';
              const isAfternoonStart = slot === '15:00';

              return (
                <>
                  {isMorningStart && (
                    <tr key="morning-sep">
                      <td colSpan={9} className="p-1 bg-muted/40 text-center text-[10px] text-muted-foreground font-bold border border-border tracking-wider">
                        — MAÑANA —
                      </td>
                    </tr>
                  )}
                  {isAfternoonStart && (
                    <tr key="afternoon-sep">
                      <td colSpan={9} className="p-1 bg-muted/40 text-center text-[10px] text-muted-foreground font-bold border border-border tracking-wider">
                        — TARDE —
                      </td>
                    </tr>
                  )}
                  <tr
                    key={slot}
                    className={`transition-colors ${isOccupied ? 'bg-card hover:bg-muted/30' : 'opacity-50 hover:opacity-80 hover:bg-muted/20'}`}
                  >
                    {/* Hora */}
                    <td className="p-1.5 border border-border font-mono text-center text-muted-foreground font-semibold">
                      {slot}
                    </td>

                    {isOccupied && apt ? (
                      <>
                        {/* Paciente */}
                        <td
                          className="p-1.5 border border-border font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/appointment/${apt.id}`)}
                        >
                          {apt.patient.name}
                        </td>
                        {/* DNI */}
                        <td className="p-1.5 border border-border text-muted-foreground">{apt.patient.dni || '-'}</td>
                        {/* Teléfono */}
                        <td className="p-1.5 border border-border text-muted-foreground">{apt.patient.phone}</td>
                        {/* Obra Social */}
                        <td className="p-1.5 border border-border text-muted-foreground">{apt.patient.obraSocial || '-'}</td>
                        {/* Estudio */}
                        <td className="p-1.5 border border-border">
                          {isEditing ? (
                            <Input value={editData.studyType} onChange={(e) => setEditData(d => ({ ...d, studyType: e.target.value }))} className="h-7 text-xs" />
                          ) : (
                            <span className="uppercase font-bold">{formatStudyType(apt.studyType)}</span>
                          )}
                        </td>
                        {/* Estado */}
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
                        {/* Observaciones */}
                        <td className="p-1.5 border border-border">
                          {isEditing ? (
                            <Input value={editData.observations} onChange={(e) => setEditData(d => ({ ...d, observations: e.target.value }))} className="h-7 text-xs" placeholder="Observaciones..." />
                          ) : (
                            <span className="text-muted-foreground">{apt.observations || '-'}</span>
                          )}
                        </td>
                        {/* Acciones */}
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
                      /* Empty slot */
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
    </div>
  );
};

export default DailyView;
