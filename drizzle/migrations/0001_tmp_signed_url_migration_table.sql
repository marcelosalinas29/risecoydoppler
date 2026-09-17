CREATE TABLE public.tmp_signed_url_migration (
  id uuid PRIMARY KEY,
  urls jsonb NOT NULL
);

GRANT SELECT, INSERT ON public.tmp_signed_url_migration TO sandbox_exec;
GRANT ALL ON public.tmp_signed_url_migration TO service_role;

ALTER TABLE public.tmp_signed_url_migration ENABLE ROW LEVEL SECURITY;
