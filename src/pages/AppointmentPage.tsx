import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Phone, Calendar, FileText, ImagePlus, Send, Download, Trash2, ChevronDown, Edit2, Save, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { calcularEdad } from '@/types/medical';
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

    // ====== REPORT BODY with rich formatting ======
    y += 8;

    interface TextSegment { text: string; bold: boolean; italic: boolean; underline: boolean; }
    interface PdfParagraph { segments: TextSegment[]; lineHeight: number; align: 'left' | 'center' | 'right'; }

    const parseHtmlToPdfParagraphs = (html: string): PdfParagraph[] => {
      const container = document.createElement('div');
      container.innerHTML = html;
      const paragraphs: PdfParagraph[] = [];

      const extractSegments = (node: Node, style: { bold: boolean; italic: boolean; underline: boolean }): TextSegment[] => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (!text) return [];
          return [{ text, ...style }];
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return [];
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'br') return [{ text: '\n', ...style }];
        const newStyle = { ...style };
        if (tag === 'strong' || tag === 'b') newStyle.bold = true;
        if (tag === 'em' || tag === 'i') newStyle.italic = true;
        if (tag === 'u') newStyle.underline = true;
        if (el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 700) newStyle.bold = true;
        if (el.style.fontStyle === 'italic') newStyle.italic = true;
        if (el.style.textDecoration?.includes('underline')) newStyle.underline = true;
        const segs: TextSegment[] = [];
        for (const child of Array.from(el.childNodes)) {
          segs.push(...extractSegments(child, newStyle));
        }
        return segs;
      };

      const processBlock = (el: HTMLElement) => {
        const lh = parseFloat(el.style.lineHeight) || 1.5;
        const align = (el.style.textAlign || 'left') as 'left' | 'center' | 'right';
        const rawSegments = extractSegments(el, { bold: false, italic: false, underline: false });
        const subParas: TextSegment[][] = [[]];
        for (const seg of rawSegments) {
          if (seg.text.includes('\n')) {
            const parts = seg.text.split('\n');
            for (let i = 0; i < parts.length; i++) {
              if (i > 0) subParas.push([]);
              if (parts[i]) subParas[subParas.length - 1].push({ ...seg, text: parts[i] });
            }
          } else {
            subParas[subParas.length - 1].push(seg);
          }
        }
        for (const sub of subParas) {
          paragraphs.push({ segments: sub, lineHeight: lh, align });
        }
      };

      for (const child of Array.from(container.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === 'ul' || tag === 'ol') {
            el.querySelectorAll('li').forEach((li, idx) => {
              const bullet = tag === 'ol' ? `${idx + 1}. ` : '• ';
              const segs = extractSegments(li, { bold: false, italic: false, underline: false });
              segs.unshift({ text: bullet, bold: false, italic: false, underline: false });
              paragraphs.push({ segments: segs, lineHeight: parseFloat((li as HTMLElement).style.lineHeight) || 1.5, align: 'left' });
            });
          } else {
            processBlock(el);
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          const txt = child.textContent?.trim();
          if (txt) paragraphs.push({ segments: [{ text: txt, bold: false, italic: false, underline: false }], lineHeight: 1.5, align: 'left' });
        }
      }
      return paragraphs;
    };

    const renderPdfParagraphs = (paras: PdfParagraph[]) => {
      const baseLine = 5;
      for (const para of paras) {
        if (para.segments.length === 0) {
          y += baseLine * (para.lineHeight / 1.5) * 0.6;
          continue;
        }
        const lineSpacing = baseLine * (para.lineHeight / 1.5);
        const fullText = para.segments.map(s => s.text).join('');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const wrappedLines = doc.splitTextToSize(fullText, contentWidth);
        let globalCharIdx = 0;

        for (const wLine of wrappedLines) {
          if (y > pageHeight - 50) { drawFooter(); doc.addPage(); y = 20; }

          // Calculate actual line width for alignment
          let calcWidth = 0;
          let tci = globalCharIdx, tsi = 0, tso = 0, tt = 0;
          for (let i = 0; i < para.segments.length; i++) {
            if (tt + para.segments[i].text.length > tci) { tsi = i; tso = tci - tt; break; }
            tt += para.segments[i].text.length;
          }
          let tlp = 0;
          while (tlp < wLine.length) {
            const seg = para.segments[tsi];
            if (!seg) break;
            const rl = Math.min(seg.text.length - tso, wLine.length - tlp);
            const rt = wLine.substring(tlp, tlp + rl);
            const fs = seg.bold && seg.italic ? 'bolditalic' : seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal';
            doc.setFont('helvetica', fs);
            calcWidth += doc.getTextWidth(rt);
            tlp += rl; tso += rl;
            if (tso >= seg.text.length) { tsi++; tso = 0; }
          }

          let xStart = margin;
          if (para.align === 'center') xStart = margin + (contentWidth - calcWidth) / 2;
          else if (para.align === 'right') xStart = margin + contentWidth - calcWidth;

          // Find starting segment
          let segIdx = 0, segOff = 0;
          tt = 0;
          for (let i = 0; i < para.segments.length; i++) {
            if (tt + para.segments[i].text.length > globalCharIdx) { segIdx = i; segOff = globalCharIdx - tt; break; }
            tt += para.segments[i].text.length;
          }

          let xPos = xStart, linePos = 0;
          while (linePos < wLine.length) {
            const seg = para.segments[segIdx];
            if (!seg) break;
            const runLen = Math.min(seg.text.length - segOff, wLine.length - linePos);
            const runText = wLine.substring(linePos, linePos + runLen);
            const fontStyle = seg.bold && seg.italic ? 'bolditalic' : seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal';
            doc.setFont('helvetica', fontStyle);
            doc.text(runText, xPos, y);
            const tw = doc.getTextWidth(runText);
            if (seg.underline) {
              doc.setLineWidth(0.3);
              doc.setDrawColor(0, 0, 0);
              doc.line(xPos, y + 1, xPos + tw, y + 1);
            }
            xPos += tw;
            linePos += runLen; segOff += runLen; globalCharIdx += runLen;
            if (segOff >= seg.text.length) { segIdx++; segOff = 0; }
          }
          y += lineSpacing;
        }
        if (y > pageHeight - 50) { drawFooter(); doc.addPage(); y = 20; }
      }
    };

    const pdfParagraphs = parseHtmlToPdfParagraphs(report || '<p>Sin informe</p>');
    renderPdfParagraphs(pdfParagraphs);

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

      const [wy, wm, wd] = appointment.date.split('-').map(Number);
      const whatsappDate = format(new Date(wy, wm - 1, wd), "d/MM/yyyy");
      const message = encodeURIComponent(
        `*ECOGRAFÍA Y DOPPLER*\n*Diagnóstico Médico Reconquista*\n\nPaciente: ${appointment.patient.name}\nEstudio: ${formatStudyType(appointment.studyType)}\nFecha: ${whatsappDate}\n\n📄 *Descargá tu informe PDF aquí:*\n${publicUrl}`
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
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{(() => { const [y, m, d] = appointment.date.split('-').map(Number); return format(new Date(y, m - 1, d), "d/MM/yyyy"); })()}</span>
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
