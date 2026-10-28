import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  Clock,
  Wrench,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  ChevronRight,
  User,
  Zap,
  Droplets,
  Wifi,
  Armchair,
  Fan,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { PriorityLevel, Technician, Ticket, TicketCategory, TicketStatus } from '../types';
import { formatTimeRemaining, detectClusters } from '../utils/triage';

interface TriageQueueProps {
  tickets: Ticket[];
  technicians: Technician[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onAssignTechnician: (ticketId: string, techId: string) => void;
  onBatchAssign: (ticketIds: string[], techId: string) => void;
  onBatchUpdateStatus: (ticketIds: string[], status: TicketStatus) => void;
  selectedBlockFilter: string;
  setSelectedBlockFilter: (block: string) => void;
}

export const TriageQueue: React.FC<TriageQueueProps> = ({
  tickets,
  technicians,
  onSelectTicket,
  onUpdateTicketStatus,
  onAssignTechnician,
  onBatchAssign,
  onBatchUpdateStatus,
  selectedBlockFilter,
  setSelectedBlockFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlySlaBreached, setOnlySlaBreached] = useState<boolean>(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [activeClusterKey, setActiveClusterKey] = useState<string | null>(null);

  // Detect active clusters
  const clusters = useMemo(() => detectClusters(tickets), [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Cluster filter if clicked
      if (activeClusterKey) {
        const cluster = clusters.get(activeClusterKey);
        if (cluster && !cluster.tickets.some((ct) => ct.id === t.id)) {
          return false;
        }
      }

      // Block filter
      if (selectedBlockFilter !== 'all' && t.hostelBlock !== selectedBlockFilter) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && t.status !== selectedStatus) {
        return false;
      }

      // SLA Breached filter
      if (onlySlaBreached) {
        const remaining = formatTimeRemaining(t.slaDeadline, t.status);
        if (!remaining.isBreached) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          t.ticketNumber.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.roomNumber.toLowerCase().includes(q) ||
          t.hostelBlock.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort logic: active status first, then by priority score descending
      const statusWeight: Record<TicketStatus, number> = {
        submitted: 5,
        triaged: 4,
        dispatched: 3,
        in_progress: 2,
        resolved: 1,
        closed: 0,
      };
      const diffStatus = statusWeight[b.status] - statusWeight[a.status];
      if (diffStatus !== 0) return diffStatus;

      // Higher triage score comes first
      return b.triageBreakdown.totalScore - a.triageBreakdown.totalScore;
    });
  }, [
    tickets,
    activeClusterKey,
    clusters,
    selectedBlockFilter,
    selectedPriority,
    selectedCategory,
    selectedStatus,
    onlySlaBreached,
    searchQuery,
  ]);

