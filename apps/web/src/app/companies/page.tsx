'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  Filter,
  DollarSign,
  Users,
  Kanban,
  HeartPulse,
  Globe,
  Phone,
  MapPin,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Edit2,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';
import { Account360Dto, CompanyStatsDto, PaginatedResult } from '@crm/shared-types';
import { CustomFieldsSection } from '@/components/custom-fields-section';

export default function CompaniesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState<CompanyStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccount360Modal, setShowAccount360Modal] = useState(false);
  const [account360Data, setAccount360Data] = useState<Account360Dto | null>(null);
  const [loading360, setLoading360] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);

  // Create form
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    annualRevenue: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  // Account edit form
  const [accountEditForm, setAccountEditForm] = useState({
    customerStatus: 'ACTIVE',
    tier: 'STANDARD',
    healthScore: 100,
    mrr: 0,
    contractStartDate: '',
    contractEndDate: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (industryFilter !== 'ALL') params.set('industry', industryFilter);

      const data = await apiRequest<PaginatedResult<any>>(`/companies?${params.toString()}`);
      setCompanies(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, [page, search, industryFilter]);

  const fetchStats = async () => {
    try {
      const data = await apiRequest<CompanyStatsDto>('/companies/stats');
      setStats(data);
    } catch {
      // Ignore silent error
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
      fetchStats();
    }
  }, [isAuthenticated, fetchCompanies]);

  // Open Account 360 View
  const openAccount360 = async (companyId: string) => {
    setShowAccount360Modal(true);
    setLoading360(true);
    setEditingAccount(false);
    try {
      const data = await apiRequest<Account360Dto>(`/companies/${companyId}/account-360`);
      setAccount360Data(data);
      if (data.account) {
        setAccountEditForm({
          customerStatus: data.account.customerStatus,
          tier: data.account.tier,
          healthScore: data.account.healthScore,
          mrr: data.account.mrr,
          contractStartDate: data.account.contractStartDate ? new Date(data.account.contractStartDate).toISOString().split('T')[0] : '',
          contractEndDate: data.account.contractEndDate ? new Date(data.account.contractEndDate).toISOString().split('T')[0] : '',
        });
      }
    } catch (err: any) {
      toast.error('Failed to load Account 360 intelligence');
    } finally {
      setLoading360(false);
    }
  };

  // Create Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/companies', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : undefined,
        }),
      });
      toast.success('Company created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        domain: '',
        industry: '',
        size: '',
        annualRevenue: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      });
      fetchCompanies();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create company');
    }
  };

  // Update Account Intelligence metadata
  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account360Data) return;

    try {
      await apiRequest(`/companies/${account360Data.company.id}/account`, {
        method: 'PUT',
        body: JSON.stringify({
          ...accountEditForm,
          healthScore: Number(accountEditForm.healthScore),
          mrr: Number(accountEditForm.mrr),
        }),
      });
      toast.success('Account 360 intelligence updated!');
      setEditingAccount(false);
      openAccount360(account360Data.company.id);
      fetchCompanies();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account');
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Companies & Accounts Directory</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Phase 3 Account 360°
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage organization accounts, monitor health scores, track recurring revenue, and aggregate cross-entity intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              New Company
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> TOTAL COMPANIES
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats?.totalCompanies ?? totalItems}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ACTIVE ACCOUNTS
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{stats?.activeAccounts ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-indigo-400" /> AVG HEALTH SCORE
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300">{stats?.avgHealthScore ?? 100}/100</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> TOTAL MRR
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">${(stats?.totalMrr ?? 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by company name, domain, city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-500" /> Industry:
                </span>
                <select
                  value={industryFilter}
                  onChange={(e) => {
                    setIndustryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Company Name</th>
                  <th className="py-3.5 px-4">Industry / Domain</th>
                  <th className="py-3.5 px-4">Tier & Status</th>
                  <th className="py-3.5 px-4">Health Score</th>
                  <th className="py-3.5 px-4">MRR</th>
                  <th className="py-3.5 px-4">Key Decision Maker</th>
                  <th className="py-3.5 px-4">Contacts / Deals</th>
                  <th className="py-3.5 px-4 text-right">Account 360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                      Loading companies directory...
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                      <div className="text-sm font-semibold text-slate-300">No companies found</div>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Create your first company profile to start building your Account 360° database.
                      </p>
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => {
                    const health = company.account?.healthScore ?? 100;
                    const primaryContact = company.contacts?.[0];

                    return (
                      <tr
                        key={company.id}
                        onClick={() => openAccount360(company.id)}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      >
                        {/* Company Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                              {company.name[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                {company.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                {company.city && <span>{company.city}, </span>}
                                <span>{company.country || 'Global'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Industry & Domain */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>{company.industry || 'General Industry'}</div>
                          {company.domain && (
                            <span className="text-[11px] font-mono text-indigo-400">
                              {company.domain}
                            </span>
                          )}
                        </td>

                        {/* Tier & Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {company.account?.tier || 'STANDARD'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {company.account?.customerStatus || 'ACTIVE'}
                            </span>
                          </div>
                        </td>

                        {/* Health Score */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${getHealthScoreColor(
                              health,
                            )}`}
                          >
                            <HeartPulse className="w-3 h-3" />
                            {health}%
                          </span>
                        </td>

                        {/* MRR */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          ${Number(company.account?.mrr || 0).toLocaleString()}
                        </td>

                        {/* Primary Contact */}
                        <td className="py-3.5 px-4">
                          {primaryContact ? (
                            <div>
                              <div className="font-medium text-slate-200">
                                {primaryContact.firstName} {primaryContact.lastName}
                              </div>
                              <div className="text-[11px] text-slate-400">{primaryContact.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Counts */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 text-slate-400">
                            <span className="flex items-center gap-1" title="Associated Contacts">
                              <Users className="w-3 h-3 text-indigo-400" />
                              <span className="font-mono">{company._count?.contacts || 0}</span>
                            </span>
                            <span className="flex items-center gap-1" title="Active Deals">
                              <Kanban className="w-3 h-3 text-purple-400" />
                              <span className="font-mono">{company._count?.deals || 0}</span>
                            </span>
                          </div>
                        </td>

                        {/* Action: Open 360 */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openAccount360(company.id)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 ml-auto"
                          >
                            <Sparkles className="w-3 h-3" />
                            Account 360°
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="text-white font-mono">{companies.length}</span> of{' '}
              <span className="text-white font-mono">{totalItems}</span> companies
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
        {/* MODAL 1: CREATE NEW COMPANY */}
        {/* ========================================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Create Company Profile</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Wayne Enterprises"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="wayne.corp"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance & Banking">Finance & Banking</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Aerospace & Defense">Aerospace & Defense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Team Size
                    </label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    >
                      <option value="">Select Size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-1000">201-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Annual Revenue ($)
                    </label>
                    <input
                      type="number"
                      value={formData.annualRevenue}
                      onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                      placeholder="10000000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1-555-019-1000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Gotham"
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="USA"
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Website</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://wayne.corp"
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
                    Save Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: ACCOUNT 360° INTELLIGENCE DRAWER */}
        {/* ========================================================================= */}
        {showAccount360Modal && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl">
              {loading360 ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                </div>
              ) : account360Data ? (
                <>
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {account360Data.company.name[0]}
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          {account360Data.company.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Account 360°
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {account360Data.company.domain || 'No Domain'} • {account360Data.company.industry || 'General Industry'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAccount(!editingAccount)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {editingAccount ? 'Cancel Edit' : 'Edit Account'}
                      </button>
                      <button
                        onClick={() => setShowAccount360Modal(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Quick Account Health & MRR Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase font-mono text-slate-500 mb-1">
                          Health Score
                        </div>
                        <div
                          className={`text-2xl font-bold font-mono ${
                            (account360Data.account?.healthScore ?? 100) >= 80
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {account360Data.account?.healthScore ?? 100}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Customer Health</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase font-mono text-slate-500 mb-1">
                          Monthly Recurring
                        </div>
                        <div className="text-2xl font-bold font-mono text-white">
                          ${(account360Data.account?.mrr ?? 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">MRR Active</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <div className="text-[10px] uppercase font-mono text-slate-500 mb-1">
                          Account Tier
                        </div>
                        <div className="text-2xl font-bold font-mono text-indigo-400">
                          {account360Data.account?.tier ?? 'STANDARD'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{account360Data.account?.customerStatus ?? 'ACTIVE'}</div>
                      </div>
                    </div>

                    {/* Inline Edit Form if toggled */}
                    {editingAccount && (
                      <form
                        onSubmit={handleUpdateAccount}
                        className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3"
                      >
                        <div className="text-xs font-bold text-white mb-1">
                          Update Account 360 Intelligence
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Health Score (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={accountEditForm.healthScore}
                              onChange={(e) =>
                                setAccountEditForm({
                                  ...accountEditForm,
                                  healthScore: Number(e.target.value),
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">MRR ($)</label>
                            <input
                              type="number"
                              value={accountEditForm.mrr}
                              onChange={(e) =>
                                setAccountEditForm({
                                  ...accountEditForm,
                                  mrr: Number(e.target.value),
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                            <select
                              value={accountEditForm.customerStatus}
                              onChange={(e) =>
                                setAccountEditForm({
                                  ...accountEditForm,
                                  customerStatus: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                            >
                              <option value="PROSPECT">PROSPECT</option>
                              <option value="TRIAL">TRIAL</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="CHURNED">CHURNED</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Tier</label>
                            <select
                              value={accountEditForm.tier}
                              onChange={(e) =>
                                setAccountEditForm({ ...accountEditForm, tier: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                            >
                              <option value="STANDARD">STANDARD</option>
                              <option value="PREMIUM">PREMIUM</option>
                              <option value="ENTERPRISE">ENTERPRISE</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingAccount(false)}
                            className="px-3 py-1 rounded-lg text-xs text-slate-400"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
                          >
                            Save Intelligence
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Associated Contacts Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-400" />
                          Associated Contacts ({account360Data.contacts.length})
                        </h4>
                      </div>

                      {account360Data.contacts.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                          No contacts associated yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {account360Data.contacts.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                  {c.firstName[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>
                                      {c.firstName} {c.lastName}
                                    </span>
                                    {c.isPrimary && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                        PRIMARY
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {c.jobTitle || 'Executive'} • {c.email}
                                  </div>
                                </div>
                              </div>

                              {c.phone && (
                                <a
                                  href={`tel:${c.phone}`}
                                  className="text-xs text-indigo-400 hover:underline font-mono"
                                >
                                  {c.phone}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Associated Deals Pipeline Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Kanban className="w-4 h-4 text-purple-400" />
                          Deals Pipeline ({account360Data.deals.count} Deals • $
                          {account360Data.deals.totalValue.toLocaleString()})
                        </h4>
                      </div>

                      {account360Data.deals.items.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                          No active deals for this account.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {account360Data.deals.items.map((d) => (
                            <div
                              key={d.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-semibold text-white">{d.title}</div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                                    style={{
                                      backgroundColor: `${d.stage.color || '#3B82F6'}20`,
                                      color: d.stage.color || '#3B82F6',
                                    }}
                                  >
                                    {d.stage.name}
                                  </span>
                                  <span>Status: {d.status}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-mono font-bold text-emerald-400">
                                  ${d.amount.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {d.expectedCloseDate
                                    ? `Target: ${new Date(d.expectedCloseDate).toLocaleDateString()}`
                                    : 'No close date'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Activities Section */}
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Interaction Stream
                      </h4>

                      {account360Data.activities.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                          No interaction logged yet.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {account360Data.activities.map((a) => (
                            <div
                              key={a.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-white">{a.title}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(a.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {a.description && (
                                <p className="text-slate-400 mt-1">{a.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Custom Fields Section */}
                    <div>
                      <CustomFieldsSection
                        entityType="COMPANY"
                        entityId={account360Data.company.id}
                        title="Company Custom Attributes"
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
