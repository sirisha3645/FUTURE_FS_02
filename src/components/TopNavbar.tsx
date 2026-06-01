import { Bell, Sun, Moon, Calendar, Search } from 'lucide-react';
import { Admin } from '../types';

interface TopNavbarProps {
  admin: Admin | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  newLeadsCount: number;
}

export default function TopNavbar({ admin, darkMode, setDarkMode, newLeadsCount }: TopNavbarProps) {
  // Format current date nicely
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const isSuperAdmin = admin?.email === 'sirsha3645@gmail.com' || admin?.email === 'admin@crm.com' || admin?.id === 'SUPER_ADMIN_USER_ID';

  return (
    <header id="app-top-navbar" className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shadow-sm transition-colors duration-200">
      {/* Back and greeting info */}
      <div className="flex items-center gap-2">
        <span className="text-xl">👋</span>
        <div>
          <h2 className="text-sm font-sans font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Welcome back, {admin?.name || 'Admin'}
            {isSuperAdmin && (
              <span className="text-[9px] font-extrabold uppercase bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                Admin View
              </span>
            )}
          </h2>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">
            Operational dashboard is up to date.
          </p>
        </div>
      </div>

      {/* Right Tools section */}
      <div className="flex items-center gap-4">
        {/* Date tracker */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-violet-500" />
          <span>{formatDate()}</span>
        </div>

        {/* Dark Mode toggle */}
        <button
          id="btn-toggle-dark-mode"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-slate-500 hover:text-violet-500 dark:text-slate-400 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          title={darkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications badge */}
        <div className="relative">
          <button
            id="btn-notifications"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-not-allowed"
          >
            <Bell className="w-4.5 h-4.5" />
          </button>
          {newLeadsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping"></span>
          )}
        </div>
      </div>
    </header>
  );
}
