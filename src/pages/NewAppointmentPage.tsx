import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { STUDY_TYPES, calcularEdad, getStudyDuration } from '@/types/medical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CalendarIcon, Clock, AlertTriangle, Timer } from 'lucide-react';

const NewAppointmentPage = () => {
  const navigate = useNavigate();
  const { addPatient, addAppointment, searchPatients, patients, findPatientByDni, getAppointmentsByDate } = useClinicStore();
  const { doctors, fetchDoctors, fetchAllSchedules, generateAvailableSlots, schedules } = useScheduleStore();

  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [phone, setPhone] = useState('');
  const [obraSocial, setObraSocial] = useState('');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [customStudy, setCustomStudy] = useState('');
  const [time, setTime] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideTime, setOverrideTime] = useState('');

  const calculatedAge = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayOfWeek = getDay(selectedDate);

  useEffect(() => {
    fetchDoctors();
    fetchAllSchedules();
  }, []);

  // Auto-select first doctor
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].userId);
    }
  }, [doctors]);

  // Available slots based on doctor schedule
  const availableSlots = useMemo(() => {
    if (!selectedDoctorId) return [];
    return generateAvailableSlots(selectedDoctorId, dayOfWeek);
  }, [selectedDoctorId, dayOfWeek, schedules]);

  // Occupied slots for the selected date
  const occupiedSlots = useMemo(() => {
    const existing = getAppointmentsByDate(dateStr);
    return new Set(existing.map(a => a.time));
  }, [dateStr, getAppointmentsByDate]);

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

  // Calculate duration based on study type
  const selectedDoctor = doctors.find(d => d.userId === selectedDoctorId);
  const baseInterval = selectedDoctor?.slotInterval ?? 10;
  const studyTypeStr = getStudyTypeString();
  const studyDuration = getStudyDuration(studyTypeStr, baseInterval);
  const slotsNeeded = Math.max(1, Math.ceil(studyDuration / baseInterval));

  // Compute which slots are blocked by multi-slot appointments
  const blockedSlots = useMemo(() => {
    const blocked = new Set<string>();
    occupiedSlots.forEach(s => blocked.add(s));
    return blocked;
  }, [occupiedSlots]);

  const finalTime = showOverride ? overrideTime : time;

  const handleSubmit = async () => {
    const studyType = getStudyTypeString();
    if (!name || !phone || !finalTime || !studyType) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!fechaNacimiento) {
      toast.error('La fecha de nacimiento es obligatoria');
      return;
    }

    if (occupiedSlots.has(finalTime)) {
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

      await addAppointment({ patientId, studyType, date: dateStr, time: finalTime });
      toast.success('Cita creada exitosamente');
      navigate('/');
    } catch (err) {
      console.error('Error creating appointment:', err);
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: unknown }).message)
          : 'Error al crear la cita';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Nueva Cita">
      <div className="p-4 space-y-5 max-w-lg mx-auto">
        {/* DNI field */}
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

        {/* Doctor selector */}
        {doctors.length > 1 && (
          <div className="space-y-2">
            <Label>Médico</Label>
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar médico" /></SelectTrigger>
              <SelectContent>
                {doctors.map(d => (
                  <SelectItem key={d.userId} value={d.userId}>{d.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date picker (calendar) */}
        <div className="space-y-2">
          <Label>Fecha de la cita</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { if (d) { setSelectedDate(d); setTime(''); } }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horario disponible
          </Label>
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {availableSlots.map(slot => {
                const isOccupied = occupiedSlots.has(slot);
                const isSelected = time === slot && !showOverride;
                return (
                  <button
                    key={slot}
                    onClick={() => { setTime(slot); setShowOverride(false); }}
                    disabled={isOccupied}
                    className={cn(
                      "text-xs font-mono py-2 px-1 rounded-lg border transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : isOccupied
                          ? "bg-muted/60 text-muted-foreground/50 border-border cursor-not-allowed line-through"
                          : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
              {selectedDoctorId
                ? 'No hay bloques horarios configurados para este día.'
                : 'Seleccione un médico para ver los horarios disponibles.'}
            </p>
          )}

          {/* Override / Sobreturno */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setShowOverride(!showOverride)}
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              {showOverride ? 'Cancelar sobreturno' : 'Agregar sobreturno'}
            </Button>
          </div>
          {showOverride && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Hora manual (sobreturno)</Label>
              <Input type="time" value={overrideTime} onChange={(e) => setOverrideTime(e.target.value)} step="600" />
              {overrideTime && occupiedSlots.has(overrideTime) && (
                <p className="text-xs text-destructive font-medium">⚠ Ya hay una cita en este horario</p>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} className="w-full btn-action-primary" size="lg" disabled={submitting}>
          {submitting ? 'Creando...' : 'Crear Cita'}
        </Button>
      </div>
    </AppLayout>
  );
};

export default NewAppointmentPage;
