import { LayoutDashboard, Users, BarChart3, Settings, LogOut, Sparkles, ShieldCheck, Folder } from 'lucide-react';
import { Admin } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  admin: Admin | null;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, admin, onLogout }: SidebarProps) {
  const isSuperAdmin = admin?.email === 'sirsha3645@gmail.com' || admin?.email === 'admin@crm.com' || admin?.id === 'SUPER_ADMIN_USER_ID';

  const menuItems = [
    { 
      id: 'dashboard', 
      name: isSuperAdmin ? 'Super Admin Hub' : 'Dashboard', 
      icon: isSuperAdmin ? ShieldCheck : LayoutDashboard 
    },
    { id: 'leads', name: 'Leads Directory', icon: Users },
    { id: 'analytics', name: 'Performance Analytics', icon: BarChart3 },
    { id: 'files', name: 'My Files', icon: Folder },
  ];

  return (
    <aside id="app-sidebar" className="w-68 bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300">
      <div>
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-base text-slate-100 tracking-tight leading-none">
              ClientSphere
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400">
              Mini CRM Dev
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-2">
            Main Hub
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`sidebar-item-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-300 font-semibold border-l-4 border-violet-500 pl-2.5'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Panel Footing */}
      <div className="p-4 border-t border-slate-800 font-sans">
        <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl mb-3">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] text-violet-400/80 font-bold tracking-wider uppercase">
              Active Admin
            </span>
            {isSuperAdmin && (
              <span className="text-[9px] font-bold tracking-tight bg-red-500/15 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded uppercase">
                Admin View
              </span>
            )}
          </div>
          <span className="block font-semibold text-slate-100 text-sm truncate mt-0.5" title={admin?.name}>
            {admin?.name || 'Administrator'}
          </span>
          <span className="block text-xs text-slate-500 truncate" title={admin?.email}>
            {admin?.email || 'admin@crm.com'}
          </span>
        </div>

        <button
          id="btn-sidebar-signout"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          End Session
        </button>
      </div>
    </aside>
  );
}
