CREATE OR REPLACE FUNCTION public.find_patient_ids_by_dni(_dni text)
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.patients p
  WHERE regexp_replace(coalesce(_dni, ''), '\D', '', 'g') <> ''
    AND regexp_replace(coalesce(p.dni, ''), '\D', '', 'g')
        = regexp_replace(coalesce(_dni, ''), '\D', '', 'g')
$$;

GRANT EXECUTE ON FUNCTION public.find_patient_ids_by_dni(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_patient_ids_by_dni(text) TO service_role;