import { describe, it, expect } from 'vitest';
import { formatStudyType, resolveStudyTypeText, resolveMultipleStudyTexts, suggestStudyTypes, STUDY_TYPES } from './medical';

describe('nombres de estudio completos', () => {
  it('expande abreviaturas', () => {
    expect(formatStudyType('Eco Doppler Venoso MMII (TVP)')).toBe('DOPPLER VENOSO DE MIEMBROS INFERIORES');
    expect(formatStudyType('Ecografía Mamaria y Ginecológica TV')).toBe('ECOGRAFÍA MAMARIA Y GINECOLÓGICA TRANSVAGINAL');
    expect(formatStudyType('Eco Doppler Venoso MMII (Insuficiencia / Mapeo)')).toBe('DOPPLER VENOSO DE MIEMBROS INFERIORES');
    expect(formatStudyType('Eco Doppler Venoso MMSS')).toBe('DOPPLER VENOSO DE MIEMBROS SUPERIORES');
    expect(formatStudyType('Eco Doppler TSA')).toBe('DOPPLER TRONCOS SUPRAAÓRTICOS');
    expect(formatStudyType('TN y Doppler Uterino')).toBe('TRANSLUCENCIA NUCAL Y DOPPLER UTERINO');
  });
  it('ningún estudio de la lista queda abreviado', () => {
    for (const t of STUDY_TYPES) expect(formatStudyType(t)).not.toMatch(/\b(MMII|MMSS|TV|TVP|TSA|TN|ECO)\b/);
  });
});

describe('reconocimiento de estudios escritos a mano (resolveStudyTypeText)', () => {
  it('ignora paréntesis al reconocer abreviaturas, aunque se tipeen a mano', () => {
    expect(resolveStudyTypeText('Eco Doppler Venoso MMII (TVP)')).toEqual({
      kind: 'matched', canonical: 'Doppler Venoso de Miembros Inferiores (TVP)',
    });
    expect(resolveStudyTypeText('eco doppler venoso mmii (tvp)')).toEqual({
      kind: 'matched', canonical: 'Doppler Venoso de Miembros Inferiores (TVP)',
    });
  });
});

describe('varios estudios escritos juntos en el texto libre (resolveMultipleStudyTexts)', () => {
  it('reconoce cada estudio por separado aunque se escriban todos juntos con "+", incluso sin espacios', () => {
    const chunks = resolveMultipleStudyTexts('Ecografía Abdominal + Ecografía Transvaginal+Ecografia Mamaria');
    expect(chunks.map((c) => c.resolution)).toEqual([
      { kind: 'matched', canonical: 'Ecografía Abdominal' },
      { kind: 'matched', canonical: 'Ecografía Ginecológica Transvaginal' },
      { kind: 'matched', canonical: 'Ecografía Mamaria' },
    ]);
  });
  it('también separa por coma', () => {
    const chunks = resolveMultipleStudyTexts('Ecografía Abdominal, transvaginal');
    expect(chunks.map((c) => c.resolution.kind === 'matched' ? c.resolution.canonical : c.resolution)).toEqual([
      'Ecografía Abdominal', 'Ecografía Ginecológica Transvaginal',
    ]);
  });
  it('un estudio realmente no catalogado (ninguna coincidencia) queda como texto libre', () => {
    const chunks = resolveMultipleStudyTexts('Rarísima Cosa Nunca Vista');
    expect(chunks).toEqual([{ text: 'Rarísima Cosa Nunca Vista', resolution: { kind: 'freeform', text: 'Rarísima Cosa Nunca Vista' } }]);
  });
  it('coincidencia parcial sin ambigüedad (una sola posible) se reconoce igual, sin tener que escribir el nombre completo', () => {
    expect(resolveStudyTypeText('codo')).toEqual({ kind: 'matched', canonical: 'Ecografía de Codo' });
  });
  it('coincidencia parcial ambigua (coincide con más de un estudio) se deja como texto libre, no se adivina', () => {
    expect(resolveStudyTypeText('abdominal')).toEqual({ kind: 'freeform', text: 'abdominal' });
  });
});

describe('sugerencias de autocompletado (suggestStudyTypes)', () => {
  it('sugiere el estudio oficial a partir de un apodo/abreviatura', () => {
    expect(suggestStudyTypes('transvaginal')).toContain('Ecografía Ginecológica Transvaginal');
    expect(suggestStudyTypes('mmii tvp')).toContain('Doppler Venoso de Miembros Inferiores (TVP)');
  });
  it('sugiere por coincidencia parcial del nombre oficial', () => {
    expect(suggestStudyTypes('mamaria')).toContain('Ecografía Mamaria');
  });
  it('no sugiere nada para texto vacío', () => {
    expect(suggestStudyTypes('')).toEqual([]);
  });
});
