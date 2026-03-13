import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleStore, ScheduleBlock } from '@/store/useScheduleStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Clock } from 'lucide-react';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const ScheduleConfigPage = () => {
  const navigate = useNavigate();
  const { user, isDoctor } = useAuth();
  const { schedules, fetchSchedules, addBlock, updateBlock, deleteBlock } = useScheduleStore();

  const [newDay, setNewDay] = useState('1');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('12:00');

  useEffect(() => {
    if (user) fetchSchedules(user.id);
  }, [user]);

  const handleAdd = async () => {
    if (!user) return;
    try {
      await addBlock({
        doctorId: user.id,
        dayOfWeek: parseInt(newDay),
        startTime: newStart,
        endTime: newEnd,
        active: true,
      });
      toast.success('Bloque horario agregado');
    } catch {
      toast.error('Error al agregar bloque');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBlock(id);
    toast.success('Bloque eliminado');
  };

  const handleToggle = async (id: string, active: boolean) => {
    await updateBlock(id, { active });
    toast.success(active ? 'Bloque activado' : 'Bloque desactivado');
  };

  // Group schedules by day
  const byDay = DAYS.map((dayName, dayIdx) => ({
    dayName,
    dayIdx,
    blocks: schedules.filter(b => b.dayOfWeek === dayIdx),
  })).filter(d => d.blocks.length > 0);

  return (
    <AppLayout title="Configurar Horarios">
      <div className="p-4 max-w-lg mx-auto space-y-5">
        {/* Add new block */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            Agregar Bloque Horario
          </h2>
          <div className="space-y-2">
            <Label className="text-xs">Día</Label>
            <Select value={newDay} onValueChange={setNewDay}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} step="600" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} step="600" />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Agregar
          </Button>
        </div>

        {/* Existing blocks */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground">Bloques Configurados</h2>
          {byDay.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay bloques configurados. Agregá tus horarios de atención.
            </p>
          )}
          {byDay.map(({ dayName, blocks }) => (
            <div key={dayName} className="bg-card border border-border rounded-xl p-3 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">{dayName}</h3>
              <div className="space-y-2">
                {blocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className={`font-mono ${!block.active ? 'line-through text-muted-foreground' : ''}`}>
                      {block.startTime} - {block.endTime}
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={block.active}
                        onCheckedChange={(v) => handleToggle(block.id, v)}
                      />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(block.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    </AppLayout>
  );
};

export default ScheduleConfigPage;
