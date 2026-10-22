'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Users,
  Target,
  Kanban,
  CheckSquare,
  BarChart3,
  LogOut,
  Building2,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export function Navbar() {
  const pathname = usePathname();
  const { user, organization, role, logout } = useAuth();

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Leads', href: '/leads', icon: Target },
    { name: 'Companies', href: '/companies', icon: Building2, badge: 'Phase 3' },
    { name: 'Contacts', href: '#', icon: Users, disabled: true },
    { name: 'Pipelines & Deals', href: '#', icon: Kanban, disabled: true },
    { name: 'Activities', href: '#', icon: CheckSquare, disabled: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Links */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold tracking-tight text-white block">
                  ApexCRM
                </span>
                <span className="text-[10px] font-mono text-indigo-400">
                  {organization?.name || 'Enterprise'}
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.disabled) {
                  return (
                    <span
                      key={item.name}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
                      title="Available in upcoming phase"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: User Menu & Organization Badge */}
          <div className="flex items-center space-x-4">
            {organization && (
              <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-white">{organization.name}</span>
              </div>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <div className="font-medium text-white leading-tight">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      {role || 'SALES_REP'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
