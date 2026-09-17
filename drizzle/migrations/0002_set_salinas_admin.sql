-- Temporarily bypass the is_admin protection trigger for this one-off change
ALTER TABLE public.profiles DISABLE TRIGGER protect_is_admin_trigger;

UPDATE public.profiles
SET is_admin = true
WHERE email = 'marcelosalinas29@gmail.com';

-- Re-enable the protection immediately
ALTER TABLE public.profiles ENABLE TRIGGER protect_is_admin_trigger;