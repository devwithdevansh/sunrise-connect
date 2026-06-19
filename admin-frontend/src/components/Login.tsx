import React, { useState } from 'react';
import { useApp } from '../store';
import { Sun, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('secret123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (!success) {
      setError('Invalid email or password. Try admin@school.com / secret123');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-indigo-500"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#F59E0B] p-3 rounded-2xl text-white shadow-lg shadow-amber-500/20 mb-3">
            <Sun className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Sunrise Connect</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">School Fee Portal Login</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-lg font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@school.com"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#F59E0B] hover:bg-amber-600 text-slate-900 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
            >
              Sign In to Portal
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Demo accounts:</p>
          <p className="mt-1">Admin: <span className="text-slate-400">admin@school.com</span> | Staff: <span className="text-slate-400">staff@school.com</span></p>
          <p className="mt-0.5">Password: <span className="text-slate-400">secret123</span></p>
        </div>
      </div>
    </div>
  );
};
