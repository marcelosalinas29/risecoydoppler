import { useState, useRef, useCallback, useEffect } from 'react';
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
import signatureMarceloSalinas from '@/assets/signatures/marcelosalinas29.png';
import signatureMarimar from '@/assets/signatures/marimarschreiber.png';
import { supabase } from '@/integrations/supabase/client';

const SIGNATURE_IMAGES: Record<string, string> = {
  'marcelosalinas29@gmail.com': signatureMarceloSalinas,
  'marimarschreiber@gmail.com': signatureMarimar,
};

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
  const { profile, isSecretary, user } = useAuth();
  const appointment = store.getAppointment(id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStudySelector, setShowStudySelector] = useState(false);
  const [isEditing, setIsEditing] = useState(!appointment?.report);
  const [report, setReport] = useState(appointment?.report || '');

  // Fetch data if not loaded yet
  useEffect(() => {
    if (!appointment && id) {
      store.fetchAppointments().then(() => store.fetchPatients());
    }
  }, [id]);

  // Sync report when appointment loads
  useEffect(() => {
    if (appointment && !report && appointment.report) {
      setReport(appointment.report);
      setIsEditing(false);
    }
  }, [appointment?.report]);

  const handleSaveReport = useCallback(async () => {
    if (!id) return;
    await store.updateAppointmentReport(id, report);
    if (appointment?.status === 'pending' || appointment?.status === 'in-study') {
      await store.updateAppointmentStatus(id, 'reported');
    }
    toast.success('Informe guardado');
  }, [id, report, store, appointment?.status]);

  const handleStatusChange = async (status: StudyStatus) => {
    if (!id) return;
    await store.updateAppointmentStatus(id, status);
    toast.success(`Estado actualizado a: ${STATUS_LABELS[status]}`);
  };

  const handleStudyTypeChange = async (studyType: string) => {
    if (!id) return;
    await store.updateAppointmentStudyType(id, studyType);
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
    await store.addImagesToAppointment(id, images);
    toast.success(`${images.length} imagen(es) cargada(s)`);
  };

  const applyTemplate = (content: string) => {
    setReport(content);
    setIsEditing(true);
  };

  // Helper to load image and get natural dimensions
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const buildPdfDoc = async (): Promise<jsPDF> => {
    if (!appointment) throw new Error('No appointment');
    const currentAppointment = store.getAppointment(id || '') || appointment;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 22;
    const contentWidth = pageWidth - margin * 2;

    // Footer helper
    const drawFooter = () => {
      const footerY = pageHeight - 14;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Rivadavia N° 465 — Reconquista (Santa Fe) — Tel: 03482-437948', pageWidth / 2, footerY, { align: 'center' });
      doc.text('dmrimagenes@gmail.com — dmrimagenes.com.ar', pageWidth / 2, footerY + 3.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    // ====== HEADER ======
    // Logo - maintain aspect ratio
    try {
      const logoImg = await loadImage(clinicLogo);
      const logoMaxH = 22;
      const logoRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      const logoW = logoMaxH * logoRatio;
      doc.addImage(clinicLogo, 'PNG', margin, 10, logoW, logoMaxH);
    } catch {
      // skip logo
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnóstico Médico Reconquista', margin + 28, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ECOGRAFÍA Y DOPPLER', margin + 28, 25);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de Estudio', margin + 28, 31);

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, 37, pageWidth - margin, 37);

    // ====== PATIENT INFO - Calibri-like (helvetica bold) size 14 with underline ======
    let y = 47;
    const fontSize = 11;
    doc.setFontSize(fontSize);

    // PACIENTE:
    doc.setFont('helvetica', 'bold');
    doc.text('PACIENTE:', margin, y);
    doc.setFont('helvetica', 'normal');
    const patNameX = margin + 32;
    doc.text(appointment.patient.name, patNameX, y);
    // Underline patient name
    const nameWidth = doc.getTextWidth(appointment.patient.name);
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0);
    doc.line(patNameX, y + 1, patNameX + nameWidth, y + 1);

    y += 8;
    // FECHA:
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', margin, y);
    doc.setFont('helvetica', 'normal');
    const dateStr = format(new Date(appointment.date), "d 'de' MMMM yyyy", { locale: es });
    doc.text(dateStr, margin + 22, y);

    y += 8;
    // EDAD: ... DNI:
    doc.setFont('helvetica', 'bold');
    doc.text('EDAD:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${appointment.patient.age} AÑOS`, margin + 20, y);

    if (appointment.patient.dni) {
      const dniX = pageWidth / 2 + 10;
      doc.setFont('helvetica', 'bold');
      doc.text('DNI:', dniX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(appointment.patient.dni, dniX + 16, y);
    }

    y += 8;
    // ESTUDIO:
    doc.setFont('helvetica', 'bold');
    doc.text('ESTUDIO:', margin, y);
    doc.setFont('helvetica', 'normal');
    const studyText = currentAppointment.studyType || appointment.studyType;
    const studyLines = doc.splitTextToSize(studyText, contentWidth - 30);
    doc.text(studyLines, margin + 28, y);
    y += studyLines.length * 5;

    y += 3;
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    // ====== REPORT BODY ======
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const reportLines = doc.splitTextToSize(report || 'Sin informe', contentWidth);
    for (const line of reportLines) {
      if (y > pageHeight - 50) {
        drawFooter();
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    // ====== SIGNATURE - right-aligned, below report ======
    y += 10;
    if (y > pageHeight - 55) {
      drawFooter();
      doc.addPage();
      y = 20;
    }

    const signBlockWidth = 70;
    const signX = pageWidth - margin - signBlockWidth;

    // Signature image
    const userEmail = user?.email || '';
    const signatureImgSrc = SIGNATURE_IMAGES[userEmail];

    if (signatureImgSrc) {
      try {
        const sigImg = await loadImage(signatureImgSrc);
        const sigRatio = sigImg.naturalWidth / sigImg.naturalHeight;
        const sigW = 50;
        const sigH = sigW / sigRatio;
        doc.addImage(signatureImgSrc, 'PNG', signX + (signBlockWidth - sigW) / 2, y, sigW, sigH);
        y += sigH + 2;
      } catch {
        // fallback
      }
    }

    // Line
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.4);
    doc.line(signX, y, signX + signBlockWidth, y);

    // Name
    const sigText = profile?.signature_text || profile?.full_name || 'Dr. Salinas A. Marcelo';
    doc.setFontSize(11);
    doc.setFont('times', 'bolditalic');
    doc.text(sigText, signX + signBlockWidth / 2, y + 6, { align: 'center' });

    // Specialty
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const specialtyLines = (profile?.specialty || 'Médico especialista en\nDiagnóstico por Imágenes').split('\n');
    specialtyLines.forEach((line, idx) => {
      doc.text(line, signX + signBlockWidth / 2, y + 12 + idx * 4, { align: 'center' });
    });

    // License
    doc.setFontSize(7);
    const licenseY = y + 12 + specialtyLines.length * 4;
    doc.text(profile?.license_numbers || 'MN 134217  MP 7298  Fº54  Lº4to', signX + signBlockWidth / 2, licenseY + 2, { align: 'center' });

    drawFooter();

    // ====== IMAGES - maintain aspect ratio ======
    const currentApp = store.getAppointment(id || '');
    if (currentApp && currentApp.images.length > 0) {
      const maxImgW = (contentWidth - 8) / 2;
      const maxImgH = 80;
      let imgIndex = 0;

      while (imgIndex < currentApp.images.length) {
        doc.addPage();
        let iy = 20;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Imágenes del Estudio', margin, iy);
        iy += 10;

        let countOnPage = 0;
        const imagesPerPage = 6;

        while (imgIndex < currentApp.images.length && countOnPage < imagesPerPage) {
          const col = countOnPage % 2;

          try {
            const imgEl = await loadImage(currentApp.images[imgIndex]);
            const imgRatio = imgEl.naturalWidth / imgEl.naturalHeight;

            let drawW = maxImgW;
            let drawH = drawW / imgRatio;
            if (drawH > maxImgH) {
              drawH = maxImgH;
              drawW = drawH * imgRatio;
            }

            const x = margin + col * (maxImgW + 8) + (maxImgW - drawW) / 2;
            doc.addImage(currentApp.images[imgIndex], 'JPEG', x, iy, drawW, drawH);

            imgIndex++;
            countOnPage++;
            if (col === 1 || imgIndex >= currentApp.images.length || countOnPage >= imagesPerPage) {
              iy += maxImgH + 5;
            }
          } catch {
            imgIndex++;
            countOnPage++;
          }
        }

        drawFooter();
      }
    }

    return doc;
  };

  const generatePDF = async () => {
    if (!appointment) return;
    await handleSaveReport();
    const doc = await buildPdfDoc();
    doc.save(`Informe_${appointment.patient.name.replace(/\s/g, '_')}_${appointment.date}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const sendWhatsApp = async () => {
    if (!appointment || !id) return;
    await handleSaveReport();

    toast.info('Generando PDF y subiendo...');

    try {
      const doc = await buildPdfDoc();
      const pdfBlob = doc.output('blob');
      const fileName = `informe_${appointment.patient.name.replace(/\s/g, '_')}_${appointment.date}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const qrDataUrl = await QRCode.toDataURL(publicUrl, { width: 256, margin: 1 });

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

      await store.updateAppointmentStatus(id, 'sent');
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
            {appointment.patient.dni && <span>DNI: {appointment.patient.dni}</span>}
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
                  <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
                    Plantillas <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                  {report && !isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
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
                <Button onClick={async () => { await handleSaveReport(); setIsEditing(false); }} className="w-full btn-action-primary">
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
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
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
                      onClick={async () => { if (id) await store.removeImageFromAppointment(id, i); }}
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
          <Button onClick={generatePDF} className="w-full btn-action-primary" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Generar Informe PDF
          </Button>
          <Button onClick={sendWhatsApp} className="w-full btn-whatsapp" size="lg">
            <Send className="w-4 h-4 mr-2" />
            Enviar por WhatsApp
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AppointmentPage;
