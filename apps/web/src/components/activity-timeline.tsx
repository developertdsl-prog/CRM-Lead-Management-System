'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Plus,
  Phone,
  Video,
  FileText,
  Mail,
  CheckSquare,
  CheckCircle2,
  Calendar,
  Trash2,
  Send,
  MessageSquare,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';
import { ActivityType, ActivityStatus, ActivityPriority } from '@crm/shared-types';

interface ActivityTimelineProps {
  entityType: 'lead' | 'contact' | 'company' | 'deal';
  entityId: string;
  entityTitle?: string;
}

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
  createdAt: string;
  assignedTo?: { firstName: string; lastName: string } | null;
}

export function ActivityTimeline({
  entityType,
  entityId,
  entityTitle,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityType>(ActivityType.NOTE);
  const [quickInput, setQuickInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const queryParam = `${entityType}Id=${entityId}`;
      const data = await apiRequest<{ items: ActivityItem[] }>(
        `/activities?${queryParam}&limit=50&sortBy=createdAt&sortOrder=desc`,
      );
      setActivities(data.items || []);
    } catch (err) {
      console.error('Failed to load entity activities', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityId) {
      fetchActivities();
    }
  }, [entityId, fetchActivities]);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setSubmitting(true);
    try {
      const payload: any = {
        title: quickInput.trim(),
        type: activeTab,
        status: activeTab === ActivityType.NOTE ? ActivityStatus.COMPLETED : ActivityStatus.PENDING,
        [`${entityType}Id`]: entityId,
      };

      await apiRequest('/activities', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(
        activeTab === ActivityType.NOTE ? 'Note added!' : `${activeTab} scheduled!`,
      );
      setQuickInput('');
      fetchActivities();
    } catch (err: any) {
      toast.error('Error logging activity: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (activity: ActivityItem) => {
    const isNowCompleted = activity.status !== ActivityStatus.COMPLETED;
    const targetStatus = isNowCompleted ? ActivityStatus.COMPLETED : ActivityStatus.PENDING;

    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, status: targetStatus } : a)),
    );

    try {
      if (isNowCompleted) {
        await apiRequest(`/activities/${activity.id}/complete`, { method: 'PATCH' });
      } else {
        await apiRequest(`/activities/${activity.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: ActivityStatus.PENDING }),
        });
      }
      fetchActivities();
    } catch (err) {
      fetchActivities();
    }
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL:
        return <Phone className="w-3.5 h-3.5 text-emerald-400" />;
      case ActivityType.MEETING:
        return <Video className="w-3.5 h-3.5 text-purple-400" />;
      case ActivityType.EMAIL:
        return <Mail className="w-3.5 h-3.5 text-sky-400" />;
      case ActivityType.NOTE:
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Header */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center space-x-1 border-b border-slate-800/80 pb-2">
          {[
            { type: ActivityType.NOTE, label: 'Note', icon: FileText },
            { type: ActivityType.CALL, label: 'Call', icon: Phone },
            { type: ActivityType.MEETING, label: 'Meeting', icon: Video },
            { type: ActivityType.TASK, label: 'Task', icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleQuickLog} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder={
              activeTab === ActivityType.NOTE
                ? 'Add quick meeting note or observation...'
                : `Log new ${activeTab.toLowerCase()}...`
            }
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={submitting || !quickInput.trim()}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Activity Timeline ({activities.length})</span>
        </h4>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {activities.map((act) => {
            const isCompleted = act.status === ActivityStatus.COMPLETED;
            return (
              <div
                key={act.id}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5 text-xs"
              >
                {act.type === ActivityType.TASK ? (
                  <button
                    onClick={() => handleToggleComplete(act)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-700 hover:border-indigo-500'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                ) : (
                  <div className="p-1 rounded bg-slate-800 border border-slate-700 mt-0.5">
                    {getTypeIcon(act.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-semibold text-white ${
                        isCompleted && act.type === ActivityType.TASK
                          ? 'line-through text-slate-400'
                          : ''
                      }`}
                    >
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{act.description}</p>
                  )}
                </div>
              </div>
            );
          })}

          {activities.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-600 text-xs border border-dashed border-slate-800 rounded-xl">
              No logged activities yet. Type above to add notes or tasks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
