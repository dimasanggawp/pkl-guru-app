import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-border">
      <div>
        <p className="kicker text-white/70">Aplikasi Guru</p>
        <h1 className="text-lg font-display font-bold tracking-tight">PKL Monitoring</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {isAuthenticated && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline font-medium">{user?.nisn_niy}</span>
            <button
              onClick={logout}
              className="rounded-md border border-white/30 px-3 py-1.5 font-semibold transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
