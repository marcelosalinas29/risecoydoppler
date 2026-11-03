CREATE TABLE IF NOT EXISTS public.report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  report text NOT NULL,
  saved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_versions_appointment_idx ON public.report_versions (appointment_id, created_at DESC);
GRANT SELECT ON public.report_versions TO authenticated;
GRANT ALL ON public.report_versions TO service_role;
ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctor/secretary can view report versions"
  ON public.report_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'secretary'));

CREATE OR REPLACE FUNCTION public.snapshot_report_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.report IS NOT NULL
     AND btrim(regexp_replace(OLD.report, '<[^>]*>', '', 'g')) <> ''
     AND NEW.report IS DISTINCT FROM OLD.report THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.report_versions
      WHERE appointment_id = OLD.id AND created_at > now() - interval '2 minutes'
    ) THEN
      INSERT INTO public.report_versions (appointment_id, report, saved_by)
      VALUES (OLD.id, OLD.report, auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS appointments_snapshot_report ON public.appointments;
CREATE TRIGGER appointments_snapshot_report
  BEFORE UPDATE OF report ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_report_version();

CREATE INDEX IF NOT EXISTS appointments_date_idx ON public.appointments (date);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS appointments_created_at_idx ON public.appointments (created_at DESC);
CREATE INDEX IF NOT EXISTS patients_dni_idx ON public.patients (dni);

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS apellido text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS nombres text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS dni_tipo text NOT NULL DEFAULT 'DNI';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS dni_materno boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.estudios_previos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  tipo text NOT NULL,
  origen text NOT NULL DEFAULT 'propio' CHECK (origen IN ('propio','externo')),
  archivo_path text NOT NULL,
  archivo_nombre text NOT NULL,
  mime text,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS estudios_previos_patient_idx ON public.estudios_previos (patient_id, fecha DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estudios_previos TO authenticated;
GRANT ALL ON public.estudios_previos TO service_role;
ALTER TABLE public.estudios_previos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctor/secretary can view estudios_previos" ON public.estudios_previos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'secretary'));
CREATE POLICY "Doctor/secretary can insert estudios_previos" ON public.estudios_previos FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'secretary')) AND created_by = auth.uid());

CREATE POLICY "Doctor/secretary can read estudios_previos files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'estudios_previos' AND (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'secretary')));
CREATE POLICY "Doctor/secretary can upload estudios_previos files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'estudios_previos' AND (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'secretary')));

ALTER TABLE public.estudios_previos ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE public.estudios_previos ALTER COLUMN fecha DROP NOT NULL;
ALTER TABLE public.estudios_previos ADD COLUMN IF NOT EXISTS nombre_detectado text;
ALTER TABLE public.estudios_previos ADD COLUMN IF NOT EXISTS dni_detectado text;
ALTER TABLE public.estudios_previos ADD COLUMN IF NOT EXISTS archivo_hash text;
ALTER TABLE public.estudios_previos ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'asignado';
ALTER TABLE public.estudios_previos ADD CONSTRAINT estudios_previos_estado_check CHECK (estado IN ('asignado','pendiente'));
CREATE UNIQUE INDEX IF NOT EXISTS estudios_previos_archivo_hash_uq ON public.estudios_previos(archivo_hash) WHERE archivo_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS estudios_previos_estado_idx ON public.estudios_previos(estado);
CREATE POLICY "Doctor/secretary can update estudios_previos" ON public.estudios_previos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'secretary'))
  WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'secretary'));
CREATE POLICY "Doctor admin can delete estudios_previos" ON public.estudios_previos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));
CREATE POLICY "Doctor admin can delete estudios_previos files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'estudios_previos' AND (public.has_role(auth.uid(), 'doctor') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS appointments_doctor_date_idx ON public.appointments(doctor_id, date);

CREATE TABLE public.doctor_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  study_type text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX doctor_templates_user_id_idx ON public.doctor_templates(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_templates TO authenticated;
GRANT ALL ON public.doctor_templates TO service_role;
ALTER TABLE public.doctor_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors and admins can view own templates" ON public.doctor_templates FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor'::app_role) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));
CREATE POLICY "Doctors and admins can insert own templates" ON public.doctor_templates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor'::app_role) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));
CREATE POLICY "Doctors and admins can update own templates" ON public.doctor_templates FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor'::app_role) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)))
  WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor'::app_role) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));
CREATE POLICY "Doctors and admins can delete own templates" ON public.doctor_templates FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor'::app_role) OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));

CREATE TABLE public.doctor_settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  report_style jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_templates jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_settings TO authenticated;
GRANT ALL ON public.doctor_settings TO service_role;
ALTER TABLE public.doctor_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctor settings select own" ON public.doctor_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));
CREATE POLICY "Doctor settings insert own" ON public.doctor_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));
CREATE POLICY "Doctor settings update own" ON public.doctor_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)))
  WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));
CREATE POLICY "Doctor settings delete own" ON public.doctor_settings FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND (public.has_role(auth.uid(), 'doctor') OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)));

ALTER TABLE public.appointments ADD COLUMN arrival_state text NULL CHECK (arrival_state IN ('arrived','late','missed'));
UPDATE public.appointments SET arrival_state = 'arrived' WHERE asistio = true AND arrival_state IS NULL;