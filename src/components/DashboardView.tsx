import { useEffect, useState } from 'react';
import { API } from '../utils/api';
import { Lead, CRMAnalytics } from '../types';
import { 
  Users, 
  UserPlus, 
  PhoneCall, 
  CheckCircle, 
  Plus, 
  ArrowRight, 
  Calendar, 
  Briefcase,
  TrendingUp,
  Loader
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToLeads: () => void;
  onSelectLead: (leadId: string) => void;
  triggerAddLeadOpen: () => void;
}

export default function DashboardView({
  onNavigateToLeads,
  onSelectLead,
  triggerAddLeadOpen
}: DashboardViewProps) {
  const [metrics, setMetrics] = useState<CRMAnalytics | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        // Load analytics & first batch of leads
        const [analyticsData, leadsData] = await Promise.all([
          API.analytics.get(),
          API.leads.list({ page: 1, limit: 5, sortBy: 'latest' })
        ]);
        setMetrics(analyticsData);
        setRecentLeads(leadsData.leads);
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        setError('Could not establish real-time dashboard connection.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [triggerAddLeadOpen]); // reload when triggers change or modal closes

  if (loading) {
    return (
      <div id="dashboard-loading" className="flex flex-col items-center justify-center p-24 text-center">
        <Loader className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm text-slate-500 font-sans">Connecting to system ledger...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div id="dashboard-error-pane" className="p-8 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col items-center text-center max-w-xl mx-auto my-12">
        <span className="text-3xl mb-4">⚠️</span>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">System ledger offline</h3>
        <p className="text-sm text-slate-500 mt-2">{error || 'Please sign in first.'}</p>
      </div>
    );
  }

  const statCards = [
    {
      id: "card-total",
      title: "Total Leads",
      value: metrics.totalLeads,
      icon: Users,
      color: "from-violet-500 to-indigo-500",
      textColor: "text-violet-600 dark:text-violet-400"
    },
    {
      id: "card-new",
      title: "New Leads",
      value: metrics.newLeads,
      icon: UserPlus,
      color: "from-amber-400 to-orange-500",
      textColor: "text-amber-500 dark:text-amber-400"
    },
    {
      id: "card-contacted",
      title: "Contacted Leads",
      value: metrics.contactedLeads,
      icon: PhoneCall,
      color: "from-sky-400 to-indigo-500",
      textColor: "text-sky-600 dark:text-sky-400"
    },
    {
      id: "card-converted",
      title: "Converted Clients",
      value: metrics.convertedLeads,
      icon: CheckCircle,
      color: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-600 dark:text-emerald-400"
    }
  ];

  return (
    <div id="dashboard-layout" className="space-y-8 animate-fade-in">
      
      {/* 1. Header greeting & quick launch panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100/50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            ClientSphere Admin Hub
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track form-fills, organize client inquiries, and observe your conversions in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-quick-leads-nav"
            onClick={onNavigateToLeads}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-center transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            Leads Folder <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-quick-add-lead"
            onClick={triggerAddLeadOpen}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/15 text-center transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Lead
          </button>
        </div>
      </div>

      {/* 2. Key metrics and status counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              id={card.id}
              key={card.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm hover:shadow-md dark:shadow-slate-950/20 transition-all duration-200 group flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                  {card.title}
                </p>
                <p className="text-3xl font-sans font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-sm`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Midsection: conversion insights banner and leads list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Conversion banner */}
        <div id="conversion-analytics-indicator" className="lg:col-span-1 bg-gradient-to-br from-violet-900 via-indigo-905 to-slate-950 text-slate-100 p-6 rounded-2xl flex flex-col justify-between border border-violet-500/20 relative overflow-hidden shadow-lg h-full min-h-[290px]">
          {/* Decorative ambient ball */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-600/30 rounded-full blur-2xl"></div>
          
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> Target Conversion
            </span>
            <div className="mt-3">
              <span className="block text-[11px] text-violet-300/85 uppercase tracking-wider font-semibold">
                Conversion Rate
              </span>
              <span className="block text-5xl font-extrabold tracking-tight text-white mt-1">
                {metrics.conversionRate}%
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 font-sans leading-relaxed">
              Based on {metrics.convertedLeads} successfully converted clients out of {metrics.totalLeads} total records. Create follow-up records promptly to push further.
            </p>
          </div>

          <div className="mt-6 border-t border-violet-800/40 pt-4 flex justify-between text-xs text-indigo-300/70 font-sans">
            <span>Contacted: <strong className="text-white">{metrics.contactedLeads}</strong></span>
            <span>New Inbox: <strong className="text-white">{metrics.newLeads}</strong></span>
          </div>
        </div>

        {/* Recent leads table */}
        <div id="recent-leads-section" className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Recent Incoming Inquiries
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Form responses gathered sorted by date
              </p>
            </div>
            <button
              id="btn-goto-leads"
              onClick={onNavigateToLeads}
              className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
            >
              See all folder <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLeads.length === 0 ? (
            <div id="no-leads-pane-dashboard" className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-850 rounded-xl">
              <p className="text-slate-400 text-xs">No records available yet.</p>
              <button
                onClick={triggerAddLeadOpen}
                className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-lg transition-all"
              >
                Create First Lead
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-1">Name</th>
                    <th className="py-3">Company</th>
                    <th className="py-3">Source</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {recentLeads.map((lead) => {
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-150">
                        <td className="py-3.5 px-1 font-medium text-slate-900 dark:text-slate-100">
                          {lead.name}
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                          {lead.company || '--'}
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1 bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            {lead.source}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                            lead.status === 'New' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                              : lead.status === 'Contacted'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            id={`btn-dashboard-view-${lead.id}`}
                            onClick={() => onSelectLead(lead.id)}
                            className="p-1 px-2 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300 rounded-lg text-slate-400 hover:scale-105 transition-all text-[11px] font-bold cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
