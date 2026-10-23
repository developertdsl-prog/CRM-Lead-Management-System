'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Kanban,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Building2,
  User,
  Calendar,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  ExternalLink,
  Edit,
  Trash2,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { CustomFieldsSection } from '@/components/custom-fields-section';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  DealStatus,
  PipelineSummaryDto,
  PipelineForecastSummaryDto,
  CreateDealDto,
} from '@crm/shared-types';

interface StageData {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  winProbability: number;
  color: string;
  dealCount: number;
  totalDealValue: number;
}

interface DealItem {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: DealStatus;
  pipelineId: string;
  stageId: string;
  companyId?: string | null;
  contactId?: string | null;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  lostReason?: string | null;
  createdAt: string;
  company?: { id: string; name: string; domain?: string } | null;
  contact?: { id: string; firstName: string; lastName: string; email: string } | null;
  owner?: { id: string; firstName: string; lastName: string; email: string } | null;
  stage?: { id: string; name: string; color?: string; winProbability: number } | null;
}

export default function DealsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Active state
  const [pipelines, setPipelines] = useState<PipelineSummaryDto[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [forecast, setForecast] = useState<PipelineForecastSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View & Filter states
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Drag and Drop State
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [activeDropStageId, setActiveDropStageId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preselectedStageId, setPreselectedStageId] = useState<string>('');
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [targetLostStageId, setTargetLostStageId] = useState<string>('');
  const [lostReasonInput, setLostReasonInput] = useState('');

  // Lookup data for creation modal
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);

  // Create form state
  const [createFormData, setCreateFormData] = useState<CreateDealDto>({
    title: '',
    amount: 10000,
    currency: 'USD',
    pipelineId: '',
    stageId: '',
    companyId: '',
    contactId: '',
    expectedCloseDate: '',
  });

  // Check auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch initial pipelines and lookup data
  const fetchPipelines = useCallback(async () => {
    try {
      const data = await apiRequest<PipelineSummaryDto[]>('/pipelines');
      setPipelines(data);
      if (data.length > 0 && !selectedPipelineId) {
        const defaultPipe = data.find((p) => p.isDefault) || data[0];
        setSelectedPipelineId(defaultPipe.id);
      }
    } catch (err: any) {
      toast.error('Failed to load pipelines: ' + err.message);
    }
  }, [selectedPipelineId]);

  const fetchLookupData = useCallback(async () => {
    try {
      const [compRes, contRes] = await Promise.all([
        apiRequest<{ items: Array<{ id: string; name: string }> }>('/companies?limit=100').catch(() => ({ items: [] })),
        apiRequest<{ items: Array<{ id: string; firstName: string; lastName: string }> }>('/contacts?limit=100').catch(() => ({ items: [] })),
      ]);
      setCompanies(compRes.items || []);
      setContacts(contRes.items || []);
    } catch (err) {
      console.error('Error fetching lookups', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPipelines();
      fetchLookupData();
    }
  }, [isAuthenticated, fetchPipelines, fetchLookupData]);

  // Fetch deals and forecast for active pipeline
  const fetchDealsAndForecast = useCallback(async () => {
    if (!selectedPipelineId) return;
    try {
      setRefreshing(true);
      const [dealsRes, forecastRes] = await Promise.all([
        apiRequest<{ items: DealItem[] }>(`/deals?pipelineId=${selectedPipelineId}&limit=200`),
        apiRequest<PipelineForecastSummaryDto>(`/deals/forecast?pipelineId=${selectedPipelineId}`),
      ]);
      setDeals(dealsRes.items);
      setForecast(forecastRes);
    } catch (err: any) {
      toast.error('Failed to load deals: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPipelineId]);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchDealsAndForecast();
    }
  }, [selectedPipelineId, fetchDealsAndForecast]);

  // Active pipeline object & ordered stages
  const activePipeline = useMemo(() => {
    return pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0] || null;
  }, [pipelines, selectedPipelineId]);

  const stages: StageData[] = useMemo(() => {
    if (!activePipeline?.stages) return [];
    return [...activePipeline.stages].sort((a, b) => a.order - b.order) as StageData[];
  }, [activePipeline]);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        !search ||
        deal.title.toLowerCase().includes(search.toLowerCase()) ||
        deal.company?.name.toLowerCase().includes(search.toLowerCase()) ||
        deal.contact?.firstName.toLowerCase().includes(search.toLowerCase()) ||
        deal.contact?.lastName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || deal.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deals, search, statusFilter]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropStageId !== stageId) {
      setActiveDropStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    if (activeDropStageId === stageId) {
      setActiveDropStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setActiveDropStageId(null);
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    setDraggedDealId(null);

    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stageId === targetStageId) return;

    const targetStage = stages.find((s) => s.id === targetStageId);
    if (!targetStage) return;

    // If moving to a LOST stage, ask for lost reason
    if (targetStage.winProbability === 0 || targetStage.name.toLowerCase().includes('lost')) {
      setSelectedDeal(deal);
      setTargetLostStageId(targetStageId);
      setShowLostReasonModal(true);
      return;
    }

    // Optimistic UI update
    executeStageChange(dealId, targetStageId);
  };

  const executeStageChange = async (dealId: string, targetStageId: string, lostReason?: string) => {
    const previousDeals = [...deals];
    const targetStage = stages.find((s) => s.id === targetStageId);

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          let newStatus = DealStatus.OPEN;
          if (targetStage?.winProbability === 100) newStatus = DealStatus.WON;
          if (targetStage?.winProbability === 0 || lostReason) newStatus = DealStatus.LOST;

          return {
            ...d,
            stageId: targetStageId,
            status: newStatus,
            stage: targetStage ? { id: targetStage.id, name: targetStage.name, color: targetStage.color, winProbability: targetStage.winProbability } : d.stage,
          };
        }
        return d;
      }),
    );

    try {
      await apiRequest(`/deals/${dealId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({
          stageId: targetStageId,
          ...(lostReason && { lostReason }),
        }),
      });

      toast.success(`Deal moved to "${targetStage?.name}"`);
      // Refresh forecast metrics
      fetchDealsAndForecast();
    } catch (err: any) {
      setDeals(previousDeals);
      toast.error('Failed to move deal: ' + err.message);
    }
  };

  const submitLostReason = async () => {
    if (!selectedDeal || !targetLostStageId) return;
    const reason = lostReasonInput.trim() || 'Closed Lost';
    setShowLostReasonModal(false);
    setLostReasonInput('');
    await executeStageChange(selectedDeal.id, targetLostStageId, reason);
  };

  // Open Create Deal Modal
  const openCreateModal = (stageId?: string) => {
    const targetStage = stageId || stages[0]?.id || '';
    setPreselectedStageId(targetStage);
    setCreateFormData({
      title: '',
      amount: 15000,
      currency: 'USD',
      pipelineId: selectedPipelineId,
      stageId: targetStage,
      companyId: '',
      contactId: '',
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowCreateModal(true);
  };

  // Handle Deal Creation
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.title.trim()) {
      toast.error('Deal title is required');
      return;
    }
    if (!createFormData.pipelineId || !createFormData.stageId) {
      toast.error('Pipeline and stage are required');
      return;
    }

    try {
      await apiRequest('/deals', {
        method: 'POST',
        body: JSON.stringify(createFormData),
      });

      toast.success('Deal created successfully!');
      setShowCreateModal(false);
      fetchDealsAndForecast();
    } catch (err: any) {
      toast.error('Error creating deal: ' + err.message);
    }
  };

  // Delete Deal
  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to archive this deal?')) return;
    try {
      await apiRequest(`/deals/${dealId}`, { method: 'DELETE' });
      toast.success('Deal archived');
      setShowDetailDrawer(false);
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
      fetchDealsAndForecast();
    } catch (err: any) {
      toast.error('Error deleting deal: ' + err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading sales pipelines and deal board...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                <Kanban className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Sales Pipelines & Deals
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Phase 4
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Interactive Drag-and-Drop deal management with real-time weighted forecasting
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Pipeline Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Pipeline:</span>
              <select
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-indigo-500"
              >
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            <button
              onClick={() => openCreateModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Deal</span>
            </button>
          </div>
        </div>

        {/* Top KPI & Weighted Revenue Forecast Banner */}
        {forecast && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Active Pipeline</span>
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white tracking-tight">
                ${forecast.totalPipelineValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {forecast.openDealsCount} open opportunities
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-indigo-300 text-xs mb-1">
                <span className="font-semibold">Weighted Forecast</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-indigo-300 tracking-tight">
                ${forecast.weightedForecastValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-400/80 mt-1">
                Probability-adjusted
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
                <span>Won Revenue</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 tracking-tight">
                ${forecast.wonDealsValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-1">
                {forecast.wonDealsCount} won deals
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Win Rate</span>
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white tracking-tight">
                {forecast.winRate}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {forecast.lostDealsCount} lost
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Avg Deal Size</span>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-white tracking-tight">
                ${forecast.averageDealSize.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {forecast.totalDeals} total recorded
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search deals, company, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="WON">Closed Won</option>
              <option value="LOST">Closed Lost</option>
            </select>

            <button
              onClick={fetchDealsAndForecast}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Deals"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Mode: Interactive Drag & Drop Kanban */}
        {viewMode === 'kanban' ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4 min-w-[1100px]">
              {stages.map((stage) => {
                const stageDeals = filteredDeals.filter((d) => d.stageId === stage.id);
                const totalAmount = stageDeals.reduce((acc, d) => acc + d.amount, 0);
                const isOver = activeDropStageId === stage.id;

                return (
                  <div
                    key={stage.id}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={(e) => handleDragLeave(e, stage.id)}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className={`flex-1 min-w-[280px] rounded-2xl flex flex-col transition-all duration-200 ${
                      isOver
                        ? 'bg-indigo-950/40 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80'
                    }`}
                  >
                    {/* Stage Header */}
                    <div className="p-3.5 border-b border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: stage.color || '#3B82F6' }}
                          />
                          <h3 className="text-xs font-bold text-white tracking-tight">
                            {stage.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {stage.winProbability}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {stageDeals.length} {stageDeals.length === 1 ? 'deal' : 'deals'}
                        </span>
                        <span className="font-semibold text-slate-200 font-mono">
                          ${totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Stage Deal Cards Area */}
                    <div className="p-3 flex-1 space-y-3 min-h-[420px] max-h-[700px] overflow-y-auto">
                      {stageDeals.map((deal) => {
                        const isWon = deal.status === DealStatus.WON;
                        const isLost = deal.status === DealStatus.LOST;

                        return (
                          <div
                            key={deal.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, deal.id)}
                            onClick={() => {
                              setSelectedDeal(deal);
                              setShowDetailDrawer(true);
                            }}
                            className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing group hover:scale-[1.01] hover:shadow-lg ${
                              isWon
                                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                                : isLost
                                ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {deal.title}
                              </h4>
                              {isWon && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  WON
                                </span>
                              )}
                              {isLost && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  LOST
                                </span>
                              )}
                            </div>

                            <div className="text-sm font-bold font-mono text-emerald-400 mb-2">
                              ${deal.amount.toLocaleString()}
                            </div>

                            {/* Meta items */}
                            <div className="space-y-1 text-[11px] text-slate-400">
                              {deal.company && (
                                <div className="flex items-center space-x-1.5 truncate">
                                  <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span className="truncate">{deal.company.name}</span>
                                </div>
                              )}

                              {deal.contact && (
                                <div className="flex items-center space-x-1.5 truncate">
                                  <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span className="truncate">
                                    {deal.contact.firstName} {deal.contact.lastName}
                                  </span>
                                </div>
                              )}

                              {deal.expectedCloseDate && (
                                <div className="flex items-center space-x-1.5">
                                  <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span>
                                    {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Quick Stage Move Dropdown for Touch / Mobile */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between"
                            >
                              <span className="text-[10px] text-slate-500">Move to:</span>
                              <select
                                value={deal.stageId}
                                onChange={(e) => {
                                  const targetId = e.target.value;
                                  const tStage = stages.find((s) => s.id === targetId);
                                  if (tStage?.winProbability === 0) {
                                    setSelectedDeal(deal);
                                    setTargetLostStageId(targetId);
                                    setShowLostReasonModal(true);
                                  } else {
                                    executeStageChange(deal.id, targetId);
                                  }
                                }}
                                className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500"
                              >
                                {stages.map((stg) => (
                                  <option key={stg.id} value={stg.id}>
                                    {stg.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {stageDeals.length === 0 && (
                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/60 rounded-xl text-slate-600 text-xs">
                          <span>No deals in this stage</span>
                          <span className="text-[10px] text-slate-600 mt-0.5">Drag card here</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Add Button at bottom of column */}
                    <div className="p-2 border-t border-slate-800/80">
                      <button
                        onClick={() => openCreateModal(stage.id)}
                        className="w-full py-1.5 rounded-lg border border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Deal</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* View Mode: List / Table */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Deal Title</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Stage</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Expected Close</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => {
                      setSelectedDeal(deal);
                      setShowDetailDrawer(true);
                    }}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-white">{deal.title}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      ${deal.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                        {deal.stage?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          deal.status === DealStatus.WON
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : deal.status === DealStatus.LOST
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {deal.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{deal.company?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                    </td>
                  </tr>
                ))}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No deals found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Deal Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Create New Deal
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud License"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Deal Amount ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={createFormData.amount}
                    onChange={(e) => setCreateFormData({ ...createFormData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Stage *
                  </label>
                  <select
                    value={createFormData.stageId}
                    onChange={(e) => setCreateFormData({ ...createFormData, stageId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.winProbability}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Associated Company
                  </label>
                  <select
                    value={createFormData.companyId || ''}
                    onChange={(e) => setCreateFormData({ ...createFormData, companyId: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Company (Optional)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Primary Contact
                  </label>
                  <select
                    value={createFormData.contactId || ''}
                    onChange={(e) => setCreateFormData({ ...createFormData, contactId: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Contact (Optional)</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={createFormData.expectedCloseDate || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, expectedCloseDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost Reason Modal */}
      {showLostReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Record Lost Deal Reason</h3>
            </div>
            <p className="text-xs text-slate-300">
              Moving <span className="text-white font-semibold">{selectedDeal?.title}</span> to Closed Lost. Please provide a brief explanation:
            </p>
            <input
              type="text"
              placeholder="e.g. Budget cut, competitor chosen, timeline delayed"
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowLostReasonModal(false);
                  setLostReasonInput('');
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={submitLostReason}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Mark as Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Detail Drawer */}
      {showDetailDrawer && selectedDeal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedDeal.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-base font-mono font-bold text-emerald-400">
                      ${selectedDeal.amount.toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedDeal.status === DealStatus.WON
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : selectedDeal.status === DealStatus.LOST
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {selectedDeal.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-5">
                {/* Stage movement selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Current Stage
                  </label>
                  <select
                    value={selectedDeal.stageId}
                    onChange={(e) => executeStageChange(selectedDeal.id, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.winProbability}% win probability)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company & Contact Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Associated Entities
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Company:</span>
                    <span className="font-semibold text-white">
                      {selectedDeal.company?.name || 'Not associated'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Contact:</span>
                    <span className="font-semibold text-white">
                      {selectedDeal.contact
                        ? `${selectedDeal.contact.firstName} ${selectedDeal.contact.lastName}`
                        : 'Not associated'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Expected Close:</span>
                    <span className="font-semibold text-white">
                      {selectedDeal.expectedCloseDate
                        ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString()
                        : 'Not specified'}
                    </span>
                  </div>
                  {selectedDeal.lostReason && (
                    <div className="pt-2 border-t border-slate-800 text-rose-400">
                      <span className="font-semibold block text-[11px]">Lost Reason:</span>
                      <p className="text-xs">{selectedDeal.lostReason}</p>
                    </div>
                  )}
                </div>

                {/* Quick Status Buttons */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Stage Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const wonStage = stages.find((s) => s.winProbability === 100);
                        if (wonStage) executeStageChange(selectedDeal.id, wonStage.id);
                      }}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Won</span>
                    </button>

                    <button
                      onClick={() => {
                        const lostStage = stages.find((s) => s.winProbability === 0);
                        if (lostStage) {
                          setTargetLostStageId(lostStage.id);
                          setShowLostReasonModal(true);
                        }
                      }}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 text-xs font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Mark as Lost</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Polymorphic Custom Fields */}
                <div className="pt-2 border-t border-slate-800">
                  <CustomFieldsSection
                    entityType="DEAL"
                    entityId={selectedDeal.id}
                    title="Deal Custom Fields"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleDeleteDeal(selectedDeal.id)}
                  className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Archive Deal</span>
                </button>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
