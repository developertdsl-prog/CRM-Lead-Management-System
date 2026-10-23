'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Phone,
  Video,
  FileText,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Building2,
  User,
  Target,
  Kanban,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  ActivityType,
  ActivityStatus,
  ActivityPriority,
} from '@crm/shared-types';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  status: ActivityStatus;
  priority: ActivityPriority;
  dueAt?: string | null;
  completedAt?: string | null;
  outcome?: string | null;
  callType?: string | null;
  meetingUrl?: string | null;
  location?: string | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  lead?: { id: string; firstName: string; lastName: string; companyName?: string | null } | null;
  contact?: { id: string; firstName: string; lastName: string; email: string } | null;
  company?: { id: string; name: string } | null;
  deal?: { id: string; title: string; amount: number } | null;
  createdAt: string;
}

interface ActivityStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export default function TasksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    type: ActivityType.TASK,
    priority: ActivityPriority.MEDIUM,
    status: ActivityStatus.PENDING,
    description: '',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    meetingUrl: '',
    location: '',
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchActivities = useCallback(async () => {
    try {
      setRefreshing(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (typeFilter !== 'ALL') queryParams.set('type', typeFilter);
      if (priorityFilter !== 'ALL') queryParams.set('priority', priorityFilter);
      if (statusFilter === 'OVERDUE') {
        queryParams.set('isOverdue', 'true');
      } else if (statusFilter !== 'ALL') {
        queryParams.set('status', statusFilter);
      }

      const [resData, statsData] = await Promise.all([
        apiRequest<{ items: ActivityItem[] }>(`/activities?${queryParams.toString()}&limit=100`),
        apiRequest<ActivityStats>('/activities/stats'),
      ]);

      setActivities(resData.items);
      setStats(statsData);
    } catch (err: any) {
      toast.error('Failed to load tasks: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, typeFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivities();
    }
  }, [isAuthenticated, fetchActivities]);

  const handleToggleComplete = async (activity: ActivityItem) => {
    const isNowCompleted = activity.status !== ActivityStatus.COMPLETED;
    const targetStatus = isNowCompleted ? ActivityStatus.COMPLETED : ActivityStatus.PENDING;

    // Optimistic update
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, status: targetStatus } : a)),
    );

    try {
      if (isNowCompleted) {
        await apiRequest(`/activities/${activity.id}/complete`, { method: 'PATCH' });
        toast.success(`Completed "${activity.title}"!`);
      } else {
        await apiRequest(`/activities/${activity.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: ActivityStatus.PENDING }),
        });
        toast.info(`Re-opened "${activity.title}"`);
      }
      fetchActivities();
    } catch (err: any) {
      toast.error('Failed to update task: ' + err.message);
      fetchActivities();
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await apiRequest(`/activities/${id}`, { method: 'DELETE' });
      toast.success('Activity removed');
      setActivities((prev) => prev.filter((a) => a.id !== id));
      fetchActivities();
    } catch (err: any) {
      toast.error('Error deleting activity: ' + err.message);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await apiRequest('/activities', {
        method: 'POST',
        body: JSON.stringify({
          ...createFormData,
          dueAt: createFormData.dueAt ? new Date(createFormData.dueAt).toISOString() : null,
        }),
      });

      toast.success('Activity created successfully!');
      setShowCreateModal(false);
      setCreateFormData({
        title: '',
        type: ActivityType.TASK,
        priority: ActivityPriority.MEDIUM,
        status: ActivityStatus.PENDING,
        description: '',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        meetingUrl: '',
        location: '',
      });
      fetchActivities();
    } catch (err: any) {
      toast.error('Error creating activity: ' + err.message);
    }
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case ActivityType.MEETING:
        return <Video className="w-4 h-4 text-purple-400" />;
      case ActivityType.EMAIL:
        return <Mail className="w-4 h-4 text-sky-400" />;
      case ActivityType.NOTE:
        return <FileText className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckSquare className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getPriorityBadge = (priority: ActivityPriority) => {
    switch (priority) {
      case ActivityPriority.URGENT:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">URGENT</span>;
      case ActivityPriority.HIGH:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH</span>;
      case ActivityPriority.LOW:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">MEDIUM</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading activities & tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Activities & Tasks
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Phase 5
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Polymorphic tasks, calls, meetings, and follow-ups with automated overdue alerts
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Activity</span>
          </button>
        </div>

        {/* Stats KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Total Activities</span>
                <CheckSquare className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{stats.total}</div>
              <div className="text-[11px] text-slate-400 mt-1">Across all entities</div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30">
              <div className="flex items-center justify-between text-blue-300 text-xs mb-1">
                <span>Pending Tasks</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-blue-400 tracking-tight">{stats.pending}</div>
              <div className="text-[11px] text-blue-400/80 mt-1">Needs attention</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
                <span>Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 tracking-tight">{stats.completed}</div>
              <div className="text-[11px] text-emerald-500/80 mt-1">{stats.completionRate}% completion rate</div>
            </div>

            <div className={`p-4 rounded-2xl border ${stats.overdue > 0 ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold">Overdue Tasks</span>
                <AlertTriangle className={`w-4 h-4 ${stats.overdue > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              </div>
              <div className={`text-xl font-bold tracking-tight ${stats.overdue > 0 ? 'text-rose-400' : 'text-white'}`}>
                {stats.overdue}
              </div>
              <div className="text-[11px] opacity-80 mt-1">Past scheduled due date</div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="TASK">Tasks</option>
              <option value="CALL">Calls</option>
              <option value="MEETING">Meetings</option>
              <option value="NOTE">Notes</option>
              <option value="EMAIL">Emails</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Only</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue Alerts</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <button
              onClick={fetchActivities}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
          {activities.map((activity) => {
            const isCompleted = activity.status === ActivityStatus.COMPLETED;
            const isOverdue =
              !isCompleted && activity.dueAt && new Date(activity.dueAt).getTime() < Date.now();

            return (
              <div
                key={activity.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-slate-800/40 ${
                  isCompleted ? 'opacity-60 bg-slate-950/20' : ''
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(activity)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-700 hover:border-indigo-500'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="p-1 rounded bg-slate-800/80 border border-slate-700/80 flex items-center">
                        {getTypeIcon(activity.type)}
                      </div>

                      <h3
                        className={`text-xs font-bold ${
                          isCompleted ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {activity.title}
                      </h3>

                      {getPriorityBadge(activity.priority)}

                      {isOverdue && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>OVERDUE</span>
                        </span>
                      )}
                    </div>

                    {activity.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    {/* Metadata & Associations */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                      {activity.dueAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(activity.dueAt).toLocaleString()}</span>
                        </div>
                      )}

                      {activity.lead && (
                        <div className="flex items-center space-x-1 text-indigo-400 font-medium">
                          <Target className="w-3 h-3" />
                          <span>
                            Lead: {activity.lead.firstName} {activity.lead.lastName}
                          </span>
                        </div>
                      )}

                      {activity.company && (
                        <div className="flex items-center space-x-1 text-slate-300">
                          <Building2 className="w-3 h-3" />
                          <span>{activity.company.name}</span>
                        </div>
                      )}

                      {activity.deal && (
                        <div className="flex items-center space-x-1 text-emerald-400 font-medium">
                          <Kanban className="w-3 h-3" />
                          <span>Deal: {activity.deal.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {activities.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-xs">
              No activities found. Click "+ New Activity" to schedule a task or meeting.
            </div>
          )}
        </div>
      </main>

      {/* New Activity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Schedule New Activity
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up demo call"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={createFormData.type}
                    onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value as ActivityType })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={ActivityType.TASK}>Task</option>
                    <option value={ActivityType.CALL}>Phone Call</option>
                    <option value={ActivityType.MEETING}>Meeting</option>
                    <option value={ActivityType.EMAIL}>Email</option>
                    <option value={ActivityType.NOTE}>Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={createFormData.priority}
                    onChange={(e) => setCreateFormData({ ...createFormData, priority: e.target.value as ActivityPriority })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={ActivityPriority.LOW}>Low</option>
                    <option value={ActivityPriority.MEDIUM}>Medium</option>
                    <option value={ActivityPriority.HIGH}>High</option>
                    <option value={ActivityPriority.URGENT}>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={createFormData.dueAt}
                  onChange={(e) => setCreateFormData({ ...createFormData, dueAt: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional agenda or instructions..."
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
