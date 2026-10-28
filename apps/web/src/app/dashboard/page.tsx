'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Target,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Plus,
  RefreshCw,
  Layers,
  Sparkles,
  Download,
  Kanban,
  CheckSquare,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { AnalyticsOverviewDto } from '@crm/shared-types';

export default function DashboardPage() {
  const { user, organization, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<AnalyticsOverviewDto>('/analytics/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'DEALS' | 'LEADS' | 'ACTIVITIES') => {
    setExporting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/analytics/export?type=${type}`,
        {
          credentials: 'include',
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type.toLowerCase()}-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const summary = data?.summary || {
    totalRevenue: 0,
    weightedRevenue: 0,
    totalDeals: 0,
    wonDealsCount: 0,
    winRate: 0,
    activeLeadsCount: 0,
    leadsConversionRate: 0,
    completedActivitiesCount: 0,
    overdueActivitiesCount: 0,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Global Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-950/60 border border-indigo-800 text-indigo-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Executive Analytics & Automation Intelligence
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.firstName ?? 'Executive'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Organization: <span className="text-indigo-400 font-medium">{organization?.name}</span> • Real-Time SQL Metrics
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <button
              onClick={() => handleExport('DEALS')}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors shadow-sm"
              title="Download Deals CSV Report"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>{exporting ? 'Exporting...' : 'Export Deals CSV'}</span>
            </button>

            <Link
              href="/automations"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-800/60 text-indigo-200 transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Automations</span>
            </Link>

            <Link
              href="/deals"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Kanban className="w-4 h-4" />
              <span>Pipeline Kanban</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Revenue & Forecast */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Closed Won Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              ${summary.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Weighted Pipeline: ${summary.weightedRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Deal Win Rate */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Deal Win Rate</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              {summary.winRate}%
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{summary.wonDealsCount} won / {summary.totalDeals} total deals</span>
            </div>
          </div>

          {/* Card 3: Leads Funnel Conversion */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Lead Conversion Rate</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              {summary.leadsConversionRate}%
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>{summary.activeLeadsCount} active captured leads</span>
            </div>
          </div>

          {/* Card 4: Overdue & Task Productivity */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium tracking-wider uppercase">Activity Completion</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              {summary.completedActivitiesCount}
            </div>
            <div className="text-xs mt-2 flex items-center gap-1.5">
              {summary.overdueActivitiesCount > 0 ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {summary.overdueActivitiesCount} actions overdue!
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All outreach tasks on schedule
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Stage Breakdown & Lead Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deals Pipeline Stage Velocity */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Kanban className="w-4 h-4 text-indigo-400" />
                  Sales Pipeline Stage Velocity
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deal distribution across stages with weighted win probabilities
                </p>
              </div>
              <Link
                href="/deals"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Kanban Board <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {!data?.dealsByStage || data.dealsByStage.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active pipeline stages recorded yet.
                </div>
              ) : (
                data.dealsByStage.map((st) => {
                  const maxVal = Math.max(...data.dealsByStage.map((s) => s.value), 1);
                  const pct = Math.round((st.value / maxVal) * 100);

                  return (
                    <div key={st.stageId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: st.color }}
                          />
                          <span className="font-medium text-slate-200">{st.stageName}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            ({st.winProbability}% probability)
                          </span>
                        </div>
                        <div className="text-right font-mono text-slate-300">
                          ${st.value.toLocaleString()}{' '}
                          <span className="text-slate-500">({st.count} deals)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: st.color,
                            width: `${Math.max(pct, st.count > 0 ? 8 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lead Funnel Distribution */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Lead Funnel Status
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Stage distribution across all leads</p>
              </div>
              <Link
                href="/leads"
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                View Leads <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {!data?.leadsByStatus || data.leadsByStatus.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No leads found.</div>
              ) : (
                data.leadsByStatus.map((ls) => (
                  <div
                    key={ls.status}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                  >
                    <span className="font-medium text-slate-300">{ls.status}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-white font-bold">{ls.count}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ls.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Export Button */}
            <button
              onClick={() => handleExport('LEADS')}
              className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Leads CSV</span>
            </button>
          </div>
        </div>

        {/* Recent Activities & Audit Trail */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Recent Sales Activities & Engagement Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasks, calls, and meetings scheduled across all client accounts
              </p>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              All Activities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {!data?.recentActivityFeed || data.recentActivityFeed.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-slate-500">
                No recent activities recorded. Log calls or tasks from the activities menu.
              </div>
            ) : (
              data.recentActivityFeed.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                      {act.type}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        act.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white truncate">{act.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>{act.assignedToName || 'Unassigned'}</span>
                    <span className="font-mono">
                      {act.dueAt ? new Date(act.dueAt).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
