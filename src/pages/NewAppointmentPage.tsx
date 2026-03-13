import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { STUDY_TYPES, calcularEdad } from '@/types/medical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const NewAppointmentPage = () => {
  const navigate = useNavigate();
  const { addPatient, addAppointment, searchPatients, patients, findPatientByDni, getAppointmentsByDate } = useClinicStore();

  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [phone, setPhone] = useState('');
  const [obraSocial, setObraSocial] = useState('');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [customStudy, setCustomStudy] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const calculatedAge = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;

  const suggestions = name.length >= 2 && !selectedPatientId ? searchPatients(name) : [];

  const selectExistingPatient = (p: typeof patients[0]) => {
    setSelectedPatientId(p.id);
    setName(p.name);
    setDni(p.dni || '');
    setFechaNacimiento(p.fechaNacimiento || '');
    setPhone(p.phone);
    setObraSocial(p.obraSocial || '');
  };

  const handleDniBlur = useCallback(async () => {
    if (!dni.trim() || selectedPatientId) return;
    setLookingUp(true);
    try {
      const patient = await findPatientByDni(dni.trim());
      if (patient) {
        selectExistingPatient(patient);
        toast.info('Paciente encontrado por DNI');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLookingUp(false);
    }
  }, [dni, selectedPatientId, findPatientByDni]);

  const toggleStudy = (study: string) => {
    setSelectedStudies(prev =>
      prev.includes(study) ? prev.filter(s => s !== study) : [...prev, study]
    );
  };

  const getStudyTypeString = () => {
    const parts = [...selectedStudies];
    if (customStudy.trim()) parts.push(customStudy.trim());
    return parts.join(' + ');
  };

  // Check for time slot conflicts
  const isSlotOccupied = useCallback((checkDate: string, checkTime: string) => {
    const existing = getAppointmentsByDate(checkDate);
    return existing.some(a => a.time === checkTime);
  }, [getAppointmentsByDate]);

  const handleSubmit = async () => {
    const studyType = getStudyTypeString();
    if (!name || !phone || !time || !studyType) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!fechaNacimiento) {
      toast.error('La fecha de nacimiento es obligatoria');
      return;
    }

    // Check for slot conflict
    if (isSlotOccupied(date, time)) {
      toast.warning('⚠️ Ya existe una cita en ese horario. Se creará de todas formas.');
    }

    setSubmitting(true);
    try {
      let patientId = selectedPatientId;
      if (!patientId) {
        const patient = await addPatient({
          dni: dni.trim(),
          name,
          phone,
          fechaNacimiento,
          obraSocial,
        });
        patientId = patient.id;
      }

      await addAppointment({ patientId, studyType, date, time });
      toast.success('Cita creada exitosamente');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la cita');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Nueva Cita">
      <div className="p-4 space-y-5 max-w-lg mx-auto">
        {/* DNI field with onBlur lookup */}
        <div className="space-y-2">
          <Label>DNI / ID</Label>
          <Input
            value={dni}
            onChange={(e) => { setDni(e.target.value); setSelectedPatientId(null); }}
            onBlur={handleDniBlur}
            placeholder="Número de documento"
          />
          {lookingUp && <p className="text-xs text-muted-foreground">Buscando paciente...</p>}
        </div>

        <div className="space-y-2">
          <Label>Nombre del paciente</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setSelectedPatientId(null); }}
            placeholder="Nombre completo"
          />
          {suggestions.length > 0 && (
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              {suggestions.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectExistingPatient(p)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                >
                  <span className="font-medium">{p.name}</span>
                  {p.dni && <span className="text-muted-foreground ml-1">DNI: {p.dni}</span>}
                  <span className="text-muted-foreground ml-2">— {p.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha de Nacimiento *</Label>
            <Input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Edad</Label>
            <Input
              type="text"
              value={calculatedAge !== null ? `${calculatedAge} años` : ''}
              readOnly
              className="bg-muted/50"
              placeholder="Automático"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Teléfono *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54..." />
          </div>
          <div className="space-y-2">
            <Label>Obra Social</Label>
            <Input value={obraSocial} onChange={(e) => setObraSocial(e.target.value)} placeholder="OSDE, IOSFA, etc." />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo(s) de estudio</Label>
          <div className="border border-border rounded-lg overflow-hidden max-h-[30vh] overflow-y-auto">
            {STUDY_TYPES.map((t) => (
              <label
                key={t}
                className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border last:border-0"
              >
                <Checkbox
                  checked={selectedStudies.includes(t)}
                  onCheckedChange={() => toggleStudy(t)}
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
          <Input
            value={customStudy}
            onChange={(e) => setCustomStudy(e.target.value)}
            placeholder="Otro estudio (escribir manualmente)"
          />
          {getStudyTypeString() && (
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Estudios seleccionados:</p>
              <p className="text-sm font-medium uppercase">{getStudyTypeString()}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} step="600" />
            {time && isSlotOccupied(date, time) && (
              <p className="text-xs text-destructive font-medium">⚠ Ya hay una cita en este horario</p>
            )}
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full btn-action-primary" size="lg" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear Cita'}
        </Button>
      </div>
    </AppLayout>
  );
};

export default NewAppointmentPage;
