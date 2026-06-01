import { useEffect, useState } from 'react';
import { API } from '../utils/api';
import { CRMAnalytics } from '../types';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Loader, 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Calendar, 
  UserCheck, 
  Compass,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AnalyticsView() {
  const [metrics, setMetrics] = useState<CRMAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const data = await API.analytics.get();
        setMetrics(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to establish connection to metrics ledger.');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div id="analytics-loading" className="flex flex-col items-center justify-center p-24 text-center">
        <Loader className="w-10 h-10 animate-spin text-violet-505 mb-4" />
        <p className="text-sm text-slate-505 font-sans">Compiling data metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div id="analytics-error" className="p-8 bg-red-400/5 border border-red-500/10 rounded-2xl text-center max-w-xl mx-auto my-12">
        <span className="text-3xl">🧩</span>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md mt-4">Offline metrics</h3>
        <p className="text-xs text-slate-400 mt-2">{error || 'Data is currently inaccessible.'}</p>
      </div>
    );
  }

  // Color palette for charts
  const RECHARTS_COLORS = {
    sources: ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#64748b'],
    status: {
      New: '#f59e0b',
      Contacted: '#3b82f6',
      Converted: '#10b981'
    }
  };

  const statusColorsArray = [
    RECHARTS_COLORS.status.New,
    RECHARTS_COLORS.status.Contacted,
    RECHARTS_COLORS.status.Converted
  ];

  return (
    <div id="analytics-container" className="space-y-8 animate-fade-in">
      
      {/* 1. Header Information */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Performance Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
          Conversion quotients, acquisition distribution, and historical pipeline logs
        </p>
      </div>

      {/* 2. Conversion & Performance Summary Bento Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Metric Card */}
        <div id="metric-summary-leads" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-violet-500" /> Lead Pipeline Weight
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-3">
            {metrics.totalLeads} total records
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-4 font-sans">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span> {metrics.contactedLeads} active</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> {metrics.newLeads} new</span>
          </div>
        </div>

        {/* Converted clients Card */}
        <div id="metric-summary-conversions" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-emerald-500" /> Conversion Ratio
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-3">
            {metrics.conversionRate}%
          </p>
          <p className="text-xs text-slate-400 mt-4 font-sans leading-relaxed">
            Successfully closed <strong className="text-slate-705 dark:text-slate-300 font-bold">{metrics.convertedLeads}</strong> high tier partnerships from form intakes.
          </p>
        </div>

        {/* Top Funnel Channel Card */}
        <div id="metric-summary-channel" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Compass className="w-4 h-4 text-indigo-500" /> Prime Source
          </div>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-3 truncate" title={metrics.leadsBySource.sort((a,b)=>b.value-a.value)[0]?.name || 'Website'}>
            {metrics.leadsBySource.sort((a, b) => b.value - a.value)[0]?.name || 'Website'} ({metrics.leadsBySource.sort((a,b)=>b.value-a.value)[0]?.value || 0})
          </p>
          <p className="text-xs text-slate-400 mt-4 font-sans uppercase tracking-widest font-semibold flex items-center gap-1">
            Highest incoming channel <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </p>
        </div>

      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie Chart: Lead distribution by Source */}
        <div id="chart-panel-sources" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <PieIcon className="w-4 h-4 text-violet-500" />
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Lead Origin Channels (Source)</span>
          </div>

          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.leadsBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {metrics.leadsBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RECHARTS_COLORS.sources[index % RECHARTS_COLORS.sources.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontFamily: 'Inter sans-serif'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Lead breakdown by Status */}
        <div id="chart-panel-status" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Pipeline Pipeline Distribution (Status)</span>
          </div>

          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.leadsByStatus} barGap={5}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#f8fafc',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {metrics.leadsByStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'New' ? '#f59e0b' : entry.name === 'Contacted' ? '#3b82f6' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Line Chart: Historical Inbound Growth Rate */}
        {metrics.historicalGrowth.length > 0 && (
          <div id="chart-panel-growth" className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Inbound Submission Growth Rate</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.historicalGrowth}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#f8fafc',
                      fontSize: '11px' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
