import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  rows: [] as any[],
  upload: vi.fn(), remove: vi.fn(), insert: vi.fn(),
  auth: { user: { id: 'doctor' }, isDoctor: true, isAdmin: false },
  uuid: 0,
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  from: () => ({
    select: () => ({ in: (_column: string, ids: string[]) => ({ order: async () => ({ data: mocks.rows.filter((row) => ids.includes(row.patient_id)), error: null }) }) }),
    insert: mocks.insert,
    delete: () => ({ eq: (_column: string, id: string) => ({ select: async () => {
      mocks.rows = mocks.rows.filter((row) => row.id !== id);
      return { data: [{ id }], error: null };
    } }) }),
    update: (patch: any) => ({ eq: (_column: string, id: string) => ({ select: async () => {
      const row = mocks.rows.find((row) => row.id === id);
      if (row) Object.assign(row, patch);
      return { data: row ? [{ id }] : [], error: null };
    } }) }),
  }),
} }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/store/useClinicStore', () => ({ useClinicStore: () => ({
  searchPatients: () => [{ id: 'otro', name: 'OTRA PACIENTE', dni: '12345678' }], searchPatientsRemote: vi.fn(),
}) }));
vi.mock('@/components/PdfViewer', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import PreviousStudiesSection from './PreviousStudiesSection';

const renderSection = (canEdit = true, onChanged = vi.fn()) => {
  render(<PreviousStudiesSection patientIds={['actual']} primaryPatientId="actual" canEdit={canEdit} initiallyAdding onChanged={onChanged} />);
  return onChanged;
};
const selectFiles = (files: File[]) => fireEvent.change(screen.getByLabelText('Archivos del estudio previo'), { target: { files } });

describe('carga manual de estudios previos', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.rows = []; mocks.uuid = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => `00000000-0000-4000-8000-${String(++mocks.uuid).padStart(12, '0')}`);
    mocks.upload.mockResolvedValue({ error: null }); mocks.remove.mockResolvedValue({ error: null });
    mocks.insert.mockImplementation(async (row) => { mocks.rows.push({ id: `estudio-${mocks.rows.length}`, ...row }); return { error: null }; });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('guarda todos los formatos originales en el paciente elegido, sin interpretar nombre, DNI o contenido', async () => {
    const changed = renderSection();
    const files = [
      new File(['DNI 99999999 OTRA PERSONA'], 'OTRA_PERSONA_99999999.pdf', { type: 'application/pdf' }),
      new File(['word'], 'informe.doc', { type: 'application/msword' }),
      new File(['docx'], 'informe.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      new File(['foto intacta'], 'foto.png', { type: 'image/png' }),
    ];
    selectFiles(files); fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.rows).toHaveLength(4));
    files.forEach((file, index) => {
      expect(mocks.upload.mock.calls[index][1]).toBe(file);
      expect(mocks.rows[index]).toMatchObject({ patient_id: 'actual', fecha: null, tipo: 'Estudio previo', estado: 'asignado', archivo_nombre: file.name });
    });
    expect(new Set(mocks.rows.map((row) => row.archivo_path)).size).toBe(4);
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
  });
  it('solo requiere elegir archivo y usa el tipo por defecto si queda vacío', async () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(mocks.upload).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText('Tipo de estudio (ej. Ecografía abdominal)'), { target: { value: '' } });
    selectFiles([new File(['pdf'], 'estudio.pdf')]);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.rows[0]).toMatchObject({ tipo: 'Estudio previo', fecha: null }));
  });
  it('conserva fecha y tipo elegidos manualmente', async () => {
    renderSection();
    fireEvent.change(screen.getByLabelText('Fecha del estudio (opcional)'), { target: { value: '2026-03-11' } });
    fireEvent.change(screen.getByPlaceholderText('Tipo de estudio (ej. Ecografía abdominal)'), { target: { value: 'Mamaria' } });
    selectFiles([new File(['pdf'], 'estudio.pdf')]);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.rows[0]).toMatchObject({ tipo: 'Mamaria', fecha: '2026-03-11' }));
  });
  it('reintenta solo los archivos fallidos y no duplica los guardados', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const changed = renderSection();
    const good = new File(['ok'], 'bueno.pdf'), failed = new File(['error'], 'fallo.pdf');
    mocks.upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { statusCode: '504', message: 'timeout' } }).mockResolvedValue({ error: null });
    selectFiles([good, failed]); fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    expect(mocks.rows).toHaveLength(2);
    expect(mocks.upload.mock.calls.map((call) => call[1])).toEqual([good, failed, failed]);
  });
  it('avisa al eliminar y reasignar con éxito', async () => {
    mocks.rows = [{ id: 'previo', patient_id: 'actual', archivo_nombre: 'previo.pdf', archivo_path: 'actual/previo.pdf', fecha: null, tipo: 'Estudio previo' }];
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const changed = renderSection();
    fireEvent.click(await screen.findByText('Reasignar a otro paciente'));
    fireEvent.change(screen.getByPlaceholderText('DNI o apellido y nombre del paciente correcto'), { target: { value: 'OTRA' } });
    fireEvent.click(screen.getByRole('button', { name: /OTRA PACIENTE/ }));
    await waitFor(() => expect(changed).toHaveBeenCalledOnce());
    expect(mocks.rows[0]).toMatchObject({ patient_id: 'otro', estado: 'asignado' });
    cleanup(); mocks.rows[0].patient_id = 'actual';
    renderSection(true, changed);
    fireEvent.click(await screen.findByText('Eliminar'));
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    expect(mocks.rows).toHaveLength(0);
  });
  it('no permite subir sin permiso aunque initiallyAdding esté activo', async () => {
    renderSection(false);
    await screen.findByText('Ninguno cargado.');
    expect(screen.queryByLabelText('Archivos del estudio previo')).toBeNull();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});