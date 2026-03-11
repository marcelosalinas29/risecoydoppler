import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { STUDY_TYPES } from '@/types/medical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const NewAppointmentPage = () => {
  const navigate = useNavigate();
  const { addPatient, addAppointment, searchPatients, patients } = useClinicStore();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [customStudy, setCustomStudy] = useState('');
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

  const handleSubmit = () => {
    const studyType = getStudyTypeString();
    if (!name || !age || !phone || !time || !studyType) {
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
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54..." />
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
              <p className="text-sm font-medium">{getStudyTypeString()}</p>
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
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full btn-action-primary" size="lg">
          Crear Cita
        </Button>
      </div>
    </AppLayout>
  );
};

export default NewAppointmentPage;
