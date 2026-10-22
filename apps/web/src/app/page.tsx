import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Target,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Zap,
  ArrowRight,
  Database,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  Kanban,
  BarChart3,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">
                ApexCRM
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-indigo-950/80 border border-indigo-800/70 text-indigo-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Next-Gen Enterprise Multi-Tenant CRM Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Close Deals Faster with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-300">
              Intelligent Lead Workflows
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Eliminate duplicate records, automate pipeline transitions, and convert qualified leads into revenue-generating accounts with sub-millisecond precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        {/* Value Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-20">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-3xl font-extrabold text-white font-mono mb-1">100%</div>
            <div className="text-xs text-slate-400 font-medium">Tenant Data Isolation</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-3xl font-extrabold text-indigo-400 font-mono mb-1">&lt;10ms</div>
            <div className="text-xs text-slate-400 font-medium">Real-time Duplicate Detection</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono mb-1">ACID</div>
            <div className="text-xs text-slate-400 font-medium">Atomic Deal Conversion</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-3xl font-extrabold text-purple-400 font-mono mb-1">10k+</div>
            <div className="text-xs text-slate-400 font-medium">Bulk CSV Records / Batch</div>
          </div>
        </div>

        {/* Core Product Capabilities Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              Engineered for High-Velocity Sales Teams
            </h2>
            <p className="text-sm text-slate-400">
              Complete lead capture, automated duplicate prevention, and real-time revenue pipeline forecasting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Automated Lead Lifecycle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless progression through New, Contacted, and Qualified stages with automated status transition tracking, user notes, and historical audit logs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Smart Deduplication Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time pre-flight duplicate checks matching phone numbers and email domains with confidence scoring, preventing database clutter before submission.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Atomic Deal Conversion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single-transaction ACID conversion automatically creating or associating Companies, primary Contacts, and Sales Deals without orphan records.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Bulk CSV Import & Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart RFC 4180 CSV parser with automatic column aliases, custom duplicate strategies (Skip, Update, or Append), and fast one-click exports.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Enterprise Multi-Tenancy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict row-level tenancy enforcement across all 24 relational models, short-lived rotating JWT authentication, and role-based access control (RBAC).
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real-Time Funnel Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                SQL-aggregated conversion rates, active pipeline valuation, and stage velocity metrics ready out-of-the-box on your centralized dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-10 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Ready to Accelerate Your Sales Operations?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6">
            Sign up your organization in 30 seconds and start capturing, qualifying, and converting leads with confidence.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              Get Started Now
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} ApexCRM Enterprise. All rights reserved.</p>
      </footer>
    </div>
  );
}
