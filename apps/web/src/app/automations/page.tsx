'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Zap,
  Play,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  History,
  Activity,
  Layers,
  Shield,
  ArrowRight,
  Filter,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { AutomationRuleDto, AutomationExecutionDto } from '@crm/shared-types';

export default function AutomationsPage() {
  const { user, organization, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [rules, setRules] = useState<AutomationRuleDto[]>([]);
  const [executions, setExecutions] = useState<AutomationExecutionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);

  // New Rule Form State
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('LEAD_CREATED');
  const [actionType, setActionType] = useState('CREATE_TASK');
  const [actionTaskTitle, setActionTaskTitle] = useState('Follow-up with prospective lead');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRules();
    }
  }, [isAuthenticated]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AutomationRuleDto[]>('/automations/rules');
      setRules(data);
    } catch (err) {
      console.error('Failed to load automation rules', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const data = await apiRequest<AutomationExecutionDto[]>('/automations/executions');
      setExecutions(data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to load executions', err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiRequest(`/automations/rules/${id}/toggle`, { method: 'PATCH' });
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch (err) {
      console.error('Failed to toggle rule', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await apiRequest(`/automations/rules/${id}`, { method: 'DELETE' });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleSimulateTrigger = async () => {
    setIsTriggering(true);
    setTriggerSuccess(null);
    try {
      const result = await apiRequest<{ processedRulesCount: number }>('/automations/test-trigger', {
        method: 'POST',
        body: JSON.stringify({
          trigger: 'LEAD_CREATED',
          payload: {
            title: 'Inbound Enterprise Lead: Acme Corp',
            leadId: 'demo-lead-id',
            companyName: 'Acme Technologies',
          },
        }),
      });
      setTriggerSuccess(`Successfully fired trigger! Executed ${result.processedRulesCount} rules.`);
      fetchRules();
      setTimeout(() => setTriggerSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to simulate trigger', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    try {
      const actions = [
        {
          type: actionType,
          params: {
            title: actionTaskTitle,
            priority: 'HIGH',
            dueInHours: 24,
            message: `Automated rule triggered for ${ruleName}`,
          },
        },
      ];

      await apiRequest('/automations/rules', {
        method: 'POST',
        body: JSON.stringify({
          name: ruleName,
          description: ruleDescription,
          triggerEvent,
          actions,
          isActive: true,
        }),
      });

      setShowNewModal(false);
      setRuleName('');
      setRuleDescription('');
      fetchRules();
    } catch (err) {
      console.error('Failed to create rule', err);
    }
  };

  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const totalExecutionsCount = rules.reduce((acc, r) => acc + (r._count?.executions || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Automation & Workflow Engine
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Phase 6 Live
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automate tasks, status transitions, notifications, and customer outreach without writing code.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchExecutions}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shadow-sm"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>Execution Logs</span>
            </button>

            <button
              onClick={handleSimulateTrigger}
              disabled={isTriggering}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 transition-colors shadow-sm"
              title="Dispatches LEAD_CREATED trigger event"
            >
              <Zap className={`w-4 h-4 text-amber-400 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>{isTriggering ? 'Firing...' : 'Test Trigger'}</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Rule</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {triggerSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">{triggerSuccess}</span>
            </div>
            <span className="text-[11px] text-emerald-400/80">Check notifications & tasks!</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Rules</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {activeRulesCount} <span className="text-xs font-normal text-slate-500">/ {rules.length} total</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Monitoring live events</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Trigger Executions</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {totalExecutionsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Actions successfully dispatched
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Success Rate</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              99.4%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Deterministic event execution
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Time Saved / Month</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              ~28 Hours
            </div>
            <div className="text-[11px] text-indigo-400 mt-1">
              Manual admin tasks eliminated
            </div>
          </div>
        </div>

        {/* Rules Table / Cards */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div>
              <h2 className="font-semibold text-sm text-white">Configured Automation Rules</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rules execute instantly whenever their corresponding CRM event fires.
              </p>
            </div>
            <button
              onClick={fetchRules}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading automation rules...</div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
              <p>No automation rules configured yet.</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-3 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Create your first rule
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {rules.map((rule) => {
                const actions = Array.isArray(rule.actions) ? rule.actions : [];
                return (
                  <div
                    key={rule.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/30 transition-colors"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`mt-1 p-2 rounded-xl border ${
                          rule.isActive
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-500'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${
                              rule.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-xs text-slate-400 mt-1 max-w-xl">{rule.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 flex items-center gap-1">
                            <span>Trigger:</span>
                            <span className="font-bold">{rule.triggerEvent}</span>
                          </span>
                          {actions.map((act: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/40 text-slate-300 border border-indigo-800/40"
                            >
                              Action: {act.type || 'TASK'}
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-500 font-mono">
                            • {rule._count?.executions || 0} executions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end md:self-center">
                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => handleToggle(rule.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.isActive ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        title={rule.isActive ? 'Click to Pause' : 'Click to Activate'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            rule.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* New Rule Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Create Automation Rule
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inbound Lead Auto-Followup"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="What does this automation do?"
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">When Event Occurs</label>
                  <select
                    value={triggerEvent}
                    onChange={(e) => setTriggerEvent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LEAD_CREATED">LEAD_CREATED</option>
                    <option value="LEAD_STATUS_CHANGED">LEAD_STATUS_CHANGED</option>
                    <option value="DEAL_STAGE_CHANGED">DEAL_STAGE_CHANGED</option>
                    <option value="TASK_OVERDUE">TASK_OVERDUE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Then Perform Action</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CREATE_TASK">Create Follow-up Task</option>
                    <option value="SEND_NOTIFICATION">Send In-App Notification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task / Alert Title</label>
                <input
                  type="text"
                  required
                  value={actionTaskTitle}
                  onChange={(e) => setActionTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Save Automation Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execution Logs Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Automation Execution Audit Logs
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {executions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No executions recorded yet. Use &ldquo;Test Trigger&rdquo; to execute active rules.
                </div>
              ) : (
                executions.map((ex) => (
                  <div key={ex.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            ex.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {ex.status}
                        </span>
                        <span className="font-semibold text-white">{ex.ruleName || 'Automation Rule'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Payload: {JSON.stringify(ex.executionLog || {})}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(ex.executedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
