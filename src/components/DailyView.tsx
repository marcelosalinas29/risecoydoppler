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
  const dayAppointments = useMemo(() =>
    appointments
      .filter((a) => a.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, dateStr]
  );

  const startEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setEditData({
      time: apt.time,
      studyType: apt.studyType,
      status: apt.status,
      observations: apt.observations || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (apt: Appointment) => {
    try {
      if (editData.time !== apt.time) {
        await store.updateAppointmentTime(apt.id, editData.time);
      }
      if (editData.studyType !== apt.studyType) {
        await store.updateAppointmentStudyType(apt.id, editData.studyType);
      }
      if (editData.status !== apt.status) {
        await store.updateAppointmentStatus(apt.id, editData.status);
      }
      if (editData.observations !== (apt.observations || '')) {
        await store.updateAppointmentObservations(apt.id, editData.observations);
      }
      setEditingId(null);
      toast.success('Cita actualizada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })} — {dayAppointments.length} cita(s)
      </h2>

      {dayAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-base font-medium">No hay citas para este día</p>
          <p className="text-sm mt-1">Presiona "Nueva" para agregar una cita</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Hora</th>
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Paciente</th>
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">DNI</th>
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Teléfono</th>
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Obra Social</th>
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Estudio</th>
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Estado</th>
                <th className="p-2 border border-border text-left font-semibold text-muted-foreground">Observaciones</th>
                <th className="p-2 border border-border text-center font-semibold text-muted-foreground w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dayAppointments.map((apt) => {
                const isEditing = editingId === apt.id;

                return (
                  <tr key={apt.id} className="hover:bg-muted/30 transition-colors">
                    {/* Hora */}
                    <td className="p-2 border border-border font-mono whitespace-nowrap">
                      {isEditing ? (
                        <Input
                          type="time"
                          step="600"
                          value={editData.time}
                          onChange={(e) => setEditData(d => ({ ...d, time: e.target.value }))}
                          className="h-8 w-24 text-xs"
                        />
                      ) : (
                        <span className="font-semibold text-primary">{apt.time}</span>
                      )}
                    </td>

                    {/* Paciente - clickable */}
                    <td
                      className="p-2 border border-border font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/appointment/${apt.id}`)}
                    >
                      {apt.patient.name}
                    </td>

                    {/* DNI */}
                    <td className="p-2 border border-border text-muted-foreground">
                      {apt.patient.dni || '-'}
                    </td>

                    {/* Teléfono */}
                    <td className="p-2 border border-border text-muted-foreground">
                      {apt.patient.phone}
                    </td>

                    {/* Obra Social */}
                    <td className="p-2 border border-border text-muted-foreground">
                      {apt.patient.obraSocial || '-'}
                    </td>

                    {/* Estudio */}
                    <td className="p-2 border border-border">
                      {isEditing ? (
                        <Input
                          value={editData.studyType}
                          onChange={(e) => setEditData(d => ({ ...d, studyType: e.target.value }))}
                          className="h-8 text-xs"
                        />
                      ) : (
                        <span className="uppercase font-bold text-xs">{formatStudyType(apt.studyType)}</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="p-2 border border-border">
                      {isEditing ? (
                        <Select
                          value={editData.status}
                          onValueChange={(v) => setEditData(d => ({ ...d, status: v as StudyStatus }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in-study">En estudio</SelectItem>
                            <SelectItem value="reported">Reportado</SelectItem>
                            <SelectItem value="sent">Enviado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`text-xs ${statusClass[apt.status]}`}>
                          {STATUS_LABELS[apt.status]}
                        </Badge>
                      )}
                    </td>

                    {/* Observaciones */}
                    <td className="p-2 border border-border">
                      {isEditing ? (
                        <Input
                          value={editData.observations}
                          onChange={(e) => setEditData(d => ({ ...d, observations: e.target.value }))}
                          className="h-8 text-xs"
                          placeholder="Observaciones..."
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">{apt.observations || '-'}</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="p-2 border border-border text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => saveEdit(apt)}>
                            <Save className="w-3.5 h-3.5 text-primary" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={cancelEdit}>
                            <X className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(apt)}>
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DailyView;
