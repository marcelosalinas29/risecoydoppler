import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Phone, Calendar, FileText, ImagePlus, Send, Download, Trash2, ChevronDown, Edit2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { useAuth } from '@/contexts/AuthContext';
import { STATUS_LABELS, type StudyStatus } from '@/types/medical';
import TemplateSelector from '@/components/TemplateSelector';
import StudyTypeSelector from '@/components/StudyTypeSelector';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import clinicLogo from '@/assets/clinic-logo.png';
import { supabase } from '@/integrations/supabase/client';

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
  const { profile, isSecretary } = useAuth();
  const appointment = store.getAppointment(id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStudySelector, setShowStudySelector] = useState(false);
  const [isEditing, setIsEditing] = useState(!appointment?.report);

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

  const handleStudyTypeChange = (studyType: string) => {
    if (!id) return;
    store.updateAppointmentStudyType(id, studyType);
    toast.success('Tipo de estudio actualizado');
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
    setIsEditing(true);
  };

  const buildPdfDoc = async (): Promise<jsPDF> => {
    if (!appointment) throw new Error('No appointment');

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
    doc.text('Diagnóstico Médico Reconquista', margin + 35, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ECOGRAFÍA Y DOPPLER', margin + 35, 28);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de Estudio', margin + 35, 35);

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

    // Firma y sello digital
    const pageHeight = doc.internal.pageSize.getHeight();
    const signY = pageHeight - 35;
    const signX = pageWidth - margin - 70;
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.4);
    doc.line(signX, signY, signX + 70, signY);
    
    // Signature text (stylized)
    const sigText = (profile as any)?.signature_text || profile?.full_name || 'Dr. Salinas A. Marcelo';
    doc.setFontSize(12);
    doc.setFont('times', 'bolditalic');
    doc.text(sigText, signX + 35, signY + 7, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const specialtyLines = (profile?.specialty || 'Médico especialista en\nDiagnóstico por Imágenes').split('\n');
    specialtyLines.forEach((line, idx) => {
      doc.text(line, signX + 35, signY + 13 + idx * 4, { align: 'center' });
    });
    doc.setFontSize(7);
    const licenseY = signY + 13 + specialtyLines.length * 4;
    doc.text(profile?.license_numbers || 'MN 134217  MP 7298  Fº54  Lº4to', signX + 35, licenseY + 4, { align: 'center' });

    // Images
    const currentApp = store.getAppointment(id || '');
    if (currentApp && currentApp.images.length > 0) {
      const imgWidth = (contentWidth - 5) / 2;
      const imgHeight = 75;
      const rowGap = 5;
      const imagesPerPage = 6;
      let imgIndex = 0;

      while (imgIndex < currentApp.images.length) {
        doc.addPage();
        y = 20;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Imágenes del Estudio', margin, y);
        y += 10;

        let countOnPage = 0;
        while (imgIndex < currentApp.images.length && countOnPage < imagesPerPage) {
          const col = countOnPage % 2;
          const x = margin + col * (imgWidth + 5);
          try {
            doc.addImage(currentApp.images[imgIndex], 'JPEG', x, y, imgWidth, imgHeight);
          } catch {
            // skip
          }
          imgIndex++;
          countOnPage++;
          if (col === 1 || imgIndex >= currentApp.images.length || countOnPage >= imagesPerPage) {
            y += imgHeight + rowGap;
          }
        }
      }
    }

    return doc;
  };

  const generatePDF = async () => {
    if (!appointment) return;
    handleSaveReport();
    const doc = await buildPdfDoc();
    doc.save(`Informe_${appointment.patient.name.replace(/\s/g, '_')}_${appointment.date}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const sendWhatsApp = async () => {
    if (!appointment || !id) return;
    handleSaveReport();

    toast.info('Generando PDF y subiendo...');

    try {
      // 1. Generate PDF as blob
      const doc = await buildPdfDoc();
      const pdfBlob = doc.output('blob');
      const fileName = `informe_${appointment.patient.name.replace(/\s/g, '_')}_${appointment.date}_${Date.now()}.pdf`;

      // 2. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // 4. Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(publicUrl, { width: 256, margin: 1 });

      // 5. Show QR in a new window for the patient
      const qrWindow = window.open('', '_blank');
      if (qrWindow) {
        qrWindow.document.write(`
          <html>
          <head><title>QR Informe - ${appointment.patient.name}</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;background:#f8f9fa;">
            <h2 style="margin-bottom:8px;">Informe de ${appointment.patient.name}</h2>
            <p style="color:#666;margin-bottom:24px;">Escaneá el QR para descargar el informe PDF</p>
            <img src="${qrDataUrl}" alt="QR Code" style="width:256px;height:256px;" />
            <a href="${publicUrl}" target="_blank" style="margin-top:16px;color:#2563eb;">Descargar PDF directamente</a>
          </body>
          </html>
        `);
      }

      // 6. Send WhatsApp with link
      let phone = appointment.patient.phone.replace(/[\s\-\(\)]/g, '');
      if (phone.startsWith('+')) {
        phone = phone.substring(1);
      } else if (phone.startsWith('0')) {
        phone = '54' + phone.substring(1);
      } else if (phone.replace(/\D/g, '').length <= 10) {
        phone = '54' + phone;
      }
      phone = phone.replace(/\D/g, '');

      const message = encodeURIComponent(
        `*ECOGRAFÍA Y DOPPLER*\n*Diagnóstico Médico Reconquista*\n\nPaciente: ${appointment.patient.name}\nEstudio: ${appointment.studyType}\nFecha: ${format(new Date(appointment.date), "d/MM/yyyy")}\n\n📄 *Descargá tu informe PDF aquí:*\n${publicUrl}`
      );
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');

      store.updateAppointmentStatus(id, 'sent');
      toast.success('PDF subido y WhatsApp abierto');
    } catch (err) {
      console.error('Error al enviar:', err);
      toast.error('Error al generar o subir el PDF');
    }
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
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />{currentAppointment.studyType}
              <button onClick={() => setShowStudySelector(true)} className="ml-1 text-primary hover:text-primary/80">
                <Edit2 className="w-3 h-3" />
              </button>
            </span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(appointment.date), "d/MM/yyyy")}</span>
        </div>

        <StudyTypeSelector
          open={showStudySelector}
          onOpenChange={setShowStudySelector}
          onApply={handleStudyTypeChange}
          currentValue={currentAppointment.studyType}
        />

          <Select value={currentAppointment.status} onValueChange={(v) => handleStatusChange(v as StudyStatus)} disabled={isSecretary}>
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
              Informe {isSecretary && <span className="text-xs text-muted-foreground">(solo lectura)</span>}
            </h2>
            <div className="flex gap-2">
              {!isSecretary && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(true)}
                  >
                    Plantillas <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                  {report && !isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Editar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <TemplateSelector
            open={showTemplates}
            onOpenChange={setShowTemplates}
            onApply={applyTemplate}
            currentReport={report}
          />

          {isEditing || !report ? (
            <>
              <Textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Escriba el informe aquí..."
                className="min-h-[200px] font-mono text-sm"
                disabled={isSecretary}
              />
              {!isSecretary && (
                <Button onClick={() => { handleSaveReport(); setIsEditing(false); }} className="w-full">
                  Guardar Informe
                </Button>
              )}
            </>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-foreground">
              {report}
            </div>
          )}
        </div>

        {/* Images Section */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-primary" />
            Imágenes {isSecretary && <span className="text-xs text-muted-foreground">(solo lectura)</span>}
          </h2>

          {!isSecretary && (
            <>
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
            </>
          )}

          {currentAppointment.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {currentAppointment.images.map((img, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                  <img src={img} alt={`Ecografía ${i + 1}`} className="w-full h-32 object-cover" />
                  {!isSecretary && (
                    <button
                      onClick={() => { if (id) store.removeImageFromAppointment(id, i); }}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
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
