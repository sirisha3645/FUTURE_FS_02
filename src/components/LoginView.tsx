import React, { useState } from 'react';
import { API } from '../utils/api';
import { LogIn, Sparkles, UserPlus, ShieldAlert } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, admin: any) => void;
  onNavigateToRegister: () => void;
}

export default function LoginView({ onLoginSuccess, onNavigateToRegister }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.auth.login(email, password);
      onLoginSuccess(response.token, response.admin);
    } catch (err: any) {
      console.error('Login failure:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = () => {
    setEmail('admin@crm.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div id="login-layout-container" className="min-h-screen bg-slate-50 flex items-center justify-center p-4" style={{
      backgroundImage: `radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)`,
      backgroundColor: '#0a0d1a'
    }}>
      <div id="login-card" className="w-full max-w-md backdrop-blur-xl bg-slate-900/40 border border-violet-500/20 shadow-2xl rounded-3xl p-8 text-slate-100 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-sans font-bold tracking-tight bg-gradient-to-r from-violet-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            Mini CRM System
          </h2>
          <p className="text-sm text-indigo-200/70 mt-2 font-sans">
            Client Lead Management Enterprise Control
          </p>
        </div>

        {error && (
          <div id="login-error-alert" className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm mb-6 animate-shake">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-purple-200/60 mb-2">
              Admin Email
            </label>
            <input
              id="input-email"
              type="email"
              placeholder="admin@crm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-purple-200/60 mb-2">
              Password
            </label>
            <input
              id="input-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              required
            />
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 disabled:opacity-55 font-semibold text-white py-3 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all duration-200 text-sm cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In Access
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
            OR EVALUATE
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          id="btn-fill-demo"
          type="button"
          onClick={fillDemoCreds}
          className="w-full bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 font-medium text-xs px-4 py-3.5 rounded-xl border border-violet-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          ⚡ Auto-fill Demo Credentials (admin123)
        </button>

        <p className="text-center text-xs text-slate-400 mt-8">
          Not yet registered?{' '}
          <button
            id="btn-nav-register"
            onClick={onNavigateToRegister}
            className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 cursor-pointer"
          >
            Create admin account
          </button>
        </p>
      </div>
    </div>
  );
}
