'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  Smartphone,
  Star,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Edit2,
  Trash2,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Layers,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/lib/api-client';
import { toast } from 'sonner';
import { ContactStatsDto, PaginatedResult } from '@crm/shared-types';

export default function ContactsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State
  const [contacts, setContacts] = useState<any[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [stats, setStats] = useState<ContactStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Drawers state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'deals' | 'activities'>('overview');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobilePhone: '',
    jobTitle: '',
    department: '',
    companyId: '',
    isPrimary: false,
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobilePhone: '',
    jobTitle: '',
    department: '',
    companyId: '',
    isPrimary: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch Companies for dropdowns
  const fetchCompaniesList = async () => {
    try {
      const res = await apiRequest<PaginatedResult<any>>('/companies?limit=100');
      setCompaniesList(res.items || []);
    } catch {
      // Ignore
    }
  };

  // Fetch Contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (companyFilter) params.set('companyId', companyFilter);

      const data = await apiRequest<PaginatedResult<any>>(`/contacts?${params.toString()}`);
      setContacts(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  }, [page, search, companyFilter]);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const data = await apiRequest<ContactStatsDto>('/contacts/stats');
      setStats(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
      fetchStats();
      fetchCompaniesList();
    }
  }, [isAuthenticated, fetchContacts]);

  // Open Contact details drawer
  const openContactDetails = async (contactId: string) => {
    setShowDetailsDrawer(true);
    setLoadingContact(true);
    setActiveDrawerTab('overview');
    try {
      const data = await apiRequest<any>(`/contacts/${contactId}`);
      setSelectedContact(data);
    } catch {
      toast.error('Failed to load contact intelligence');
    } finally {
      setLoadingContact(false);
    }
  };

  // Create Contact
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          companyId: formData.companyId || undefined,
        }),
      });
      toast.success('Contact created successfully!');
      setShowCreateModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobilePhone: '',
        jobTitle: '',
        department: '',
        companyId: '',
        isPrimary: false,
      });
      fetchContacts();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create contact');
    }
  };

  // Open Edit Modal
  const openEditModal = (contact: any) => {
    setEditFormData({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      mobilePhone: contact.mobilePhone || '',
      jobTitle: contact.jobTitle || '',
      department: contact.department || '',
      companyId: contact.companyId || '',
      isPrimary: contact.isPrimary || false,
    });
    setShowEditModal(true);
  };

  // Update Contact
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/contacts/${editFormData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.phone || undefined,
          mobilePhone: editFormData.mobilePhone || undefined,
          jobTitle: editFormData.jobTitle || undefined,
          department: editFormData.department || undefined,
          companyId: editFormData.companyId || null,
          isPrimary: editFormData.isPrimary,
        }),
      });
      toast.success('Contact updated successfully!');
      setShowEditModal(false);
      fetchContacts();
      fetchStats();
      if (selectedContact?.id === editFormData.id) {
        openContactDetails(editFormData.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update contact');
    }
  };

  // Delete Contact
  const handleDeleteContact = async (contactId: string, name: string) => {
    if (!confirm(`Are you sure you want to archive contact "${name}"?`)) return;
    try {
      await apiRequest(`/contacts/${contactId}`, { method: 'DELETE' });
      toast.success('Contact archived successfully');
      if (selectedContact?.id === contactId) {
        setShowDetailsDrawer(false);
      }
      fetchContacts();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete contact');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Contacts Directory</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Phase 3 Enterprise Contacts
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage executive contacts, primary account liaisons, and cross-entity activity intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              New Contact
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" /> TOTAL CONTACTS
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats?.totalContacts ?? totalItems}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" /> PRIMARY CONTACTS
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {stats?.primaryContacts ?? 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" /> LINKED TO COMPANY
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {stats?.contactsWithCompany ?? 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-purple-400" /> UNLINKED CONTACTS
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {(stats?.totalContacts ?? totalItems) - (stats?.contactsWithCompany ?? 0)}
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email, phone, job title..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Companies</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchContacts();
                fetchStats();
              }}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh directory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Contact Name</th>
                  <th className="px-4 py-3.5">Role & Status</th>
                  <th className="px-4 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                        Loading contacts directory...
                      </div>
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-300">No contacts found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try modifying your search or add a new contact above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => openContactDetails(contact.id)}
                    >
                      {/* Name & Avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm ring-1 ring-white/10 shrink-0">
                            {getInitials(contact.firstName, contact.lastName)}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                              {contact.firstName} {contact.lastName}
                              {contact.isPrimary && (
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {contact.jobTitle || 'No title set'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Primary Contact Status */}
                      <td className="px-4 py-3">
                        {contact.isPrimary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Star className="w-3 h-3 fill-amber-400" />
                            Primary
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                            Standard
                          </span>
                        )}
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        {contact.company ? (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium truncate max-w-[140px]">
                              {contact.company.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No company linked</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 truncate max-w-[180px]"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3">
                        {contact.phone || contact.mobilePhone ? (
                          <a
                            href={`tel:${contact.phone || contact.mobilePhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{contact.phone || contact.mobilePhone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-slate-400">
                        {contact.department || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openContactDetails(contact.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="View Contact Intelligence"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(contact)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="Edit Contact"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteContact(contact.id, `${contact.firstName} ${contact.lastName}`)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Archive Contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Showing {contacts.length > 0 ? (page - 1) * 15 + 1 : 0} to{' '}
              {Math.min(page * 15, totalItems)} of {totalItems} contacts
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-300 font-mono">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE CONTACT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Create New Contact</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jenkins"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="s.jenkins@acme.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-9988"
                    value={formData.mobilePhone}
                    onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="Chief Technology Officer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Engineering / Product"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Associated Company
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No Company Attached</option>
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.domain ? `(${c.domain})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      Designate as Primary Contact
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Making this the primary contact will automatically demote any previous primary contact for this company.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-colors"
                >
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CONTACT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Edit Contact Details</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={editFormData.mobilePhone}
                    onChange={(e) => setEditFormData({ ...editFormData, mobilePhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.jobTitle}
                    onChange={(e) => setEditFormData({ ...editFormData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Associated Company
                </label>
                <select
                  value={editFormData.companyId}
                  onChange={(e) => setEditFormData({ ...editFormData, companyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No Company Attached</option>
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.domain ? `(${c.domain})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isPrimary}
                    onChange={(e) => setEditFormData({ ...editFormData, isPrimary: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      Designate as Primary Contact
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Will promote this contact and demote others for this company.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACT DETAILS SLIDE-OVER DRAWER */}
      {showDetailsDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Drawer Top Bar */}
            <div className="p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Contact Intelligence Profile</h2>
              </div>
              <button
                onClick={() => setShowDetailsDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingContact || !selectedContact ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                Loading contact profile...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Header Hero */}
                <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/20 border border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-600/20 ring-1 ring-white/10 shrink-0">
                      {getInitials(selectedContact.firstName, selectedContact.lastName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">
                          {selectedContact.firstName} {selectedContact.lastName}
                        </h3>
                        {selectedContact.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Star className="w-3 h-3 fill-amber-400" /> Primary Liaison
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">
                        {selectedContact.jobTitle || 'Executive Contact'}
                      </div>
                      {selectedContact.company && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{selectedContact.company.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(selectedContact)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Quick Action Ribbon */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="p-3 rounded-xl bg-slate-900/70 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/30 flex items-center gap-2.5 text-xs text-slate-200 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <div className="truncate">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Email</div>
                      <div className="truncate font-medium">{selectedContact.email}</div>
                    </div>
                  </a>

                  {selectedContact.phone || selectedContact.mobilePhone ? (
                    <a
                      href={`tel:${selectedContact.phone || selectedContact.mobilePhone}`}
                      className="p-3 rounded-xl bg-slate-900/70 hover:bg-emerald-600/10 border border-slate-800 hover:border-emerald-500/30 flex items-center gap-2.5 text-xs text-slate-200 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Phone</div>
                        <div className="font-medium">
                          {selectedContact.phone || selectedContact.mobilePhone}
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 flex items-center gap-2.5 text-xs text-slate-500">
                      <Phone className="w-4 h-4 text-slate-600" />
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase font-semibold">Phone</div>
                        <div>No phone on file</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setActiveDrawerTab('overview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeDrawerTab === 'overview'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveDrawerTab('deals')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      activeDrawerTab === 'deals'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Deals ({selectedContact.deals?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveDrawerTab('activities')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      activeDrawerTab === 'activities'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Timeline ({selectedContact.activities?.length || 0})
                  </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 mb-1">DEPARTMENT</div>
                        <div className="font-semibold text-slate-200">
                          {selectedContact.department || 'Not specified'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 mb-1">MOBILE PHONE</div>
                        <div className="font-semibold text-slate-200">
                          {selectedContact.mobilePhone || 'None'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 mb-1">ORGANIZATION CREATION</div>
                        <div className="font-semibold text-slate-200">
                          {new Date(selectedContact.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
                        <div className="text-[11px] text-slate-400 mb-1">LAST MODIFIED</div>
                        <div className="font-semibold text-slate-200">
                          {new Date(selectedContact.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Company Details if present */}
                    {selectedContact.company && (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Associated Company
                            </h4>
                          </div>
                          <button
                            onClick={() => router.push('/companies')}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            View in Companies
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 text-[11px]">Company Name: </span>
                            <span className="text-slate-200 font-medium">
                              {selectedContact.company.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px]">Domain: </span>
                            <span className="text-slate-200 font-medium">
                              {selectedContact.company.domain || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px]">Industry: </span>
                            <span className="text-slate-200 font-medium">
                              {selectedContact.company.industry || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px]">Company Phone: </span>
                            <span className="text-slate-200 font-medium">
                              {selectedContact.company.phone || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DEALS */}
                {activeDrawerTab === 'deals' && (
                  <div className="space-y-3">
                    {selectedContact.deals?.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                        No active deals attached directly to this contact yet.
                      </div>
                    ) : (
                      selectedContact.deals?.map((deal: any) => (
                        <div
                          key={deal.id}
                          className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{deal.title}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                              <span className="font-mono text-emerald-400 font-semibold">
                                {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: deal.currency || 'USD',
                                }).format(deal.amount)}
                              </span>
                              <span>•</span>
                              <span>Status: {deal.status}</span>
                            </div>
                          </div>

                          {deal.stage && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                backgroundColor: `${deal.stage.color || '#6366f1'}20`,
                                color: deal.stage.color || '#818cf8',
                                border: `1px solid ${deal.stage.color || '#6366f1'}40`,
                              }}
                            >
                              {deal.stage.name}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 4: ACTIVITIES */}
                {activeDrawerTab === 'activities' && (
                  <div className="space-y-3">
                    {selectedContact.activities?.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                        No recent interaction history recorded for this contact.
                      </div>
                    ) : (
                      selectedContact.activities?.map((act: any) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3"
                        >
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{act.title}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(act.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {act.description && (
                              <p className="text-slate-400 text-[11px] mt-0.5">{act.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span className="uppercase font-semibold">{act.type}</span>
                              <span>•</span>
                              <span>Status: {act.status}</span>
                              {act.assignedTo && (
                                <>
                                  <span>•</span>
                                  <span>
                                    By {act.assignedTo.firstName} {act.assignedTo.lastName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
