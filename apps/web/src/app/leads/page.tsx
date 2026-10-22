'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  MoreVertical,
  X,
  FileSpreadsheet,
  Building,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  MessageSquare,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Edit,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  LeadStatus,
  LeadPriority,
  LeadSource,
  ILead,
  PaginatedResult,
  LeadStatsDto,
  LeadTimelineItem,
  DuplicateMatch,
  DuplicateCheckResult,
} from '@crm/shared-types';

export default function LeadsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<LeadStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  // Selected lead for detail/convert
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<LeadTimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Duplicate warning for create form
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateMatch[] | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: '',
    source: LeadSource.WEBSITE,
    status: LeadStatus.NEW,
    priority: LeadPriority.MEDIUM,
    estimatedValue: '',
    score: 50,
  });

  const [convertForm, setConvertForm] = useState({
    createDeal: true,
    dealTitle: '',
    dealAmount: '',
    expectedCloseDate: '',
  });

  const [importOptions, setImportOptions] = useState({
    onDuplicate: 'SKIP' as 'SKIP' | 'UPDATE' | 'IMPORT_ANYWAY',
    csvText: '',
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [duplicateClusters, setDuplicateClusters] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch leads and stats
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);

      const data = await apiRequest<PaginatedResult<any>>(`/leads?${params.toString()}`);
      setLeads(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  const fetchStats = async () => {
    try {
      const data = await apiRequest<LeadStatsDto>('/leads/stats');
      setStats(data);
    } catch {
      // Ignore silent error
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
      fetchStats();
    }
  }, [isAuthenticated, fetchLeads]);

  // Pre-flight duplicate check on Create Lead form
  useEffect(() => {
    const handler = setTimeout(async () => {
      if ((formData.email && formData.email.includes('@')) || (formData.phone && formData.phone.length > 5)) {
        setCheckingDuplicates(true);
        try {
          const res = await apiRequest<DuplicateCheckResult>('/leads/check-duplicate', {
            method: 'POST',
            body: JSON.stringify({
              email: formData.email,
              phone: formData.phone,
              companyName: formData.companyName,
            }),
          });
          if (res.hasDuplicate) {
            setDuplicateWarning(res.matches);
          } else {
            setDuplicateWarning(null);
          }
        } catch {
          setDuplicateWarning(null);
        } finally {
          setCheckingDuplicates(false);
        }
      } else {
        setDuplicateWarning(null);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [formData.email, formData.phone, formData.companyName]);

  // Fetch single lead details & timeline
  const openLeadDrawer = async (lead: any) => {
    setSelectedLead(lead);
    setShowDetailDrawer(true);
    setLoadingTimeline(true);
    try {
      const timelineData = await apiRequest<LeadTimelineItem[]>(`/leads/${lead.id}/timeline`);
      setTimeline(timelineData);
    } catch (err: any) {
      toast.error('Could not load timeline');
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Create Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
          score: Number(formData.score),
        }),
      });
      toast.success('Lead created successfully!');
      setShowCreateModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        jobTitle: '',
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        priority: LeadPriority.MEDIUM,
        estimatedValue: '',
        score: 50,
      });
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create lead');
    }
  };

  // Quick Status Transition
  const handleQuickStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await apiRequest(`/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          statusNote: `Quick transition to ${newStatus}`,
        }),
      });
      toast.success(`Lead moved to ${newStatus}`);
      fetchLeads();
      fetchStats();
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
        const timelineData = await apiRequest<LeadTimelineItem[]>(`/leads/${leadId}/timeline`);
        setTimeline(timelineData);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Add Note to Timeline
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead) return;

    try {
      await apiRequest(`/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote }),
      });
      toast.success('Note added to timeline');
      setNewNote('');
      const timelineData = await apiRequest<LeadTimelineItem[]>(`/leads/${selectedLead.id}/timeline`);
      setTimeline(timelineData);
    } catch (err: any) {
      toast.error('Failed to add note');
    }
  };

  // Open Convert Modal
  const openConvertModal = (lead: any) => {
    setSelectedLead(lead);
    setConvertForm({
      createDeal: true,
      dealTitle: lead.companyName ? `${lead.companyName} - Deal Opportunity` : `${lead.firstName} ${lead.lastName} - Opportunity`,
      dealAmount: lead.estimatedValue ? lead.estimatedValue.toString() : '10000',
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowConvertModal(true);
  };

  // Convert Lead (Atomic transaction)
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const res: any = await apiRequest(`/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        body: JSON.stringify({
          createDeal: convertForm.createDeal,
          dealTitle: convertForm.dealTitle,
          dealAmount: convertForm.dealAmount ? parseFloat(convertForm.dealAmount) : undefined,
          expectedCloseDate: convertForm.expectedCloseDate,
        }),
      });
      toast.success('Lead converted to Deal, Contact, and Company successfully!');
      setShowConvertModal(false);
      setShowDetailDrawer(false);
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed');
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem('crm_access_token');
      const res = await fetch(`http://localhost:4000/api/v1/leads/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Leads exported to CSV');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  // CSV Raw Import
  const handleImportCsv = async () => {
    if (!importOptions.csvText.trim()) {
      toast.error('Please paste CSV text or select a template');
      return;
    }

    setImporting(true);
    try {
      const res: any = await apiRequest('/leads/import/csv-raw', {
        method: 'POST',
        body: JSON.stringify({
          csv: importOptions.csvText,
          onDuplicate: importOptions.onDuplicate,
        }),
      });
      setImportResult(res);
      toast.success(`Import complete: ${res.imported} imported, ${res.skippedDuplicates} duplicates skipped.`);
      fetchLeads();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'CSV Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Load sample template for CSV import
  const loadSampleTemplate = () => {
    const template = `First Name,Last Name,Email,Phone,Company,Job Title,Estimated Value,Source,Priority
Sarah,Connor,sarah@cyberdyne.io,+1-555-019-2834,Cyberdyne Systems,COO,65000,WEBSITE,HIGH
Marcus,Wright,marcus@resistance.org,+1-555-019-9944,Skynet Resistance,Operations,35000,COLD_OUTREACH,MEDIUM
Elena,Rostova,elena@globex.com,+1-555-019-1122,Globex Corporation,VP Product,120000,REFERRAL,URGENT`;
    setImportOptions({ ...importOptions, csvText: template });
  };

  // Duplicate Scanner
  const scanDuplicates = async () => {
    try {
      const data: any = await apiRequest('/leads/duplicates');
      setDuplicateClusters(data.clusters || []);
      setShowDuplicatesModal(true);
    } catch (err: any) {
      toast.error('Failed to scan duplicate leads');
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case LeadStatus.CONTACTED:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case LeadStatus.QUALIFIED:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case LeadStatus.CONVERTED:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case LeadStatus.LOST:
      case LeadStatus.UNQUALIFIED:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityColor = (priority: LeadPriority) => {
    switch (priority) {
      case LeadPriority.URGENT:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case LeadPriority.HIGH:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case LeadPriority.MEDIUM:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case LeadPriority.LOW:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Actions Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Leads Management</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Phase 2 Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Track lifecycle, enforce deduplication, import via CSV, and atomically convert qualified leads into Deals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={scanDuplicates}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Scan Duplicates
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Export CSV
            </button>

            <button
              onClick={() => {
                setImportResult(null);
                setShowImportModal(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Import CSV
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              New Lead
            </button>
          </div>
        </div>

        {/* Quick KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">TOTAL LEADS</div>
            <div className="text-2xl font-bold font-mono text-white">{stats?.totalLeads ?? totalItems}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">QUALIFIED</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{stats?.qualifiedLeads ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">CONVERTED TO DEALS</div>
            <div className="text-2xl font-bold font-mono text-purple-400">{stats?.convertedLeads ?? 0} ({stats?.conversionRate ?? 0}%)</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">PIPELINE VALUE</div>
            <div className="text-2xl font-bold font-mono text-amber-400">${(stats?.totalEstimatedValue ?? 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, email, phone, company..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Priority Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" /> Priority:
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Priorities</option>
                <option value={LeadPriority.URGENT}>Urgent</option>
                <option value={LeadPriority.HIGH}>High</option>
                <option value={LeadPriority.MEDIUM}>Medium</option>
                <option value={LeadPriority.LOW}>Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Lead Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Est. Value</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                      Loading lead pipeline records...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-500">
                      <Target className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                      <div className="text-sm font-semibold text-slate-300">No leads found</div>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        No lead records match your search or filters. Click &quot;New Lead&quot; to add one or &quot;Import CSV&quot; to bulk upload leads.
                      </p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => openLeadDrawer(lead)}
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {lead.firstName[0]}
                            {lead.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {lead.firstName} {lead.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {lead.jobTitle || 'Lead Contact'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {lead.companyName ? (
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <span>{lead.companyName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[150px]">{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {lead.source}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(
                            lead.priority,
                          )}`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* Status with quick dropdown */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleQuickStatusChange(lead.id, e.target.value as LeadStatus)
                          }
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium bg-slate-950 focus:outline-none ${getStatusColor(
                            lead.status,
                          )}`}
                        >
                          <option value={LeadStatus.NEW}>NEW</option>
                          <option value={LeadStatus.CONTACTED}>CONTACTED</option>
                          <option value={LeadStatus.QUALIFIED}>QUALIFIED</option>
                          <option value={LeadStatus.UNQUALIFIED}>UNQUALIFIED</option>
                          <option value={LeadStatus.CONVERTED}>CONVERTED</option>
                          <option value={LeadStatus.LOST}>LOST</option>
                        </select>
                      </td>

                      {/* Qualification Score */}
                      <td className="py-3.5 px-4">
                        <div className="w-20">
                          <div className="flex justify-between text-[10px] mb-1 font-mono">
                            <span className="text-slate-400">{lead.score || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                lead.score > 70
                                  ? 'bg-emerald-400'
                                  : lead.score > 40
                                  ? 'bg-amber-400'
                                  : 'bg-blue-400'
                              }`}
                              style={{ width: `${lead.score || 10}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estimated Value */}
                      <td className="py-3.5 px-4 font-mono font-medium text-white">
                        {lead.estimatedValue ? (
                          `$${Number(lead.estimatedValue).toLocaleString()}`
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {lead.status === LeadStatus.QUALIFIED && (
                            <button
                              onClick={() => openConvertModal(lead)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1"
                              title="Atomically Convert Lead to Deal"
                            >
                              <Sparkles className="w-3 h-3" />
                              Convert
                            </button>
                          )}

                          <button
                            onClick={() => openLeadDrawer(lead)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="View Timeline & Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="text-white font-mono">{leads.length}</span> of{' '}
              <span className="text-white font-mono">{totalItems}</span> leads
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white"
              >
                Previous
              </button>
              <span className="font-mono text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: CREATE LEAD WITH LIVE DEDUPLICATION WARNING */}
        {/* ========================================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Create New Lead</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="p-6 space-y-4">
                {/* Live Deduplication Warning Banner */}
                {duplicateWarning && duplicateWarning.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 animate-shake">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Duplicate Lead Warning Detected</div>
                      <div className="mt-0.5 text-amber-200/90">
                        A lead already exists in your CRM matching this email/phone:
                        <ul className="list-disc list-inside mt-1 font-mono text-[11px]">
                          {duplicateWarning.map((m) => (
                            <li key={m.leadId}>
                              {m.firstName} {m.lastName} ({m.companyName || 'No Company'}) • Match: {m.matchType} ({m.confidenceScore}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="e.g. Sarah"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="e.g. Connor"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sarah@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1-555-019-2834"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Cyberdyne Systems"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="Chief Technology Officer"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Source</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    >
                      <option value={LeadSource.WEBSITE}>Website</option>
                      <option value={LeadSource.REFERRAL}>Referral</option>
                      <option value={LeadSource.COLD_OUTREACH}>Cold Outreach</option>
                      <option value={LeadSource.LINKEDIN}>LinkedIn</option>
                      <option value={LeadSource.EVENT}>Event</option>
                      <option value={LeadSource.PAID_AD}>Paid Ad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as LeadPriority })
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    >
                      <option value={LeadPriority.LOW}>Low</option>
                      <option value={LeadPriority.MEDIUM}>Medium</option>
                      <option value={LeadPriority.HIGH}>High</option>
                      <option value={LeadPriority.URGENT}>Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Est. Value ($)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedValue}
                      onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                      placeholder="25000"
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  >
                    Save Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: CSV BULK IMPORT */}
        {/* ========================================================================= */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Bulk Import Leads via CSV</h3>
                    <p className="text-xs text-slate-400">Upload or paste CSV rows with automatic deduplication</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {importResult && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Import Succeeded
                    </div>
                    <div>Total Processed: {importResult.totalRows} rows</div>
                    <div>Imported New: {importResult.imported}</div>
                    <div>Updated Existing: {importResult.updated}</div>
                    <div>Skipped Duplicates: {importResult.skippedDuplicates}</div>
                    {importResult.failed > 0 && <div className="text-rose-400">Failed: {importResult.failed}</div>}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    CSV Data (Header + Data Rows)
                  </label>
                  <button
                    type="button"
                    onClick={loadSampleTemplate}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Load Sample Template
                  </button>
                </div>

                <textarea
                  rows={8}
                  placeholder={`First Name,Last Name,Email,Phone,Company,Job Title,Estimated Value\nSarah,Connor,sarah@cyberdyne.io,+1-555-019-2834,Cyberdyne Systems,COO,50000`}
                  value={importOptions.csvText}
                  onChange={(e) => setImportOptions({ ...importOptions, csvText: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Deduplication Handling Strategy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'SKIP', label: 'Skip Duplicates', desc: 'Preserves existing lead' },
                      { id: 'UPDATE', label: 'Update Existing', desc: 'Overwrites changed values' },
                      { id: 'IMPORT_ANYWAY', label: 'Import Anyway', desc: 'Allows duplicate entry' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setImportOptions({
                            ...importOptions,
                            onDuplicate: opt.id as any,
                          })
                        }
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          importOptions.onDuplicate === opt.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-semibold text-white">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={importing}
                    onClick={handleImportCsv}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Execute CSV Import
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: ATOMIC LEAD-TO-DEAL CONVERSION */}
        {/* ========================================================================= */}
        {showConvertModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Convert Lead to Opportunity</h3>
                    <p className="text-xs text-slate-400">Atomic ACID transaction creating Contact, Company, and Deal</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConvertLead} className="p-6 space-y-4">
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                  <div className="font-semibold text-white">Target Relational Entities Created:</div>
                  <div>• Contact: <span className="text-white font-mono">{selectedLead.firstName} {selectedLead.lastName}</span> ({selectedLead.email || 'No email'})</div>
                  <div>• Company: <span className="text-white font-mono">{selectedLead.companyName || 'Independent'}</span></div>
                  <div>• Status: Lead marked as <span className="font-bold text-purple-400">CONVERTED</span></div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Deal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={convertForm.dealTitle}
                    onChange={(e) => setConvertForm({ ...convertForm, dealTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Deal Monetary Value ($) *
                    </label>
                    <input
                      type="number"
                      required
                      value={convertForm.dealAmount}
                      onChange={(e) => setConvertForm({ ...convertForm, dealAmount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      value={convertForm.expectedCloseDate}
                      onChange={(e) =>
                        setConvertForm({ ...convertForm, expectedCloseDate: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Complete Conversion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DRAWER: LEAD DETAILS & STATUS TIMELINE */}
        {/* ========================================================================= */}
        {showDetailDrawer && selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl animate-slide-left">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(
                        selectedLead.status,
                      )}`}
                    >
                      {selectedLead.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedLead.companyName || 'No Company'} • {selectedLead.jobTitle || 'Lead'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLead.status === LeadStatus.QUALIFIED && (
                    <button
                      onClick={() => openConvertModal(selectedLead)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 shadow-md shadow-purple-600/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Convert to Deal
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailDrawer(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Stepper Progression */}
              <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800">
                <div className="text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider font-mono">
                  Lifecycle Progression
                </div>
                <div className="flex items-center justify-between">
                  {[LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.CONVERTED].map(
                    (step, idx, arr) => {
                      const isCurrent = selectedLead.status === step;
                      const order = [
                        LeadStatus.NEW,
                        LeadStatus.CONTACTED,
                        LeadStatus.QUALIFIED,
                        LeadStatus.CONVERTED,
                      ];
                      const currentIdx = order.indexOf(selectedLead.status);
                      const isPast = currentIdx >= idx;

                      return (
                        <React.Fragment key={step}>
                          <button
                            onClick={() => handleQuickStatusChange(selectedLead.id, step)}
                            className={`flex flex-col items-center group`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
                                  : isPast
                                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-700'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1 font-medium ${
                                isCurrent
                                  ? 'text-indigo-400 font-bold'
                                  : isPast
                                  ? 'text-slate-300'
                                  : 'text-slate-500'
                              }`}
                            >
                              {step}
                            </span>
                          </button>
                          {idx < arr.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 mx-2 ${
                                isPast && currentIdx > idx ? 'bg-indigo-600' : 'bg-slate-800'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Information Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block mb-0.5">Email</span>
                    <span className="text-white font-mono">{selectedLead.email || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block mb-0.5">Phone</span>
                    <span className="text-white font-mono">{selectedLead.phone || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block mb-0.5">Estimated Value</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      ${Number(selectedLead.estimatedValue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block mb-0.5">Priority</span>
                    <span className="text-white font-semibold">{selectedLead.priority}</span>
                  </div>
                </div>

                {/* Timeline and Notes */}
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Activity & Status Transition Timeline
                  </h4>

                  {/* Add Note Input */}
                  <form onSubmit={handleAddNote} className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Log note or conversation takeaway..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Post Note
                      </button>
                    </div>
                  </form>

                  {/* Timeline Stream */}
                  {loadingTimeline ? (
                    <div className="py-8 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-1" />
                      Loading history...
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">No activity yet</div>
                  ) : (
                    <div className="relative pl-6 border-l border-slate-800 space-y-4">
                      {timeline.map((item) => (
                        <div key={item.id} className="relative group">
                          <div
                            className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                              item.type === 'STATUS_CHANGE'
                                ? 'bg-indigo-500'
                                : item.type === 'CONVERSION'
                                ? 'bg-purple-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">{item.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-400 mt-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                              {item.description}
                            </p>
                          )}
                          {item.performedBy && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              By {item.performedBy.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: DUPLICATE CLUSTERS SCANNER */}
        {/* ========================================================================= */}
        {showDuplicatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">CRM Duplicate Scanner</h3>
                    <p className="text-xs text-slate-400">Scanned organization database for shared emails & phones</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDuplicatesModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {duplicateClusters.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-slate-300">Clean Database</div>
                    Zero duplicate clusters found across your leads database!
                  </div>
                ) : (
                  duplicateClusters.map((cluster, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-semibold text-amber-400">
                          {cluster.criteria}: {cluster.value}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {cluster.leadCount} duplicate leads
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {cluster.leads.map((l: any) => (
                          <div
                            key={l.id}
                            className="text-xs text-slate-300 flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/60"
                          >
                            <span>
                              {l.firstName} {l.lastName} • {l.companyName || 'No Company'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Created: {new Date(l.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
