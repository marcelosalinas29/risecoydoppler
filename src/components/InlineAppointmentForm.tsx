import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useClinicStore } from '@/store/useClinicStore';
import { toast } from 'sonner';
import { Check, X, Search, FileText } from 'lucide-react';
import StudyTypeSelector from '@/components/StudyTypeSelector';
import { calcularEdad } from '@/types/medical';

interface Props {
  slot: string;
  date: string;
  onCancel: () => void;
  onSaved: () => void;
}

const InlineAppointmentForm = ({ slot, date, onCancel, onSaved }: Props) => {
  const store = useClinicStore();
  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [obraSocial, setObraSocial] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [studyType, setStudyType] = useState('');
  const [observations, setObservations] = useState('');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showStudySelector, setShowStudySelector] = useState(false);

  const lookupDni = async () => {
    if (!dni.trim()) return;
    const p = await store.findPatientByDni(dni.trim());
    if (p) {
      setPatientId(p.id);
      setName(p.name);
      setPhone(p.phone);
      setObraSocial(p.obraSocial || '');
      setFechaNacimiento(p.fechaNacimiento || '');
      toast.success('Paciente encontrado');
    } else {
      setPatientId(null);
      toast.info('Paciente no registrado, complete los datos');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Ingrese el nombre del paciente');
      return;
    }
    setSaving(true);
    try {
      let pid = patientId;
      if (!pid) {
        const p = await store.addPatient({
          dni,
          name: name.trim(),
          phone,
          obraSocial,
          fechaNacimiento: fechaNacimiento || undefined,
        });
        pid = p.id;
      }
      await store.addAppointment({
        patientId: pid,
        studyType: studyType || 'ECOGRAFIA',
        date,
        time: slot,
      });
      toast.success('Turno confirmado');
      onSaved();
    } catch {
      toast.error('Error al guardar el turno');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <>
      <td className="p-1 border border-border">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          placeholder="Nombre"
          className="h-6 text-xs uppercase"
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </td>
      <td className="p-1 border border-border">
        <div className="flex items-center gap-0.5">
          <span className="text-xs truncate max-w-[80px]" title={studyType || 'Estudio'}>
            {studyType || <span className="text-muted-foreground">Estudio</span>}
          </span>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => setShowStudySelector(true)} title="Seleccionar estudio">
            <FileText className="w-3 h-3" />
          </Button>
        </div>
        <StudyTypeSelector
          open={showStudySelector}
          onOpenChange={setShowStudySelector}
          onApply={(v) => setStudyType(v)}
          currentValue={studyType}
        />
      </td>
      <td className="p-1 border border-border">
        <div className="flex items-center gap-0.5">
          <Input
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            onBlur={lookupDni}
            placeholder="DNI"
            className="h-6 text-xs w-20"
            onKeyDown={handleKeyDown}
          />
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={lookupDni} title="Buscar por DNI">
            <Search className="w-3 h-3" />
          </Button>
        </div>
      </td>
      <td className="p-1 border border-border">
        <div className="flex flex-col gap-0.5">
          <Input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className="h-6 text-xs"
            onKeyDown={handleKeyDown}
          />
          {fechaNacimiento && (
            <span className="text-[10px] text-muted-foreground">{calcularEdad(fechaNacimiento)} años</span>
          )}
        </div>
      </td>
      <td className="p-1 border border-border">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Tel"
          className="h-6 text-xs"
          onKeyDown={handleKeyDown}
        />
      </td>
      <td className="p-1 border border-border">
        <Input
          value={obraSocial}
          onChange={(e) => setObraSocial(e.target.value.toUpperCase())}
          placeholder="O.S."
          className="h-6 text-xs uppercase"
          onKeyDown={handleKeyDown}
        />
      </td>
      <td className="p-1 border border-border text-center">
        <span className="text-[10px] text-amber-600 font-semibold">Nuevo</span>
      </td>
      <td className="p-1 border border-border">
        <Input
          value={observations}
          onChange={(e) => setObservations(e.target.value.toUpperCase())}
          placeholder="Obs."
          className="h-6 text-xs uppercase"
          onKeyDown={handleKeyDown}
        />
      </td>
      <td className="p-1 border border-border text-center">
        <div className="flex items-center justify-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSave} disabled={saving} title="Confirmar turno">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onCancel} title="Cancelar">
            <X className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      </td>
    </>
  );
};

export default InlineAppointmentForm;
