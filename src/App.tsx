import { useState, useEffect } from 'react';
import { API } from './utils/api';
import { Admin } from './types';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import DashboardView from './components/DashboardView';
import LeadsView from './components/LeadsView';
import LeadDetailsView from './components/LeadDetailsView';
import AnalyticsView from './components/AnalyticsView';
import AdminDashboardView from './components/AdminDashboardView';
import MyFilesView from './components/MyFilesView';
import { Loader } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './utils/firebase';

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('crm_token'));
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);
  
  // Navigation states
  const [isRegisterActive, setIsRegisterActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Auto-open modal indicator
  const [autoOpenCreateLead, setAutoOpenCreateLead] = useState<boolean>(false);

  // Trigger states to force components refresh
  const [shouldRefreshLeads, setShouldRefreshLeads] = useState<boolean>(false);
  const [newLeadsCount, setNewLeadsCount] = useState<number>(0);

  // Dark Mode configuration (Bonus!)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('crm_theme') === 'dark';
  });

  // Verify and load active profile if authenticated in Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const newToken = await user.getIdToken();
          localStorage.setItem('crm_token', newToken);
          setToken(newToken);
          
          const profileRes = await API.auth.getProfile();
          setAdmin(profileRes.admin);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          handleLogout();
        } finally {
          setInitializing(false);
        }
      } else {
        setAdmin(null);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('crm_token');
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Apply dark mode theme body classes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('crm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('crm_theme', 'light');
    }
  }, [darkMode]);

  // Load count of "New" status leads periodically for the notification dot
  useEffect(() => {
    if (isAuthenticated) {
      async function fetchNewLeadsCount() {
        try {
          const res = await API.leads.list({ status: 'New', limit: 1 });
          setNewLeadsCount(res.pagination.totalLeads);
        } catch (e) {
          // silent ignore
        }
      }
      fetchNewLeadsCount();
      const timer = setInterval(fetchNewLeadsCount, 15000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, shouldRefreshLeads]);

  // Login callback
  const handleLoginSuccess = (newToken: string, newAdmin: Admin) => {
    localStorage.setItem('crm_token', newToken);
    setToken(newToken);
    setAdmin(newAdmin);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  // Sign out callback
  const handleLogout = () => {
    API.auth.logout();
    localStorage.removeItem('crm_token');
    setToken(null);
    setAdmin(null);
    setIsAuthenticated(false);
    setSelectedLeadId(null);
    setActiveTab('dashboard');
  };

  // Redirect client to specific selected lead card details
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setActiveTab('lead-detail');
  };

  // Quick Action: Add Lead switches tab and triggers modal
  const handleTriggerQuickAddLead = () => {
    setAutoOpenCreateLead(true);
    setActiveTab('leads');
  };

  if (initializing) {
    return (
      <div id="loading" className="min-h-screen bg-slate-900 border-slate-800 flex flex-col items-center justify-center p-6 text-slate-100">
        <Loader className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-sans tracking-tight text-slate-400">Bootstrapping ClientSphere CRM...</p>
      </div>
    );
  }

  // Auth gate
  if (!isAuthenticated) {
    return isRegisterActive ? (
      <RegisterView
        onRegisterSuccess={handleLoginSuccess}
        onNavigateToLogin={() => setIsRegisterActive(false)}
      />
    ) : (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setIsRegisterActive(true)}
      />
    );
  }

  return (
    <div id="workspace-container" className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-150 transition-colors duration-250">
      
      {/* 1. Sidebar Nav */}
      <Sidebar
        activeTab={activeTab === 'lead-detail' ? 'leads' : activeTab}
        setActiveTab={(tab) => {
          setSelectedLeadId(null);
          setActiveTab(tab);
        }}
        admin={admin}
        onLogout={handleLogout}
      />

      {/* 2. Primary Layout Workspace */}
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        
        {/* Top Header bar */}
        <TopNavbar
          admin={admin}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          newLeadsCount={newLeadsCount}
        />

        {/* Content Area Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              admin && (admin.email === 'sirsha3645@gmail.com' || admin.email === 'admin@crm.com' || admin.id === 'SUPER_ADMIN_USER_ID') ? (
                <AdminDashboardView currentAdmin={admin} />
              ) : (
                <DashboardView
                  onNavigateToLeads={() => {
                    setSelectedLeadId(null);
                    setActiveTab('leads');
                  }}
                  onSelectLead={handleSelectLead}
                  triggerAddLeadOpen={handleTriggerQuickAddLead}
                />
              )
            )}

            {activeTab === 'leads' && (
              <LeadsView
                onSelectLead={handleSelectLead}
                shouldRefreshTrigger={shouldRefreshLeads}
                onRefreshTriggered={() => setShouldRefreshLeads(false)}
                autoOpenCreate={autoOpenCreateLead}
                onAutoOpenConsumed={() => setAutoOpenCreateLead(false)}
              />
            )}

            {activeTab === 'lead-detail' && selectedLeadId && (
              <LeadDetailsView
                leadId={selectedLeadId}
                onBackToList={() => {
                  setSelectedLeadId(null);
                  setActiveTab('leads');
                  setShouldRefreshLeads(true);
                }}
                onLeadUpdated={() => {
                  setShouldRefreshLeads(true);
                }}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsView />}

            {activeTab === 'files' && admin && (
              <MyFilesView admin={admin} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
