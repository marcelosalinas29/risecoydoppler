import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useClinicStore } from '@/store/useClinicStore';
import { STATUS_LABELS, formatStudyType } from '@/types/medical';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PatientHistoryModalProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusClass: Record<string, string> = {
  'pending': 'status-badge-pending',
  'in-study': 'status-badge-in-study',
  'reported': 'status-badge-reported',
  'sent': 'status-badge-sent',
};

const PatientHistoryModal = ({ patientId, patientName, open, onOpenChange }: PatientHistoryModalProps) => {
  const navigate = useNavigate();
  const { getPatientAppointments } = useClinicStore();
  const appointments = getPatientAppointments(patientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-primary" />
            Historial de {patientName}
          </DialogTitle>
        </DialogHeader>

        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin estudios previos
          </p>
        ) : (
          <div className="space-y-2">
            {appointments.map(apt => (
              <button
                key={apt.id}
                onClick={() => { onOpenChange(false); navigate(`/appointment/${apt.id}`); }}
                className="w-full text-left bg-muted/30 hover:bg-muted/60 rounded-lg p-3 transition-colors border border-border"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase">{formatStudyType(apt.studyType)}</span>
                  <Badge variant="outline" className={`text-[10px] ${statusClass[apt.status] || ''}`}>
                    {STATUS_LABELS[apt.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {(() => { const [y, m, d] = apt.date.split('-').map(Number); return format(new Date(y, m - 1, d), "d 'de' MMMM yyyy", { locale: es }); })()}
                  <span>— {apt.time}</span>
                </div>
                {apt.report && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    📄 Tiene informe
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientHistoryModal;
