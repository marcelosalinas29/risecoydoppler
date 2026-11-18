import { useState } from 'react';
import { STUDY_TYPES, studyTitle, studyProtocol, resolveMultipleStudyTexts, suggestStudyTypes, orderStudyParts, PENDING_DEFINITION_SUFFIX } from '@/types/medical';
import { suggestTemplates } from '@/data/studyTemplateMap';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Plus } from 'lucide-react';

interface StudyTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (studyType: string) => void;
  currentValue?: string;
}

const StudyTypeSelector = ({ open, onOpenChange, onApply, currentValue }: StudyTypeSelectorProps) => {
  const [selected, setSelected] = useState<string[]>(() => {
    if (!currentValue) return [];
    return currentValue.split(' + ').filter(s => STUDY_TYPES.includes(s));
  });
  const [customText, setCustomText] = useState(() => {
    if (!currentValue) return '';
    const parts = currentValue.split(' + ');
    const custom = parts.filter(s => !STUDY_TYPES.includes(s));
    return custom.join(', ');
  });

  const toggleType = (type: string) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const addPart = (parts: string[], value: string) => {
    if (!parts.includes(value)) parts.push(value);
  };

  const handleApply = () => {
    const parts: string[] = [...selected];
    const raw = customText.trim();
    if (raw) {
      // Se separa por "+"/"," y cada estudio se reconoce por separado, así
      // aunque se escriban varios juntos en el cuadro de texto, cada uno que
      // ya exista en la lista se tilda solo en vez de quedar como texto libre.
      for (const { text, resolution } of resolveMultipleStudyTexts(raw)) {
        if (resolution.kind === 'bare') {
          const ok = window.confirm(
            'Escribiste solo "Ecografía", sin especificar de qué. Eso no es un estudio en sí mismo.\n\n' +
            'Aceptar: lo dejo cargado como PENDIENTE DE DEFINIR (marcado en rojo) hasta que se corrija.\n' +
            'Cancelar: vuelvo a escribirlo.'
          );
          if (!ok) return;
          addPart(parts, 'Ecografía' + PENDING_DEFINITION_SUFFIX);
        } else if (resolution.kind === 'needs_confirmation') {
          const ok = window.confirm(`"${text}" no es un estudio médico real. ¿Es "${resolution.suggestion}"?`);
          addPart(parts, ok ? resolution.suggestion : text);
        } else if (resolution.kind === 'matched') {
          addPart(parts, resolution.canonical);
        } else if (resolution.kind === 'freeform') {
          addPart(parts, text);
        }
      }
    }
    if (parts.length === 0) return;
    onApply(orderStudyParts(parts).join(' + '));
    onOpenChange(false);
  };

  const suggestions = suggestStudyTypes(customText).filter((s) => !selected.includes(s));

  const pickSuggestion = (name: string) => {
    toggleType(name);
    setCustomText('');
  };

  const handleReset = () => {
    if (currentValue) {
      const parts = currentValue.split(' + ');
      setSelected(parts.filter(s => STUDY_TYPES.includes(s)));
      setCustomText(parts.filter(s => !STUDY_TYPES.includes(s)).join(', '));
    } else {
      setSelected([]);
      setCustomText('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Seleccionar Estudios
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Estudio personalizado (solo si no está en la lista de abajo)
            </label>
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Ej: Ecografía de cadera"
            />
            {suggestions.length > 0 && (
              <div className="mt-1.5 space-y-1 rounded-lg border border-border overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => pickSuggestion(s)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Ya existe: <span className="font-semibold">{studyTitle(s)}</span> — tildar</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Estudios disponibles
            </label>
            <div className="space-y-1 border border-border rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
              {STUDY_TYPES.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border last:border-0"
                >
                  <Checkbox
                    checked={selected.includes(t)}
                    onCheckedChange={() => toggleType(t)}
                  />
                  <span className="text-sm"><span className="font-bold uppercase">{studyTitle(t)}</span>{studyProtocol(t) && <span className="block text-xs text-muted-foreground">{studyProtocol(t)}</span>}</span>
                </label>
              ))}
            </div>
          </div>

          {(selected.length > 0 || customText.trim()) && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Vista previa:</p>
              <p className="text-sm font-medium">
                {[...selected, ...(customText.trim() ? [customText.trim()] : [])].join(' + ')}
              </p>
              {customText.trim() && resolveMultipleStudyTexts(customText).map(({ text, resolution }) => (
                <span key={text}>
                  {resolution.kind === 'bare' && (
                    <p className="text-xs text-destructive font-semibold mt-2">⚠ "Ecografía" sola no es un estudio: al aplicar se va a pedir confirmación para dejarlo PENDIENTE DE DEFINIR.</p>
                  )}
                  {resolution.kind === 'freeform' && suggestTemplates(text).length === 0 && (
                    <p className="text-xs text-amber-700 mt-2">"{text}" se guarda como estudio escrito a mano, sin plantilla: el informe se escribe desde cero.</p>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={selected.length === 0 && !customText.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudyTypeSelector;
