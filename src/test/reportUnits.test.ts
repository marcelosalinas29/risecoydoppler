import { describe, it, expect } from 'vitest';
import { htmlToPlainText, plainTextToHtml } from '@/lib/reportUnits';
import { getSectionUnits, applyUnitUpdates } from '@/lib/subsections';

const TEMPLATE = `Hígado: de forma, tamaño y ecoestructura conservados.
Vesícula: de paredes finas. Alitiásica.
No se observa líquido libre en cavidad.`;

describe('puente HTML <-> texto plano', () => {
  it('ida y vuelta preserva las líneas', () => {
    const html = plainTextToHtml(TEMPLATE);
    expect(html).toContain('<strong>Hígado:</strong>');
    expect(htmlToPlainText(html)).toBe(TEMPLATE);
  });
});

describe('unidades', () => {
  it('una línea con etiqueta es una sola unidad', () => {
    const { units } = getSectionUnits({ title: 'Informe', content: TEMPLATE });
    expect(units.length).toBe(3);
    expect(units[1].label).toBe('Vesícula');
  });

  it('reemplaza quirúrgicamente conservando el orden', () => {
    const out = applyUnitUpdates(
      { title: 'Informe', content: TEMPLATE },
      [{ sectionTitle: 'Informe', unitIndex: 0, action: 'replace', text: 'Hígado: esteatosis moderada.' }],
    );
    expect(out.split('\n')[0]).toBe('Hígado: esteatosis moderada.');
    expect(out.split('\n').length).toBe(3);
    expect(out).not.toContain('ecoestructura conservados');
  });

  it('append agrega al final sin tocar el resto', () => {
    const out = applyUnitUpdates(
      { title: 'Informe', content: TEMPLATE },
      [{ sectionTitle: 'Informe', unitIndex: null, action: 'append', text: 'Adenopatías retroperitoneales.' }],
    );
    expect(out.split('\n').length).toBe(4);
    expect(out.endsWith('Adenopatías retroperitoneales.')).toBe(true);
  });
});
