import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, PlusCircle, LogOut, UserCircle } from 'lucide-react';
import clinicLogo from '@/assets/clinic-logo.png';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
}

const navItems = [
  { path: '/', icon: Calendar, label: 'Citas' },
  { path: '/patients', icon: Users, label: 'Pacientes' },
  { path: '/new', icon: PlusCircle, label: 'Nueva' },
];

const AppLayout = ({ children, title }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <img src={clinicLogo} alt="DMR" className="w-9 h-9 rounded-lg object-cover bg-white/10 p-0.5" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-primary-foreground/90 tracking-wide uppercase">Ecografía y Doppler</h1>
            <p className="text-xs text-primary-foreground/60 truncate">{title}</p>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 text-xs text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {role === 'secretary' ? 'Secretaria' : profile.full_name.split(' ')[0]}
                </span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="p-1.5 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
