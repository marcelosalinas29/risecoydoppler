import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  rows: [] as any[], upload: vi.fn(), remove: vi.fn(), insert: vi.fn(),
  parsed: vi.fn(), match: vi.fn(), hash: vi.fn(), searchRemote: vi.fn(),
  patients: [{ id: 'manual', name: 'PACIENTE ELEGIDA', dni: '36013537' }],
}));
vi.mock('@/components/AppLayout', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'doctor' }, isViewer: false }) }));
vi.mock('@/store/useClinicStore', () => ({ useClinicStore: () => ({
  patients: mocks.patients, fetchPatients: vi.fn(),
  searchPatientsRemote: mocks.searchRemote,
  searchPatients: (query: string) => mocks.patients.filter((p) => p.name.includes(query.toUpperCase()) || p.dni.includes(query)),
}) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  from: () => ({
    select: () => ({ in: () => ({ data: [], error: null, limit: async () => ({ data: [], error: null }) }) }),
    insert: mocks.insert,
  }),
} }));
vi.mock('@/lib/import/studyParser', () => ({
  docxToText: vi.fn(), parseReportText: vi.fn(), parseFileName: mocks.parsed,
  looksLikeAppBackup: () => false, matchPatients: mocks.match, sha256Hex: mocks.hash,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import ImportStudiesPage from './ImportStudiesPage';

describe('asignación manual en importador', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.rows = [];
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.upload.mockResolvedValue({ error: null }); mocks.remove.mockResolvedValue({ error: null });
    mocks.insert.mockImplementation(async (row) => { mocks.rows.push(row); return { error: null }; });
    mocks.hash.mockResolvedValue('a'.repeat(64));
    mocks.parsed.mockReturnValue({ paciente: 'NOMBRE DETECTADO', dni: '', fecha: '', estudio: '' });
    mocks.match.mockReturnValue({ kind: 'ninguno', candidates: [] });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it.each(['pendiente', 'revisar', 'error', 'listo'])('asigna a mano un archivo %s y lo importa incluido, sin sobrescribir', async (status) => {
    if (status === 'revisar') mocks.match.mockReturnValue({ kind: 'posible', candidates: [{ id: 'otro', name: 'PROPUESTA DISTINTA', dni: '99999999' }] });
    if (status === 'listo') mocks.match.mockReturnValue({ kind: 'exacto', candidates: [{ id: 'otro', name: 'PROPUESTA DISTINTA', dni: '99999999' }] });
    if (status === 'error') {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.hash.mockRejectedValueOnce(new Error('archivo no reconocido'));
    }
    const { container } = render(<ImportStudiesPage />);
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error('No se encontró selector de archivos');
    const file = new File(['contenido original'], 'informe.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    const search = await screen.findByLabelText('Buscar paciente para asignar');
    fireEvent.change(search, { target: { value: '36013537' } });
    fireEvent.click(await screen.findByRole('button', { name: /PACIENTE ELEGIDA/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Importar 1 seleccionado(s)' }));
    await waitFor(() => expect(mocks.rows).toHaveLength(1));
    expect(mocks.rows[0]).toMatchObject({ patient_id: 'manual', estado: 'asignado', archivo_hash: 'a'.repeat(64), archivo_nombre: 'informe.pdf' });
    expect(mocks.upload).toHaveBeenCalledWith(expect.stringContaining('manual/'), file, { upsert: false, contentType: 'application/pdf' });
  });
  it('un insert duplicado limpia solo el archivo nuevo', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });
    const { container } = render(<ImportStudiesPage />);
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error('No se encontró selector de archivos');
    fireEvent.change(input, { target: { files: [new File(['pdf'], 'informe.pdf')] } });
    fireEvent.change(await screen.findByLabelText('Buscar paciente para asignar'), { target: { value: 'ELEGIDA' } });
    fireEvent.click(await screen.findByRole('button', { name: /PACIENTE ELEGIDA/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Importar 1 seleccionado(s)' }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledOnce());
    expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
    expect(mocks.rows).toHaveLength(0);
  });
});