import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { STUDY_TYPES, type StudyType } from '@/types/medical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const NewAppointmentPage = () => {
  const navigate = useNavigate();
  const { addPatient, addAppointment, searchPatients, patients } = useClinicStore();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [studyType, setStudyType] = useState<StudyType>('Ecografía Abdominal');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const suggestions = name.length >= 2 ? searchPatients(name) : [];

  const selectExistingPatient = (p: typeof patients[0]) => {
    setSelectedPatientId(p.id);
    setName(p.name);
    setAge(String(p.age));
    setPhone(p.phone);
  };

  const handleSubmit = () => {
    if (!name || !age || !phone || !time) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    let patientId = selectedPatientId;
    if (!patientId) {
      const patient = addPatient({ name, age: parseInt(age), phone });
      patientId = patient.id;
    }

    addAppointment({ patientId, studyType, date, time });
    toast.success('Cita creada exitosamente');
    navigate('/');
  };

  return (
    <AppLayout title="Nueva Cita">
      <div className="p-4 space-y-5 max-w-lg mx-auto">
        <div className="space-y-2">
          <Label>Nombre del paciente</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setSelectedPatientId(null); }}
            placeholder="Nombre completo"
          />
          {suggestions.length > 0 && !selectedPatientId && (
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              {suggestions.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectExistingPatient(p)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground ml-2">— {p.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Edad</Label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52..." />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo de estudio</Label>
          <Select value={studyType} onValueChange={(v) => setStudyType(v as StudyType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STUDY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg">
          Crear Cita
        </Button>
      </div>
    </AppLayout>
  );
};

export default NewAppointmentPage;
