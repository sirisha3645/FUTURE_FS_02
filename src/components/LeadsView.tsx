import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import { Lead, LeadSource, LeadStatus } from '../types';
import { getFriendlyErrorMessage } from '../utils/firebase';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Sparkles,
  Loader,
  X,
  Phone,
  Mail,
  Building,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface LeadsViewProps {
  onSelectLead: (leadId: string) => void;
  shouldRefreshTrigger: boolean;
  onRefreshTriggered: () => void;
  autoOpenCreate?: boolean;
  onAutoOpenConsumed?: () => void;
}

export default function LeadsView({ 
  onSelectLead, 
  shouldRefreshTrigger, 
  onRefreshTriggered,
  autoOpenCreate,
  onAutoOpenConsumed
}: LeadsViewProps) {
  // State for query metrics
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter criteria
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSource, setFormSource] = useState<LeadSource>('Website');
  const [formStatus, setFormStatus] = useState<LeadStatus>('New');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch leads handler
  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.leads.list({
        search,
        source: source !== 'All' ? source : undefined,
        status: status !== 'All' ? status : undefined,
        sortBy,
        page,
        limit: 10
      });
      setLeads(res.leads);
      setTotalPages(res.pagination.totalPages);
      setPage(res.pagination.page);
      setTotalLeads(res.pagination.totalLeads);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch CRM directories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
    if (shouldRefreshTrigger) {
      // Clear refresh request trigger hook
      onRefreshTriggered();
    }
  }, [search, source, status, sortBy, page, shouldRefreshTrigger]);

  useEffect(() => {
    if (autoOpenCreate && onAutoOpenConsumed) {
      handleOpenAdd();
      onAutoOpenConsumed();
    }
  }, [autoOpenCreate]);

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingLead(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormSource('Website');
    setFormStatus('New');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation(); // prevent triggering row click
    setEditingLead(lead);
    setFormName(lead.name);
    setFormEmail(lead.email);
    setFormPhone(lead.phone);
    setFormCompany(lead.company);
    setFormSource(lead.source);
    setFormStatus(lead.status);
    setFormNotes(''); // we edit note inside detail page primarily
    setIsModalOpen(true);
  };

  // Submit modal form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Lead Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLead) {
        // Edit core metrics
        await API.leads.update(editingLead.id, {
          name: formName,
          email: formEmail,
          phone: formPhone,
          company: formCompany,
          source: formSource,
          status: formStatus
        });
      } else {
        // Add new record
        await API.leads.create({
          name: formName,
          email: formEmail,
          phone: formPhone,
          company: formCompany,
          source: formSource,
          status: formStatus,
          notes: formNotes
        });
      }
      setIsModalOpen(false);
      loadLeads();
    } catch (err: any) {
      alert(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete lead handler
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent row click triggers
    if (confirm('Are you sure you want to delete this lead record irrevocably?')) {
      try {
        await API.leads.delete(id);
        loadLeads();
      } catch (err: any) {
        alert(getFriendlyErrorMessage(err));
      }
    }
  };

  // Export to CSV function (Bonus feature!)
  const exportToCSV = () => {
    if (leads.length === 0) {
      alert('No lead records loaded to export.');
      return;
    }

    // Prepare headers
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'CreatedAt', 'UpdatedAt', 'NotesCount'];
    
    // Process csv records
    const rows = leads.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.phone.replace(/"/g, '""')}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      l.source,
      l.status,
      l.createdAt,
      l.updatedAt,
      l.notes.length
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ClientSphere_Leads_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sources: LeadSource[] = ['Website', 'Portfolio', 'LinkedIn', 'Referral', 'Facebook', 'Instagram', 'Other'];
  const statuses: LeadStatus[] = ['New', 'Contacted', 'Converted'];

  return (
    <div id="leads-view" className="space-y-6">
      
      {/* 1. Header directory card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Leads Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            {totalLeads} total records gathered from web contact forms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-export-csv"
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV Export
          </button>
          <button
            id="btn-trigger-add"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/15 text-center transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Lead Record
          </button>
        </div>
      </div>

      {/* 2. Search & Filters widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        {/* Searchbar text input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            id="leads-search-input"
            type="text"
            placeholder="Search lead inquiries by name, email, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>

        {/* Source selector */}
        <div>
          <select
            id="leads-filter-source"
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          >
            <option value="All">All Sources</option>
            {sources.map((src) => <option key={src} value={src}>{src}</option>)}
          </select>
        </div>

        {/* Status selector */}
        <div>
          <select
            id="leads-filter-status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          >
            <option value="All">All Statuses</option>
            {statuses.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>

      {/* Sorted view selectors */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-sans px-1">
        <div>
          Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{leads.length}</span> out of {totalLeads} matching
        </div>
        <div className="flex items-center gap-1.5">
          <span>Sort:</span>
          <select
            id="leads-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest')}
            className="bg-transparent text-violet-500 dark:text-violet-400 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* 3. Main directory table */}
      {loading ? (
        <div className="p-24 text-center">
          <Loader className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-500 text-xs">Reloading directory ledger...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-16 rounded-2xl text-center shadow-sm">
          <span className="text-3xl">🗂️</span>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md mt-3">No matching leads found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, source filter, or click "Add Lead" to compile a fresh folder profile.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5 text-left font-semibold">Lead Details</th>
                  <th className="py-3 px-4 font-semibold">Business/Company</th>
                  <th className="py-3 px-4 font-semibold">Origin Source</th>
                  <th className="py-3 px-4 font-semibold">Funnel Status</th>
                  <th className="py-3 px-4 font-semibold">Follow-Ups</th>
                  <th className="py-3 px-5 text-right font-semibold">Action Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-sans">
                {leads.map((lead) => {
                  return (
                    <tr
                      id={`lead-row-${lead.id}`}
                      key={lead.id}
                      onClick={() => onSelectLead(lead.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-150 cursor-pointer group"
                    >
                      {/* Name & contact details */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-[13px] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {lead.name}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1 font-mono text-[10px] text-slate-400">
                          {lead.email && (
                            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-500" /> {lead.email}</span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" /> {lead.phone}</span>
                          )}
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="py-4 px-4">
                        {lead.company ? (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.company}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      {/* Origin Source */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide border border-violet-150 dark:border-violet-900/10">
                          {lead.source}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                          lead.status === 'New'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30'
                            : lead.status === 'Contacted'
                            ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900/30'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30'
                        }`}>
                          ● {lead.status}
                        </span>
                      </td>

                      {/* Follow-Ups Count */}
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                          {lead.notes.length} notes
                        </span>
                      </td>

                      {/* Control controls */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                          <button
                            id={`btn-manage-leads-${lead.id}`}
                            onClick={() => onSelectLead(lead.id)}
                            className="p-1 px-2.5 bg-violet-500/5 hover:bg-violet-600/10 hover:text-violet-600 dark:hover:text-violet-400 dark:hover:bg-violet-900/20 text-slate-400 text-[10px] font-bold tracking-wider uppercase border border-slate-100 dark:border-slate-800/80 rounded-lg transition-all cursor-pointer"
                          >
                            Timeline
                          </button>
                          <button
                            id={`btn-edit-lead-${lead.id}`}
                            onClick={(e) => handleOpenEdit(e, lead)}
                            className="p-2 bg-slate-50 dark:bg-slate-850 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-slate-400 hover:text-violet-500 dark:text-slate-500 dark:hover:text-violet-400 rounded-lg border border-slate-105 dark:border-slate-800/80 transition-all cursor-pointer"
                            title="Edit Core Info"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-lead-${lead.id}`}
                            onClick={(e) => handleDelete(e, lead.id)}
                            className="p-2 bg-slate-50 dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg border border-slate-105 dark:border-slate-800/80 transition-all cursor-pointer"
                            title="Delete Lead Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination widgets section */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Page <strong className="text-slate-650 dark:text-slate-300">{page}</strong> of {totalPages}
              </span>
              <div className="inline-flex items-center gap-1.5">
                <button
                  id="btn-pagination-prev"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl text-slate-500 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="btn-pagination-next"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl text-slate-500 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. CRUD Dynamic frosted modal form */}
      {isModalOpen && (
        <div id="leads-modal" className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto animate-zoom-in text-slate-800 dark:text-slate-100">
            <button
              id="btn-modal-close"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-505 bg-clip-text text-transparent inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-500" />
              {editingLead ? 'Update Customer Profile' : 'Initiate Customer Prospect'}
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
              {editingLead ? `Modifying file values for ${editingLead.name}.` : 'Create a fresh entry from inbound or referral information.'}
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Lead Full Name *
                  </label>
                  <input
                    id="form-lead-name"
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="form-lead-email"
                    type="email"
                    placeholder="sarah@corp.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone Contact
                  </label>
                  <input
                    id="form-lead-phone"
                    type="text"
                    placeholder="+1 555-0100"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Company Name
                  </label>
                  <input
                    id="form-lead-company"
                    type="text"
                    placeholder="Apex Designs"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Acquisition Source
                  </label>
                  <select
                    id="form-lead-source"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as LeadSource)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    {sources.map((src) => <option key={src} value={src}>{src}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Initial Funnel Status
                  </label>
                  <select
                    id="form-lead-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as LeadStatus)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    {statuses.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              {!editingLead && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Initial Follow-Up Note (Optional)
                  </label>
                  <textarea
                    id="form-lead-notes"
                    rows={3}
                    placeholder="Inquiry text received or discovery feedback details..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-sans"
                  ></textarea>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6">
                <button
                  id="btn-form-cancel"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-350 transition-all cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  id="btn-form-save"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-semibold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 rounded-xl transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Commit Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
