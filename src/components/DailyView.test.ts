import { describe, expect, it } from 'vitest';
import { getAgendaSummary } from './DailyView';
import type { Appointment } from '@/types/medical';

const appointment = (id: string, time: string, overrides: Partial<Appointment> = {}): Appointment => ({
  id, time, date: '2026-06-09', patientId: id,
  patient: { id, name: id, dni: '', phone: '', age: 30 },
  studyType: 'Ecografía', status: 'pending', report: '', images: [], imageUrls: [],
  asistio: false, createdAt: '', ...overrides,
});

describe('resumen de la agenda cargada', () => {
  it('elige el primer pendiente por hora, sin que la llegada lo saque de "próximo" (solo reportado/en curso/cancelado lo hacen)', () => {
    const summary = getAgendaSummary([
      appointment('tarde', '10:00'), appointment('primero', '09:00'),
      appointment('llego', '08:00', { asistio: true }),
      appointment('demorado', '08:10', { arrivalState: 'late' }),
      appointment('ausente', '08:20', { arrivalState: 'missed' }),
      appointment('cancelado', '08:30', { status: 'cancelled' }),
      appointment('informado', '08:40', { status: 'reported' }),
      appointment('enviado', '08:50', { status: 'sent' }),
      appointment('no-show', '08:55', { status: 'no-show' }),
    ]);
    // "llego" ya marcó llegada pero sigue pending (no entró a estudio todavía),
    // así que sigue siendo el próximo turno.
    expect(summary.next?.id).toBe('llego');
    expect(summary.pending).toBe(5);
  });
  it('cuenta llegados, demorados y ausentes sin duplicar ni contar cancelados; "pending" y "next" no dependen de la llegada', () => {
    const summary = getAgendaSummary([
      appointment('llego', '08:00', { asistio: true }),
      appointment('demorado', '08:10', { arrivalState: 'late' }),
      appointment('ausente', '08:20', { arrivalState: 'missed', status: 'no-show' }),
      appointment('cancelado', '08:30', { status: 'cancelled', arrivalState: 'arrived' }),
    ]);
    expect([summary.arrived, summary.late, summary.missed, summary.pending]).toEqual([1, 1, 1, 2]);
    expect(summary.next?.id).toBe('llego');
  });
  it('un día vacío no tiene próximo turno ni contadores', () => {
    expect(getAgendaSummary([])).toEqual({ next: undefined, reinserted: [], arrived: 0, late: 0, missed: 0, pending: 0 });
  });
});

describe('turnos salteados y reinsertados (tarde / no vino y su reaparición)', () => {
  it('un turno salteado (wasBypassed) no compite por "próximo", aunque siga pending', () => {
    const summary = getAgendaSummary([
      appointment('salteado', '08:00', { arrivalState: 'late', wasBypassed: true }),
      appointment('siguiente', '08:10'),
    ]);
    expect(summary.next?.id).toBe('siguiente');
  });
  it('si el salteado reaparece ("llegó"), se lista en "reinserted" y no vuelve a ser "próximo" por horario', () => {
    const summary = getAgendaSummary([
      appointment('salteado', '08:00', { asistio: true, arrivalState: 'arrived', wasBypassed: true, rejoinedAt: '2026-06-09T12:00:00Z' }),
      appointment('siguiente', '08:10'),
    ]);
    expect(summary.next?.id).toBe('siguiente');
    expect(summary.reinserted.map((a) => a.id)).toEqual(['salteado']);
  });
  it('varios reinsertados se ordenan por cuándo reaparecieron, no por su horario original', () => {
    const summary = getAgendaSummary([
      appointment('tarde-10', '10:00', { arrivalState: 'arrived', wasBypassed: true, rejoinedAt: '2026-06-09T12:00:00Z' }),
      appointment('tarde-08', '08:00', { arrivalState: 'arrived', wasBypassed: true, rejoinedAt: '2026-06-09T13:00:00Z' }),
    ]);
    expect(summary.reinserted.map((a) => a.id)).toEqual(['tarde-10', 'tarde-08']);
  });
  it('salteado que todavía no reapareció (sigue "tarde"/"no vino") no entra a la lista de reinsertados', () => {
    const summary = getAgendaSummary([
      appointment('todavia-tarde', '08:00', { arrivalState: 'late', wasBypassed: true }),
    ]);
    expect(summary.reinserted).toEqual([]);
    expect(summary.next).toBeUndefined();
  });
});