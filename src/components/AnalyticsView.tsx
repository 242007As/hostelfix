import React from 'react';
import { Download, AlertTriangle, CheckCircle2, Clock, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';
import { Ticket } from '../types';
import { formatTimeRemaining } from '../utils/triage';

interface AnalyticsViewProps {
  tickets: Ticket[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tickets }) => {
  // Compute analytics
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed');

  const p0Count = activeTickets.filter((t) => t.priority === 'P0').length;
  const p1Count = activeTickets.filter((t) => t.priority === 'P1').length;
  const p2Count = activeTickets.filter((t) => t.priority === 'P2').length;
  const p3Count = activeTickets.filter((t) => t.priority === 'P3').length;

  // SLA breach count
  const breachedCount = activeTickets.filter((t) => {
    const res = formatTimeRemaining(t.slaDeadline, t.status);
    return res.isBreached;
  }).length;

  const slaAdherenceRate = totalTickets > 0
    ? Math.round(((totalTickets - breachedCount) / totalTickets) * 100)
    : 100;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  // Block breakdown
  const blockCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    const blockShort = t.hostelBlock.split('·')[0].trim();
    blockCounts[blockShort] = (blockCounts[blockShort] || 0) + 1;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Ticket Number',
      'Title',
      'Hostel Block',
      'Floor',
      'Room',
      'Category',
      'Priority',
      'Triage Score',
      'Status',
      'Assigned Technician',
      'SLA Target (Hours)',
      'Created At',
    ];

    const rows = tickets.map((t) => [
      t.ticketNumber,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.hostelBlock}"`,
      t.floor,
      `"${t.roomNumber}"`,
      t.category,
      t.priority,
      t.triageBreakdown.totalScore,
      t.status,
      `"${t.assignedTechnicianName || 'Unassigned'}"`,
      t.slaTargetHours,
      t.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hostel_maintenance_triage_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Hostel Infrastructure SLA & Health Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational performance metrics, priority distributions, and audit report generation.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Warden Report (CSV)</span>
        </button>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Active Open Complaints</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {activeTickets.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Out of {totalTickets} total logged
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">P0 Hazards & P1 High</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono tabular-nums">
            {p0Count + p1Count}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {p0Count} emergency hazard{p0Count !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">SLA Charter Adherence</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
            {slaAdherenceRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {breachedCount} tickets breached
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Completed & Verified</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {resolvedTickets.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Verified by students
          </div>
        </div>
      </div>

      {/* Chronic Problem Hotspot Warning Card */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <h3 className="text-sm font-bold text-amber-950">
            Predictive Infrastructure Vulnerability: Block B Floor 2
          </h3>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          Repeated plumbing and access-point complaints have clustered around Floor 2 West Wing over the past 48 hours. Field triage suggests water seepage through the ceiling plenum may be impacting conduit cables feeding AP-2B. An integrated plumbing-electrical overhaul is advised.
        </p>
      </div>

      {/* 2-Column Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Complaints by Maintenance Discipline
          </h3>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalTickets) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium text-slate-700">
                      {cat.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Triage Priority Distribution
          </h3>

          <div className="space-y-3">
            {[
              { label: 'P0 · Immediate Hazard (2h SLA)', count: p0Count, color: 'bg-rose-500' },
              { label: 'P1 · High Urgency (8h SLA)', count: p1Count, color: 'bg-amber-500' },
              { label: 'P2 · Standard (24h SLA)', count: p2Count, color: 'bg-sky-500' },
              { label: 'P3 · Routine Scheduled (72h SLA)', count: p3Count, color: 'bg-slate-400' },
            ].map((item) => {
              const totalActive = activeTickets.length || 1;
              const pct = Math.round((item.count / totalActive) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {item.count} tickets
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
