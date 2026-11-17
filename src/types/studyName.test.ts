import { describe, it, expect } from 'vitest';
import { formatStudyType, resolveStudyTypeText, STUDY_TYPES } from './medical';

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
