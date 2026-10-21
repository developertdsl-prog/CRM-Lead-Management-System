'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch {
      // error handled in auth context toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrefillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('AdminStrongPassword!123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <Layers className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sign in to your organization or{' '}
          <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            create a new organization
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">
                Corporate Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@crmenterprise.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to CRM
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Prefill */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Quick Demo Logins (Seed Accounts)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePrefillDemo('admin@crmenterprise.com')}
                className="p-2 rounded bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-left transition-colors"
              >
                <div className="font-semibold text-indigo-300">Admin (Owner)</div>
                <div className="text-[10px] text-slate-500 truncate">admin@crmenterprise.com</div>
              </button>
              <button
                type="button"
                onClick={() => handlePrefillDemo('alex.sales@acme.com')}
                className="p-2 rounded bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-left transition-colors"
              >
                <div className="font-semibold text-blue-300">Sales Rep</div>
                <div className="text-[10px] text-slate-500 truncate">alex.sales@acme.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
