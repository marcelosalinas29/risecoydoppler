import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Phone, Calendar, FileText, ImagePlus, Send, Download, Trash2, ChevronDown } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { STATUS_LABELS, type StudyStatus } from '@/types/medical';
import { REPORT_TEMPLATES } from '@/data/reportTemplates';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import clinicLogo from '@/assets/clinic-logo.png';

const statusClass: Record<StudyStatus, string> = {
  'pending': 'status-badge-pending',
  'in-study': 'status-badge-in-study',
  'reported': 'status-badge-reported',
  'sent': 'status-badge-sent',
};

const AppointmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useClinicStore();
  const appointment = store.getAppointment(id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const [report, setReport] = useState(appointment?.report || '');

  const handleSaveReport = useCallback(() => {
    if (!id) return;
    store.updateAppointmentReport(id, report);
    if (appointment?.status === 'pending' || appointment?.status === 'in-study') {
      store.updateAppointmentStatus(id, 'reported');
    }
    toast.success('Informe guardado');
  }, [id, report, store, appointment?.status]);

  const handleStatusChange = (status: StudyStatus) => {
    if (!id) return;
    store.updateAppointmentStatus(id, status);
    toast.success(`Estado actualizado a: ${STATUS_LABELS[status]}`);
  };

  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id) return;

    const images = await Promise.all(Array.from(files).map((f) => compressImage(f)));
    store.addImagesToAppointment(id, images);
    toast.success(`${images.length} imagen(es) cargada(s)`);
  };

  const applyTemplate = (content: string) => {
    setReport(content);
    setShowTemplates(false);
  };

  const generatePDF = async () => {
    if (!appointment) return;
    handleSaveReport();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Logo
    try {
      const img = new Image();
      img.src = clinicLogo;
      await new Promise((resolve) => { img.onload = resolve; });
      doc.addImage(clinicLogo, 'PNG', margin, 10, 30, 30);
    } catch {
      // skip logo
    }

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Clínica de Ultrasonido', margin + 35, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de Ecografía', margin + 35, 30);

    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, 45, pageWidth - margin, 45);

    // Patient info
    let y = 55;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(appointment.patient.name, margin + 30, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Edad:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${appointment.patient.age} años`, margin + 30, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', pageWidth / 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(appointment.patient.phone, pageWidth / 2 + 30, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Estudio:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(appointment.studyType, margin + 30, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(appointment.date), "d 'de' MMMM yyyy", { locale: es }), margin + 30, y);

    doc.line(margin, y + 5, pageWidth - margin, y + 5);

    // Report
    y += 15;
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(report || 'Sin informe', contentWidth);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    // Images
    const currentAppointment = store.getAppointment(id || '');
    if (currentAppointment && currentAppointment.images.length > 0) {
      doc.addPage();
      y = 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Imágenes del Estudio', margin, y);
      y += 10;

      for (const img of currentAppointment.images) {
        if (y > 200) {
          doc.addPage();
          y = 20;
        }
        try {
          doc.addImage(img, 'JPEG', margin, y, contentWidth / 2, 80);
          y += 90;
        } catch {
          // skip
        }
      }
    }

    doc.save(`Informe_${appointment.patient.name.replace(/\s/g, '_')}_${appointment.date}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const sendWhatsApp = () => {
    if (!appointment) return;
    handleSaveReport();
    const message = encodeURIComponent(
      `*Informe de Ecografía*\n\nPaciente: ${appointment.patient.name}\nEstudio: ${appointment.studyType}\nFecha: ${format(new Date(appointment.date), "d/MM/yyyy")}\n\n${report}\n\n_Clínica de Ultrasonido_`
    );
    const phone = appointment.patient.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');

    if (id) {
      store.updateAppointmentStatus(id, 'sent');
    }
    toast.success('Abriendo WhatsApp...');
  };

  if (!appointment) {
    return (
      <AppLayout title="No encontrado">
        <div className="p-8 text-center text-muted-foreground">
          <p>Cita no encontrada</p>
          <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
            Volver a citas
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentAppointment = store.getAppointment(id || '') || appointment;

  return (
    <AppLayout title={appointment.patient.name}>
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Patient Info Card */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">{appointment.patient.name}</span>
            </div>
            <Badge variant="outline" className={statusClass[currentAppointment.status]}>
              {STATUS_LABELS[currentAppointment.status]}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <span>Edad: {appointment.patient.age} años</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{appointment.patient.phone}</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{appointment.studyType}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(appointment.date), "d/MM/yyyy")}</span>
          </div>

          <Select value={currentAppointment.status} onValueChange={(v) => handleStatusChange(v as StudyStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Cambiar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in-study">En estudio</SelectItem>
              <SelectItem value="reported">Reportado</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report Section */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Informe
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              Plantillas <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {showTemplates && (
            <div className="bg-muted rounded-lg border border-border overflow-hidden">
              {REPORT_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t.content)}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-secondary transition-colors border-b border-border last:border-0 font-medium"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          <Textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Escriba el informe aquí..."
            className="min-h-[200px] font-mono text-sm"
          />
          <Button onClick={handleSaveReport} className="w-full">
            Guardar Informe
          </Button>
        </div>

        {/* Images Section */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-primary" />
            Imágenes
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/bmp,image/gif,image/webp,image/tiff"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Cargar Imágenes
          </Button>

          {currentAppointment.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {currentAppointment.images.map((img, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                  <img src={img} alt={`Ecografía ${i + 1}`} className="w-full h-32 object-cover" />
                  <button
                    onClick={() => { if (id) store.removeImageFromAppointment(id, i); }}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-4">
          <Button onClick={generatePDF} className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Generar Informe PDF
          </Button>
          <Button
            onClick={sendWhatsApp}
            className="w-full btn-whatsapp"
            size="lg"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar por WhatsApp
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppointmentPage;