  const toggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map((t) => t.id));
    }
  };

  const toggleSelectTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case 'electrical':
        return <Zap className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'plumbing':
        return <Droplets className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'networking':
        return <Wifi className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'carpentry':
        return <Armchair className="w-4 h-4 text-amber-800 shrink-0" />;
      case 'appliances_cooling':
        return <Fan className="w-4 h-4 text-teal-600 shrink-0" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const getPriorityStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'P0':
        return 'text-rose-700 bg-rose-50 border border-rose-200';
      case 'P1':
        return 'text-amber-800 bg-amber-50 border border-amber-200';
      case 'P2':
        return 'text-sky-800 bg-sky-50 border border-sky-200';
      case 'P3':
        return 'text-slate-700 bg-slate-100 border border-slate-200';
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case 'submitted':
        return 'New Complaint';
      case 'triaged':
        return 'Triaged';
      case 'dispatched':
        return 'Crew Dispatched';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Verified & Closed';
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Cluster Advisory Bar */}
      {clusters.size > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Layers className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-950">
                  Multiple complaints detected in same wing / floor ({clusters.size} clusters)
                </div>
                <div className="text-xs text-amber-800 mt-0.5">
                  Grouping repeated reports avoids redundant crew dispatches for single root causes (e.g. shared switch or main line valve).
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Array.from(clusters.values()).map((cluster) => {
                const isSelected = activeClusterKey === cluster.clusterKey;
                return (
                  <button
                    key={cluster.clusterKey}
                    onClick={() =>
                      setActiveClusterKey(isSelected ? null : cluster.clusterKey)
                    }
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-800 text-white'
                        : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/50'
                    }`}
                  >
                    {cluster.title} ({cluster.count} tickets)
                  </button>
                );
              })}
              {activeClusterKey && (
                <button
                  onClick={() => setActiveClusterKey(null)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 underline"
                >
                  Clear cluster
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, room, description, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400 transition-colors"
            />
          </div>

          {/* Interactive filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority segmented buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {['all', 'P0', 'P1', 'P2', 'P3'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedPriority(lvl)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    selectedPriority === lvl
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl === 'all' ? 'All Priority' : lvl}
                </button>
              ))}
            </div>

            {/* SLA Overdue toggle button */}
            <button
              onClick={() => setOnlySlaBreached(!onlySlaBreached)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                onlySlaBreached
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue / Breached
            </button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Filter by:</span>

          <select
            value={selectedBlockFilter}
            onChange={(e) => setSelectedBlockFilter(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 text-xs"
          >
            <option value="all">All Hostel Blocks</option>
            <option value="Block A · Ramanujan Hall">Block A (Ramanujan)</option>
            <option value="Block B · Aryabhata Hall">Block B (Aryabhata)</option>
            <option value="Block C · Sarojini Hall">Block C (Sarojini)</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 text-xs"
          >
            <option value="all">All Disciplines</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="networking">Wi-Fi & Network</option>
            <option value="appliances_cooling">Cooling & Appliances</option>
            <option value="carpentry">Carpentry & Locks</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">New / Unhandled</option>
            <option value="triaged">Triaged</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {(selectedPriority !== 'all' ||
            selectedCategory !== 'all' ||
            selectedStatus !== 'all' ||
            selectedBlockFilter !== 'all' ||
            onlySlaBreached ||
            searchQuery.trim() !== '' ||
            activeClusterKey !== null) && (
            <button
              onClick={() => {
                setSelectedPriority('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedBlockFilter('all');
                setOnlySlaBreached(false);
                setSearchQuery('');
                setActiveClusterKey(null);
              }}
              className="ml-auto text-slate-500 hover:text-slate-900 underline text-xs"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Batch Actions Bar (visible when items selected) */}
      {selectedTicketIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums">
              {selectedTicketIds.length} tickets selected
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">Batch operations:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onBatchAssign(selectedTicketIds, e.target.value);
                  setSelectedTicketIds([]);
                }
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-md text-xs focus:outline-hidden"
            >
              <option value="" disabled>
                Assign Crew Member...
              </option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} ({tech.trade} · {tech.activeTicketsCount} active)
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                onBatchUpdateStatus(selectedTicketIds, 'dispatched');
                setSelectedTicketIds([]);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              Mark Dispatched
            </button>

            <button
              onClick={() => {
                onBatchUpdateStatus(selectedTicketIds, 'resolved');
                setSelectedTicketIds([]);
              }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors font-medium"
            >
              Mark Resolved
            </button>

            <button
              onClick={() => setSelectedTicketIds([])}
              className="text-slate-400 hover:text-white underline ml-2"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Triage Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredTickets.length > 0 &&
                      selectedTicketIds.length === filteredTickets.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-28">Priority & Score</th>
                <th className="py-3 px-4 min-w-[280px]">Hostel Complaint & Location</th>
                <th className="py-3 px-3 w-32">Discipline</th>
                <th className="py-3 px-3 w-36">SLA Countdown</th>
                <th className="py-3 px-3 w-40">Assigned Crew</th>
                <th className="py-3 px-3 w-28">Status</th>
                <th className="py-3 px-3 w-16 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">No tickets match the selected filters</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try broadening your search criteria or resetting filters
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = selectedTicketIds.includes(ticket.id);
                  const remaining = formatTimeRemaining(ticket.slaDeadline, ticket.status);
                  const priorityClass = getPriorityStyle(ticket.priority);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => toggleSelectTicket(ticket.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Priority Badge & Triage Score */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase inline-block w-fit ${priorityClass}`}
                          >
                            {ticket.priority} · {ticket.priority === 'P0' ? 'Hazard' : ticket.priority === 'P1' ? 'High' : ticket.priority === 'P2' ? 'Medium' : 'Routine'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            Score: {ticket.triageBreakdown.totalScore}/100
                          </span>
                        </div>
                      </td>

                      {/* Complaint Title & Location */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-slate-400 font-medium">
                              {ticket.ticketNumber}
                            </span>
                            <span className="font-semibold text-slate-900 line-clamp-1">
                              {ticket.title}
                            </span>
                          </div>

                          {/* Metadata row with typographic separators */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span>{ticket.hostelBlock}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-slate-700">{ticket.roomNumber}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ticket.scope.replace('_', ' ')}</span>
                            {ticket.hasSafetyHazard && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-rose-600 font-medium flex items-center gap-0.5">
                                  <Flame className="w-3 h-3 inline" /> Safety Risk
                                </span>
                              </>
                            )}
                            {ticket.hasAcademicImpact && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-indigo-600 font-medium">Exam/Study Impact</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          {getCategoryIcon(ticket.category)}
                          <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                        </div>
                      </td>

                      {/* SLA Countdown */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono tabular-nums">
                        {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                          <span className="text-slate-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed
                          </span>
                        ) : remaining.isBreached ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {remaining.text}
                          </span>
                        ) : remaining.isUrgent ? (
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {remaining.text}
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {remaining.text}
                          </span>
                        )}
                      </td>

                      {/* Assigned Crew */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {ticket.assignedTechnicianName ? (
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium">{ticket.assignedTechnicianName}</span>
                          </div>
                        ) : (
                          <span className="text-rose-600 font-medium text-[11px]">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(ticket);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-900 rounded transition-colors"
                          title="Open Triage Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
