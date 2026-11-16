import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import NexoMark from '@/components/NexoMark';
import ThemeToggle from '@/components/ThemeToggle';

const LoginPage = () => {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('Credenciales incorrectas');
    }
    setSubmitting(false);
  };

  return (
    <div className="login-screen min-h-screen bg-background lg:grid lg:grid-cols-[55%_45%]">
      <section className="login-brand relative flex flex-col items-center justify-center overflow-hidden px-6 py-7 lg:sticky lg:top-0 lg:h-screen lg:px-10 lg:py-12" aria-label="DMR by Nexo Imagen">
        <div className="relative flex items-center gap-5 lg:flex-col lg:gap-6">
          <NexoMark variant="silver" fullLogo className="login-brand-mark h-32 w-32 shrink-0 rounded-3xl lg:h-[352px] lg:w-[352px]" />
          <div className="text-left lg:text-center">
            <h1 className="login-brand-title text-3xl font-bold lg:text-6xl">DMR</h1>
            <p className="login-brand-subtitle mt-2 text-sm lg:text-xl">by Nexo Imagen</p>
          </div>
        </div>
        <p className="login-brand-tagline relative mt-5 text-center text-xs lg:mt-12 lg:text-sm">Diagnóstico por imágenes de precisión</p>
      </section>
      <section className="relative flex min-w-0 flex-col items-center justify-center px-5 py-10 lg:min-h-screen lg:px-8 lg:py-16">
        <div className="absolute right-4 top-3 lg:right-6 lg:top-5">
          <ThemeToggle className="text-foreground hover:bg-secondary hover:text-foreground" />
        </div>
        <div className="w-full max-w-[420px]">
          <div className="mb-5 hidden justify-center lg:flex">
            <NexoMark variant="color" className="h-10 w-11 dark:hidden" />
            <NexoMark variant="silver" className="hidden h-10 w-11 dark:block" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Iniciar sesión</h2>
              <p className="mt-1 text-xs text-muted-foreground">Ecografía y Doppler</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Correo electrónico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
          </div>

          {/* Copyright notice */}
          <p className="mt-4 text-[10px] text-muted-foreground text-center leading-relaxed px-2">
            © 2026 Diagnóstico Médico Reconquista — Todos los derechos reservados.<br />
            Software propietario. Prohibida su reproducción, distribución o uso sin autorización escrita.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
