import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, ChevronRight, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { STATUS_LABELS, calcularEdadDetallada } from '@/types/medical';
import { Input } from '@/components/ui/input';
import PatientHistoryModal from '@/components/PatientHistoryModal';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import PreviousStudiesSection from '@/components/PreviousStudiesSection';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const PAGE = 50;

/** Cuántos estudios (de todos los años) y estudios previos tiene cada paciente, pedido a la base solo para los que se ven. */
async function countByPatient(table: string, ids: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (let i = 0; i < ids.length; i += 25) {
    const chunk = ids.slice(i, i + 25);
    for (let page = 0; page < 10; page++) {
      const { data, error } = await (supabase as any).from(table).select('patient_id').in('patient_id', chunk).order('id').range(page * 1000, page * 1000 + 999);
      if (error || !data) break;
      for (const r of data) out[r.patient_id] = (out[r.patient_id] || 0) + 1;
      if (data.length < 1000) break;
    }
  }
  return out;
}

const PatientsPage = () => {
  const [query, setQuery] = useState('');
  const { isViewer, role } = useAuth();
  const canUpload = !!role && !isViewer;
  const [uploadPatient, setUploadPatient] = useState<{ id: string; name: string; dni: string } | null>(null);
  const [uploadPreviewing, setUploadPreviewing] = useState(false);
  const [previousStudyRevision, setPreviousStudyRevision] = useState(0);
  const { searchPatients, patients, getPatientAppointments, fetchPatients, fetchAppointments, searchPatientsRemote } = useClinicStore();
  const navigate = useNavigate();
  const [historyPatient, setHistoryPatient] = useState<{ id: string; dni: string; name: string } | null>(null);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => { searchPatientsRemote(query); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const allResults = query.length >= 1 ? searchPatients(query) : patients;
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => { setLimit(PAGE); }, [query]);
  const results = useMemo(() => allResults.slice(0, limit), [allResults, limit]);

  const [counts, setCounts] = useState<{ turnos: Record<string, number>; previos: Record<string, number> }>({ turnos: {}, previos: {} });
  const idsKey = results.map((p) => p.id).join(',');
  useEffect(() => {
    const ids = results.map((p) => p.id);
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.all([countByPatient('appointments', ids), countByPatient('estudios_previos', ids)])
      .then(([turnos, previos]) => { if (!cancelled) setCounts((c) => ({ turnos: { ...c.turnos, ...turnos }, previos: { ...c.previos, ...previos } })); })
      .catch((e) => console.error(e));
    return () => { cancelled = true; };
  }, [idsKey, previousStudyRevision]);

  return (
    <AppLayout title="Pacientes">
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por DNI, apellido y nombre o teléfono..."
            className="pl-9"
          />
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>{query ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((patient) => {
              const appointments = getPatientAppointments(patient.id);
              const displayPhone = patient.phone?.replace(/^\+?549?\s?/, '') || '';
              const edad = patient.fechaNacimiento
                ? calcularEdadDetallada(patient.fechaNacimiento)
                : { value: patient.age, unit: 'años' as const };
              return (
                <div key={patient.id} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground break-words">{patient.name}</p>
                        {canUpload && <Tooltip><TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label={`Cargar estudio previo de ${patient.name}`} onClick={() => setUploadPatient({ id: patient.id, name: patient.name, dni: patient.dni })}><Plus className="h-4 w-4" /></Button>
                        </TooltipTrigger><TooltipContent>Cargar estudio previo</TooltipContent></Tooltip>}
                      </div>
                      <p className="text-sm font-light text-muted-foreground flex items-center gap-0 flex-wrap">
                        {patient.dni && (
                          <>
                            <span className="text-foreground/70">DNI: {patient.dni}</span>
                            <span className="mx-2 text-border">|</span>
                          </>
                        )}
                        <span><span className="font-bold text-foreground">{edad.value}</span> {edad.unit}</span>
                        <span className="mx-2 text-border">|</span>
                        <span className="text-primary">{displayPhone}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {(counts.turnos[patient.id] ?? appointments.length)} estudio(s)
                        {(counts.previos[patient.id] ?? 0) > 0 && ` · ${counts.previos[patient.id]} previo(s)`}
                      </span>
                      <button onClick={() => setHistoryPatient({ id: patient.id, dni: patient.dni, name: patient.name })} className="text-xs text-primary underline">Historial y estudios previos</button>
                    </div>
                  </div>
                  {appointments.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {appointments.slice(0, 3).map((apt) => (
                        <button
                          key={apt.id}
                          onClick={() => navigate(`/appointment/${apt.id}`)}
                          className="w-full flex items-center justify-between bg-muted rounded-full px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span>{(() => { const [y, m, d] = apt.date.split('-').map(Number); return format(new Date(y, m - 1, d), "d MMM yyyy", { locale: es }); })()}</span>
                            <span className="text-muted-foreground">{apt.studyType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{STATUS_LABELS[apt.status]}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                      {appointments.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">+{appointments.length - 3} más</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {allResults.length > limit && (
              <Button variant="outline" className="w-full" onClick={() => setLimit(limit + PAGE)}>Mostrar más ({allResults.length - limit} restantes)</Button>
            )}
          </div>
        )}
      </div>
      {historyPatient && (
        <PatientHistoryModal
          patientId={historyPatient.id}
          patientDni={historyPatient.dni}
          patientName={historyPatient.name}
          open={!!historyPatient}
          onChanged={() => setPreviousStudyRevision((revision) => revision + 1)}
          onOpenChange={(o) => { if (!o) setHistoryPatient(null); }}
        />
      )}
      <Dialog open={!!uploadPatient} onOpenChange={(open) => { if (!open) { setUploadPatient(null); setUploadPreviewing(false); } }}>
        <DialogContent className={`${uploadPreviewing ? 'max-w-4xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader><DialogTitle className="break-words">Estudios previos de {uploadPatient?.name}</DialogTitle></DialogHeader>
          {uploadPatient && <PreviousStudiesSection key={uploadPatient.id} patientIds={[uploadPatient.id]} primaryPatientId={uploadPatient.id} canEdit={canUpload} initiallyAdding onPreviewChange={setUploadPreviewing} onChanged={() => setPreviousStudyRevision((revision) => revision + 1)} />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PatientsPage;
