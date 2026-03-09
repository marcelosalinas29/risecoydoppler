import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserCircle, Save } from 'lucide-react';

const ProfilePage = () => {
  const { profile, role, isDoctor, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [specialty, setSpecialty] = useState(profile?.specialty ?? '');
  const [licenseNumbers, setLicenseNumbers] = useState(profile?.license_numbers ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        specialty: specialty || null,
        license_numbers: licenseNumbers || null,
      })
      .eq('user_id', profile.user_id);

    if (error) {
      toast.error('Error al guardar el perfil');
    } else {
      await refreshProfile();
      toast.success('Perfil actualizado');
    }
    setSaving(false);
  };

  return (
    <AppLayout title="Mi Perfil">
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <UserCircle className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {role === 'doctor' ? 'Médico / Doctor' : 'Secretaria'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            {isDoctor && (
              <>
                <div className="space-y-1">
                  <Label>Especialidad</Label>
                  <Input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="ej: Médico especialista en Diagnóstico por Imágenes"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Matrícula(s)</Label>
                  <Textarea
                    value={licenseNumbers}
                    onChange={(e) => setLicenseNumbers(e.target.value)}
                    placeholder="ej: MN 134217  MP 7298  Fº54  Lº4to"
                    className="text-sm"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparecerá en el sello del PDF
                  </p>
                </div>
              </>
            )}

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
