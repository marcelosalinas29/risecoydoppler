import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Phone, Calendar, FileText, ImagePlus, Send, Download, Trash2, ChevronDown, Edit2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useClinicStore } from '@/store/useClinicStore';
import { useAuth } from '@/contexts/AuthContext';
import { STATUS_LABELS, type StudyStatus, formatStudyType } from '@/types/medical';
import TemplateSelector from '@/components/TemplateSelector';
import StudyTypeSelector from '@/components/StudyTypeSelector';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
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

/** Convert HTML to plain text preserving paragraph breaks */
function htmlToPlainText(html: string): string {
  // Replace closing block tags with newlines before stripping
  let text = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n');
  // Strip remaining HTML tags
  const div = document.createElement('div');
  div.innerHTML = text;
  text = div.textContent || div.innerText || '';
  // Clean up multiple newlines but preserve paragraph spacing
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

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

  useEffect(() => {
    if (!appointment && id) {
      store.fetchAppointments().then(() => store.fetchPatients());
    }
  }, [id]);

  useEffect(() => {
    if (appointment && !report && appointment.report) {
      setReport(appointment.report);
      setIsEditing(false);
    }
  }, [appointment?.report]);

  const handleSaveReport = useCallback(async () => {
    if (!id) return;
    // Store who reported (doctor's user_id)
    const reportedBy = !isSecretary && user ? user.id : undefined;
    await store.updateAppointmentReport(id, report, reportedBy);
    if (appointment?.status === 'pending' || appointment?.status === 'in-study') {
      await store.updateAppointmentStatus(id, 'reported');
    }
    toast.success('Informe guardado');
  }, [id, report, store, appointment?.status, isSecretary, user]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !id) return;
    toast.info('Comprimiendo imágenes...');
    const { compressImage } = await import('@/lib/imageUtils');
    const images = await Promise.all(Array.from(files).map((f) => compressImage(f)));
    await store.addImagesToAppointment(id, images);
    toast.success(`${images.length} imagen(es) cargada(s)`);
  };

  const applyTemplate = (content: string) => {
    setReport(content);
    setIsEditing(true);
  };

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

    const drawFooter = () => {
      const footerY = pageHeight - 18;
      doc.setDrawColor(37, 99, 135);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(37, 99, 135);
      doc.text('Rivadavia 465, reconquista Santa Fe', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Tel.: 3482437948- WhatsApp: 3482244516', pageWidth / 2, footerY + 3.5, { align: 'center' });
      doc.text('www.dmrimagenes.com.ar', pageWidth / 2, footerY + 7, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    // ====== HEADER (logo + subtitle) ======
    try {
      const logoImg = await loadImage(clinicLogo);
      const logoHeight = 28;
      const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
      doc.addImage(clinicLogo, 'PNG', (pageWidth - logoWidth) / 2, 6, logoWidth, logoHeight);
    } catch {
      // Fallback text if logo fails to load
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 135);
      doc.text('DIAGNOSTICO', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(16);
      doc.text('MEDICO RECONQUISTA', pageWidth / 2, 26, { align: 'center' });
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(37, 99, 135);
    doc.text('S E R V I C I O   D E   E C O G R A F I A   Y   D O P P L E R', pageWidth / 2, 36, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.setDrawColor(37, 99, 135);
    doc.setLineWidth(0.5);
    doc.line(margin, 39, pageWidth - margin, 39);

    // ====== PATIENT INFO ======
    let y = 47;
    const fontSize = 11;
    doc.setFontSize(fontSize);
    const valueX = margin + 30; // Fixed X position for all values

    const drawLabel = (label: string, x: number, yPos: number) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, yPos);
      const w = doc.getTextWidth(label);
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(x, yPos + 1, x + w, yPos + 1);
    };

    const drawValue = (value: string, x: number, yPos: number) => {
      doc.setFont('helvetica', 'bold');
      doc.text(value.toUpperCase(), x, yPos);
    };

    drawLabel('PACIENTE:', margin, y);
    drawValue(appointment.patient.name, valueX, y);

    y += 7;
    drawLabel('FECHA:', margin, y);
    // Parse date parts to avoid timezone offset (new Date('YYYY-MM-DD') is UTC, shifts day in AR)
    const [yy, mm, dd] = appointment.date.split('-').map(Number);
    const dateStr = format(new Date(yy, mm - 1, dd), "d 'de' MMMM yyyy", { locale: es });
    drawValue(dateStr, valueX, y);

    y += 7;
    drawLabel('EDAD:', margin, y);
    const ageText = `${appointment.patient.age} AÑOS`;
    drawValue(ageText, valueX, y);
    if (appointment.patient.dni) {
      const dniLabelX = valueX + doc.getTextWidth(ageText + '   ') + 10;
      drawLabel('DNI:', dniLabelX, y);
      drawValue(appointment.patient.dni, dniLabelX + 16, y);
    }

    y += 7;
    drawLabel('ESTUDIO:', margin, y);
    const studyText = formatStudyType(currentAppointment.studyType || appointment.studyType);
    const studyLines = doc.splitTextToSize(studyText, contentWidth - (valueX - margin));
    doc.setFont('helvetica', 'bold');
    doc.text(studyLines, valueX, y);
    y += studyLines.length * 5;

    y += 3;
    doc.setDrawColor(37, 99, 135);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    // ====== REPORT BODY with bold support ======
    y += 8;
    doc.setFontSize(10);

    /** Parse HTML into segments of {text, bold} preserving line breaks */
    const parseHtmlToSegments = (html: string): Array<Array<{ text: string; bold: boolean }>> => {
      // Split by block-level tags into lines
      const blockHtml = html
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n');

      // Process each line
      const lines = blockHtml.split('\n');
      const result: Array<Array<{ text: string; bold: boolean }>> = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          result.push([]); // empty line = paragraph break
          continue;
        }

        // Parse inline bold tags (<strong>, <b>)
        const segments: Array<{ text: string; bold: boolean }> = [];
        const regex = /<(strong|b)>(.*?)<\/\1>/gi;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        // Work on a copy stripped of non-bold tags
        const cleanLine = trimmed.replace(/<(?!\/?(?:strong|b)>)[^>]+>/gi, '');

        while ((match = regex.exec(cleanLine)) !== null) {
          // Text before the bold tag
          if (match.index > lastIndex) {
            const before = cleanLine.substring(lastIndex, match.index);
            const plain = before.replace(/<[^>]+>/g, '');
            if (plain) segments.push({ text: plain, bold: false });
          }
          // Bold text
          const boldText = match[2].replace(/<[^>]+>/g, '');
          if (boldText) segments.push({ text: boldText, bold: true });
          lastIndex = match.index + match[0].length;
        }

        // Remaining text after last bold tag
        if (lastIndex < cleanLine.length) {
          const remaining = cleanLine.substring(lastIndex).replace(/<[^>]+>/g, '');
          if (remaining) segments.push({ text: remaining, bold: false });
        }

        if (segments.length === 0) {
          // No bold tags found, strip all HTML
          const plain = cleanLine.replace(/<[^>]+>/g, '');
          if (plain) segments.push({ text: plain, bold: false });
        }

        if (segments.length > 0) result.push(segments);
      }
      return result;
    };

    /** Render segments into PDF with word-wrap and bold support */
    const renderSegments = (segmentLines: Array<Array<{ text: string; bold: boolean }>>) => {
      for (const segments of segmentLines) {
        if (segments.length === 0) {
          y += 3; // paragraph spacing
          continue;
        }

        // Build the full text to measure for word wrap
        const fullText = segments.map(s => s.text).join('');
        doc.setFont('helvetica', 'normal');
        const wrappedLines = doc.splitTextToSize(fullText, contentWidth);

        if (wrappedLines.length === 1) {
          // Single line: render each segment with proper font
          let xPos = margin;
          for (const seg of segments) {
            doc.setFont('helvetica', seg.bold ? 'bold' : 'normal');
            doc.text(seg.text, xPos, y);
            xPos += doc.getTextWidth(seg.text);
          }
          y += 5;
        } else {
          // Multi-line: render with bold tracking across line breaks
          let charIndex = 0;
          for (const wLine of wrappedLines) {
            if (y > pageHeight - 50) {
              drawFooter();
              doc.addPage();
              y = 20;
            }
            // Map each character to bold/normal based on segments
            let xPos = margin;
            let segCharIdx = 0;
            let currentSegment = 0;
            let segOffset = 0;

            // Find which segment corresponds to charIndex
            let tempIdx = 0;
            for (let si = 0; si < segments.length; si++) {
              if (tempIdx + segments[si].text.length > charIndex) {
                currentSegment = si;
                segOffset = charIndex - tempIdx;
                break;
              }
              tempIdx += segments[si].text.length;
            }

            // Render character runs with same style
            let linePos = 0;
            while (linePos < wLine.length) {
              const seg = segments[currentSegment];
              if (!seg) break;
              const remainInSeg = seg.text.length - segOffset;
              const remainInLine = wLine.length - linePos;
              const runLen = Math.min(remainInSeg, remainInLine);
              const runText = wLine.substring(linePos, linePos + runLen);

              doc.setFont('helvetica', seg.bold ? 'bold' : 'normal');
              doc.text(runText, xPos, y);
              xPos += doc.getTextWidth(runText);

              linePos += runLen;
              segOffset += runLen;
              charIndex += runLen;

              if (segOffset >= seg.text.length) {
                currentSegment++;
                segOffset = 0;
              }
            }
            y += 5;
          }
        }

        if (y > pageHeight - 50) {
          drawFooter();
          doc.addPage();
          y = 20;
        }
      }
    };

    const segmentLines = parseHtmlToSegments(report || '<p>Sin informe</p>');
    renderSegments(segmentLines);

    // ====== SIGNATURE - right-aligned, below report ======
    y += 10;
    if (y > pageHeight - 55) {
      drawFooter();
      doc.addPage();
      y = 20;
    }

    const signBlockWidth = 70;
    const signX = pageWidth - margin - signBlockWidth;

    // Determine which profile/email to use for signature
    // If secretary, use the doctor who reported (reported_by)
    let pdfProfile = profile;
    let pdfEmail = user?.email || '';

    if (isSecretary && currentAppointment.reportedBy) {
      // Fetch the doctor's profile (which now includes email)
      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentAppointment.reportedBy)
        .single();
      if (doctorProfile) {
        pdfProfile = doctorProfile as any;
        pdfEmail = (doctorProfile as any).email || '';
      }
    }

    const signatureImgSrc = SIGNATURE_IMAGES[pdfEmail];

    if (signatureImgSrc) {
      try {
        const sigImg = await loadImage(signatureImgSrc);
        const sigRatio = sigImg.naturalWidth / sigImg.naturalHeight;
        const sigMaxW = 40;
        let sigW = sigMaxW;
        let sigH = sigW / sigRatio;
        if (sigH > 25) {
          sigH = 25;
          sigW = sigH * sigRatio;
        }
        doc.addImage(signatureImgSrc, 'PNG', signX + (signBlockWidth - sigW) / 2, y, sigW, sigH);
        y += sigH + 2;
      } catch { /* fallback */ }
    }

    doc.setDrawColor(37, 99, 135);
    doc.setLineWidth(0.4);
    doc.line(signX, y, signX + signBlockWidth, y);

    const sigText = pdfProfile?.signature_text || pdfProfile?.full_name || 'Dr. Salinas A. Marcelo';
    doc.setFontSize(11);
    doc.setFont('times', 'bolditalic');
    doc.text(sigText, signX + signBlockWidth / 2, y + 6, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const specialtyLines = (pdfProfile?.specialty || 'Médico especialista en\nDiagnóstico por Imágenes').split('\n');
    specialtyLines.forEach((line, idx) => {
      doc.text(line, signX + signBlockWidth / 2, y + 12 + idx * 4, { align: 'center' });
    });

    doc.setFontSize(7);
    const licenseY = y + 12 + specialtyLines.length * 4;
    doc.text(pdfProfile?.license_numbers || 'MN 134217  MP 7298  Fº54  Lº4to', signX + signBlockWidth / 2, licenseY + 2, { align: 'center' });

    drawFooter();

    // ====== IMAGES ======
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
    toast.info('Generando PDF...');

    try {
      const doc = await buildPdfDoc();
      const pdfBlob = doc.output('blob');
      const fileName = `Informe_${appointment.patient.name.replace(/\s/g, '_')}_${appointment.date}.pdf`;

      // Upload to storage + WhatsApp direct link with phone number
      const uploadName = `informe_${appointment.patient.name.replace(/\s/g, '_')}_${appointment.date}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(uploadName, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(uploadName);
      const publicUrl = urlData.publicUrl;

      // Normalize Argentine phone: +54 9 [area][number]
      let phone = appointment.patient.phone.replace(/[\s\-\(\)\.\+]/g, '');
      if (phone.startsWith('549')) {
        // Already correct: 549XXXXXXXXXX
      } else if (phone.startsWith('54')) {
        phone = '549' + phone.substring(2);
      } else {
        // Local: remove leading 0, then remove 15 after area code
        if (phone.startsWith('0')) phone = phone.substring(1);
        phone = phone.replace(/^(\d{2,4})15(\d{6,})$/, '$1$2');
        phone = '549' + phone;
      }
      phone = phone.replace(/\D/g, '');

      const message = encodeURIComponent(
        `*ECOGRAFÍA Y DOPPLER*\n*Diagnóstico Médico Reconquista*\n\nPaciente: ${appointment.patient.name}\nEstudio: ${formatStudyType(appointment.studyType)}\nFecha: ${format(new Date(appointment.date), "d/MM/yyyy")}\n\n📄 *Descargá tu informe PDF aquí:*\n${publicUrl}`
      );
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');

      await store.updateAppointmentStatus(id, 'sent');
      toast.success('WhatsApp abierto con enlace al PDF');
    } catch (err) {
      console.error('Error al enviar:', err);
      toast.error('Error al generar o compartir el PDF');
    }
  };

  if (!appointment) {
    if (store.loading) {
      return (
        <AppLayout title="Cargando...">
          <AppointmentSkeleton />
        </AppLayout>
      );
    }
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
              <FileText className="w-3 h-3" />
              <span className="uppercase font-bold text-xs">{formatStudyType(currentAppointment.studyType)}</span>
              <button onClick={() => setShowStudySelector(true)} className="ml-1 text-primary hover:text-primary/80">
                <Edit2 className="w-3 h-3" />
              </button>
            </span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(appointment.date), "d/MM/yyyy")}</span>
            {appointment.patient.obraSocial && (
              <span>Obra Social: {appointment.patient.obraSocial}</span>
            )}
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

        {/* Report Section - Rich Text Editor */}
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
              <RichTextEditor
                content={report}
                onChange={setReport}
                disabled={isSecretary}
                placeholder="Escriba el informe aquí..."
              />
              {!isSecretary && (
                <Button onClick={async () => { await handleSaveReport(); setIsEditing(false); }} className="w-full btn-action-primary">
                  Guardar Informe
                </Button>
              )}
            </>
          ) : (
            <div
              className="bg-muted/50 rounded-lg p-4 prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: report }}
            />
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
