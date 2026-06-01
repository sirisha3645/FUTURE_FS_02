import React, { useState } from 'react';
import { API } from '../utils/api';
import { UserPlus, ArrowLeft, ShieldAlert } from 'lucide-react';

interface RegisterViewProps {
  onRegisterSuccess: (token: string, admin: any) => void;
  onNavigateToLogin: () => void;
}

export default function RegisterView({ onRegisterSuccess, onNavigateToLogin }: RegisterViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all input fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await API.auth.register(name, email, password);
      onRegisterSuccess(response.token, response.admin);
    } catch (err: any) {
      console.error('Registration failure:', err);
      setError(err.message || 'Email is already taken or invalid register inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-layout-container" className="min-h-screen bg-slate-50 flex items-center justify-center p-4" style={{
      backgroundImage: `radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)`,
      backgroundColor: '#0a0d1a'
    }}>
      <div id="register-card" className="w-full max-w-md backdrop-blur-xl bg-slate-900/40 border border-violet-500/20 shadow-2xl rounded-3xl p-8 text-slate-100 transition-all duration-300">
        <div className="mb-6">
          <button
            id="btn-back-to-login"
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300/70 hover:text-indigo-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-sans font-bold tracking-tight bg-gradient-to-r from-violet-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            Admin Registration
          </h2>
          <p className="text-sm text-indigo-200/70 mt-2 font-sans">
            Provision secure CRM administration key
          </p>
        </div>

        {error && (
          <div id="register-error-alert" className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm mb-6">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-purple-200/60 mb-2">
              Full Name
            </label>
            <input
              id="register-input-name"
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-purple-200/60 mb-2">
              Admin Email Address
            </label>
            <input
              id="register-input-email"
              type="email"
              placeholder="doe@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-purple-200/60 mb-2">
              Password Set
            </label>
            <input
              id="register-input-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              required
            />
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 disabled:opacity-55 font-semibold text-white py-3 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all duration-200 text-sm cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Initialize Account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-8">
          Already have an account?{' '}
          <button
            id="register-nav-login"
            onClick={onNavigateToLogin}
            className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 cursor-pointer"
          >
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
}
