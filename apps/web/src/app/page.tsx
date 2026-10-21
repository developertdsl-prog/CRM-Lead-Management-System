import Link from 'next/link';
import {
  ShieldCheck,
  Layers,
  Database,
  GitBranch,
  Terminal,
  Activity,
  Kanban,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function HomePage() {
  const phases = [
    { id: 'Phase 0', name: 'Architecture & Foundation', branch: 'phase-0-foundation', status: 'COMPLETE', active: true },
    { id: 'Phase 1', name: 'Multi-Tenant Auth & RBAC', branch: 'phase-1-auth-tenancy', status: 'READY TO START', active: false },
    { id: 'Phase 2', name: 'Lead Pipeline & Deduplication', branch: 'phase-2-lead-management', status: 'PLANNED', active: false },
    { id: 'Phase 3', name: 'Contacts, Companies & Custom Fields', branch: 'phase-3-contacts-companies', status: 'PLANNED', active: false },
    { id: 'Phase 4', name: 'Sales Pipelines & Kanban Deals', branch: 'phase-4-pipelines-deals', status: 'PLANNED', active: false },
    { id: 'Phase 5', name: 'Activities, Tasks & Productivity', branch: 'phase-5-activities-productivity', status: 'PLANNED', active: false },
    { id: 'Phase 6', name: 'Automation Workflows & BullMQ', branch: 'phase-6-automation-notifications', status: 'PLANNED', active: false },
    { id: 'Phase 7', name: 'Reports, Funnels & Analytics', branch: 'phase-7-reports-analytics', status: 'PLANNED', active: false },
    { id: 'Phase 8', name: 'Production Hardening & E2E', branch: 'phase-8-devops-e2e-hardening', status: 'PLANNED', active: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-6 mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                CRM & Lead Management
              </span>
              <span className="text-xs font-mono text-indigo-400">
                Phase 0 Foundation • Monorepo Architecture
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2" />
              Environment Ready
            </span>
            <a
              href="http://localhost:4000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Swagger Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-slate-900 border border-slate-800 text-indigo-300 mb-6">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            Active Branch: <span className="text-white font-semibold">phase-0-foundation</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Production-Grade Multi-Tenant <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-300">
              CRM & Lead Management System
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-3xl leading-relaxed mb-8">
            Engineered from scratch with strict tenant data isolation, ACID transactions, short-lived JWT access rotation, 
            polymorphic activity tracking, automated lead qualification, and real-time revenue pipeline forecasting.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>DATABASE ENTITIES</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">24 Models</div>
              <div className="text-xs text-slate-500 mt-1">Full Relational Schema</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>SECURITY ARCHITECTURE</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">STRIDE Model</div>
              <div className="text-xs text-slate-500 mt-1">Tenant Row-Level Isolation</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>MONOREPO PACKAGES</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">4 Workspaces</div>
              <div className="text-xs text-slate-500 mt-1">api, web, db, shared-types</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>PHASED ROADMAP</span>
                <GitBranch className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">9 Releases</div>
              <div className="text-xs text-slate-500 mt-1">1:1 Git Branch Isolation</div>
            </div>
          </div>
        </section>

        {/* Phase Branching Status Pipeline */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Phased Implementation Progress</h2>
              <p className="text-sm text-slate-400">Each phase is delivered with full code, tests, and its own dedicated Git branch.</p>
            </div>
          </div>

          <div className="space-y-3">
            {phases.map((phase, idx) => (
              <div
                key={phase.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  phase.active
                    ? 'bg-indigo-950/40 border-indigo-500/40 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      phase.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{phase.name}</span>
                      <code className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-indigo-300 font-mono">
                        git branch: {phase.branch}
                      </code>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{phase.id}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {phase.active ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      COMPLETE
                    </span>
                  ) : idx === 1 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      NEXT PHASE
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">{phase.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Git Workflow Commands Card */}
        <section className="mb-16">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs mb-3">
              <Terminal className="w-4 h-4" />
              <span>DEVELOPER INSTRUCTIONS • PUSHING PHASE 0 TO BRANCH</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pushing Phase 0 to Your Remote Repository</h3>
            <p className="text-sm text-slate-400 mb-4">
              To preserve your work in discrete reviewable stages, run these shell commands to commit and push Phase 0:
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
              <p className="text-slate-500"># 1. Switch to the Phase 0 branch</p>
              <p className="text-emerald-400">git checkout -b phase-0-foundation</p>
              <p className="text-slate-500"># 2. Stage all architectural and scaffolding files</p>
              <p className="text-emerald-400">git add .</p>
              <p className="text-slate-500"># 3. Commit Phase 0</p>
              <p className="text-emerald-400">git commit -m &quot;feat(phase-0): system architecture, data model, threat model, monorepo scaffolding&quot;</p>
              <p className="text-slate-500"># 4. Push to your Git remote</p>
              <p className="text-emerald-400">git push -u origin phase-0-foundation</p>
            </div>
          </div>
        </section>

        {/* Documentation Index */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Relational Schema & Seeds
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Prisma schema located in <code className="text-indigo-300">packages/database/prisma/schema.prisma</code> with composite multi-tenant indexes and ready-to-run seed data.
            </p>
            <span className="text-xs font-mono text-slate-500">See: docs/data-model.md</span>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              STRIDE Threat Model
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Complete threat analysis covering tenant isolation, zero-trust input validation, refresh token rotation, and rate-limiting.
            </p>
            <span className="text-xs font-mono text-slate-500">See: docs/threat-model.md</span>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Architecture & API Spec
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              C4 architecture diagrams, RESTful standards, Swagger OpenAPI specs, and Docker Compose configurations.
            </p>
            <span className="text-xs font-mono text-slate-500">See: docs/architecture.md</span>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
          CRM & Lead Management System • Production Architecture • Built with Next.js, NestJS, Prisma & PostgreSQL
        </footer>
      </div>
    </div>
  );
}
