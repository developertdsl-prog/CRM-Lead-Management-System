'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Target,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Upload,
  Plus,
  ShieldCheck,
  RefreshCw,
  GitBranch,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { LeadStatsDto } from '@crm/shared-types';

export default function DashboardPage() {
  const { user, organization, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<LeadStatsDto | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await apiRequest<LeadStatsDto>('/leads/stats');
      setStats(data);
    } catch (err) {
      // Fallback default stats for display if database is empty
      setStats({
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        unqualifiedLeads: 0,
        convertedLeads: 0,
        lostLeads: 0,
        conversionRate: 0,
        totalEstimatedValue: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Phase 2 Active Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-950/60 border border-indigo-800 text-indigo-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Phase 2 Active: Lead Lifecycle & Deduplication Engine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.firstName ?? 'User'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Organization: <span className="text-indigo-400 font-medium">{organization?.name}</span> • Active CRM Pipeline Workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/leads"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Target className="w-4 h-4" />
              Manage Leads Pipeline
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Leads */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Total Captured Leads</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              {stats?.totalLeads ?? 0}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{stats?.newLeads ?? 0} new leads in queue</span>
            </div>
          </div>

          {/* Card 2: Qualified Leads */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Qualified Leads</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              {stats?.qualifiedLeads ?? 0}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Ready for atomic deal conversion</span>
            </div>
          </div>

          {/* Card 3: Converted Deals */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Lead Conversion Rate</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              {stats?.conversionRate ?? 0}%
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>{stats?.convertedLeads ?? 0} converted to Deals</span>
            </div>
          </div>

          {/* Card 4: Estimated Pipeline Value */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Est. Pipeline Value</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              ${(stats?.totalEstimatedValue ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Active unclosed lead opportunities</span>
            </div>
          </div>
        </div>

        {/* Pipeline Stage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Lead Pipeline Funnel</h2>
                <p className="text-xs text-slate-400">Current status distribution across your tenant</p>
              </div>
              <Link
                href="/leads"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View Table <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { label: 'New Leads', count: stats?.newLeads ?? 0, color: 'bg-blue-500', bar: 'w-[40%]' },
                { label: 'Contacted', count: stats?.contactedLeads ?? 0, color: 'bg-indigo-500', bar: 'w-[30%]' },
                { label: 'Qualified', count: stats?.qualifiedLeads ?? 0, color: 'bg-emerald-500', bar: 'w-[20%]' },
                { label: 'Converted to Deal', count: stats?.convertedLeads ?? 0, color: 'bg-purple-500', bar: 'w-[15%]' },
                { label: 'Lost / Disqualified', count: stats?.lostLeads ?? 0, color: 'bg-rose-500', bar: 'w-[10%]' },
              ].map((stage) => {
                const total = stats?.totalLeads || 1;
                const pct = Math.round((stage.count / total) * 100);

                return (
                  <div key={stage.label}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-300">{stage.label}</span>
                      <span className="text-slate-400 font-mono">
                        {stage.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                        style={{ width: `${Math.max(pct, stage.count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Launch & Phase 2 Capabilities */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/60 border border-indigo-900/40">
            <h2 className="text-lg font-bold text-white mb-2">Phase 2 Engine Features</h2>
            <p className="text-xs text-slate-400 mb-6">
              Production modules deployed and accessible in this release:
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-white">Deduplication Engine</div>
                  <div className="text-slate-400 mt-0.5">
                    Real-time preflight check on email/phone similarity to prevent duplicate leads.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <Upload className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-white">CSV Bulk Import & Export</div>
                  <div className="text-slate-400 mt-0.5">
                    RFC 4180 parser with smart aliases, deduplication strategies, and fast export.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-white">Atomic Lead Conversion</div>
                  <div className="text-slate-400 mt-0.5">
                    Transfers Lead into Contact, Company, and Deal in a single ACID transaction.
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/leads"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Open Leads Manager <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
