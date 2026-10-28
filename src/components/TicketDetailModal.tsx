import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Flame,
  Clock,
  User,
  Wrench,
  CheckCircle2,
  Calendar,
  Building,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Send,
  Star,
} from 'lucide-react';
import { PriorityLevel, Technician, Ticket, TicketStatus } from '../types';
import { formatTimeRemaining } from '../utils/triage';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  technicians: Technician[];
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, note?: string) => void;
  onAssignTechnician: (ticketId: string, techId: string) => void;
  onOverridePriority: (ticketId: string, newPriority: PriorityLevel, reason: string) => void;
  onAddNote: (ticketId: string, note: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  technicians,
  onClose,
  onUpdateStatus,
  onAssignTechnician,
  onOverridePriority,
  onAddNote,
}) => {
  if (!ticket) return null;

  const [newNote, setNewNote] = useState('');
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>(ticket.priority);
  const [overrideReason, setOverrideReason] = useState(ticket.overrideReason || '');
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  const remaining = formatTimeRemaining(ticket.slaDeadline, ticket.status);

  const handleStatusChange = (newStatus: TicketStatus) => {
    onUpdateStatus(ticket.id, newStatus);
  };

  const handleSaveOverride = () => {
    if (!overrideReason.trim()) return;
    onOverridePriority(ticket.id, overridePriority, overrideReason);
    setShowOverrideForm(false);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(ticket.id, newNote);
    setNewNote('');
  };

  const statusSteps: TicketStatus[] = ['submitted', 'triaged', 'dispatched', 'in_progress', 'resolved', 'closed'];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">
                {ticket.ticketNumber}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityStyle(ticket.priority)}`}>
                {ticket.priority} · {ticket.priority === 'P0' ? 'Immediate Hazard' : ticket.priority === 'P1' ? 'High Urgency' : ticket.priority === 'P2' ? 'Standard' : 'Routine'}
              </span>
              {ticket.manualPriorityOverride && (
                <span className="text-[11px] text-amber-700 font-medium">
                  (Overridden from {ticket.triageBreakdown.computedPriority})
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{ticket.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{ticket.hostelBlock}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">{ticket.roomNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span>Logged {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Progression Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-600 mb-3">Workflow Lifecycle State:</div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {statusSteps.map((step, idx) => {
                const currentIdx = statusSteps.indexOf(ticket.status);
                const isPassed = idx <= currentIdx;
                const isCurrent = step === ticket.status;

                return (
                  <button
                    key={step}
                    onClick={() => handleStatusChange(step)}
                    className={`p-2 rounded-lg text-left text-xs transition-colors border ${
                      isCurrent
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : isPassed
                        ? 'bg-white text-slate-900 border-slate-300 font-medium'
                        : 'bg-transparent text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wide opacity-80">Step {idx + 1}</div>
                    <div className="capitalize truncate mt-0.5">{step.replace('_', ' ')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SLA Countdown & Health Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Resolution SLA Policy</div>
              <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums font-mono">
                {ticket.slaTargetHours} Hours SLA Target
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Deadline: {new Date(ticket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                {new Date(ticket.slaDeadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Current Time Remaining</div>
              <div
                className={`text-sm font-bold mt-1 tabular-nums font-mono ${
                  ticket.status === 'resolved' || ticket.status === 'closed'
                    ? 'text-emerald-700'
                    : remaining.isBreached
                    ? 'text-rose-700'
                    : remaining.isUrgent
                    ? 'text-amber-700'
                    : 'text-slate-900'
                }`}
              >
                {remaining.text}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {remaining.isBreached ? 'Breached hostel service charter' : 'Within contractual response envelope'}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs text-slate-500">Impact Assessment</div>
              <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                {ticket.affectedResidentCount} Resident{ticket.affectedResidentCount > 1 ? 's' : ''} Affected
              </div>
              <div className="text-xs text-slate-500 mt-1 capitalize">
                Scope: {ticket.scope.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* 2-Column: Left: Details & Algorithm Math / Right: Technician & Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Resident Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Reported Problem Details
                </h4>
                <p className="mt-2 text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {ticket.description}
                </p>
              </div>

              {/* Triage Priority Scoring Algorithm Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900">
                    Algorithmic Triage Score Breakdown
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                    Total: {ticket.triageBreakdown.totalScore} / 100
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {ticket.triageBreakdown.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-slate-400">·</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Manual Override Action */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  {!showOverrideForm ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Need to adjust priority based on physical inspection?
                      </span>
                      <button
                        onClick={() => setShowOverrideForm(true)}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        Override Priority
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-800">
                        Caretaker Priority Override
                      </div>
                      <div className="flex items-center gap-2">
                        {(['P0', 'P1', 'P2', 'P3'] as PriorityLevel[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setOverridePriority(p)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md border ${
                              overridePriority === p
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="State justification (e.g. Elderly warden inspection, exam tomorrow)..."
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-md focus:outline-hidden"
                      />
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowOverrideForm(false)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveOverride}
                          className="px-3 py-1 bg-slate-900 text-white rounded-md font-medium"
                        >
                          Save Override
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resident Verification Section (if resolved or closed) */}
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-semibold text-emerald-950">
                      Resident Verification Status
                    </span>
                  </div>
                  {ticket.studentVerified ? (
                    <div className="mt-2 text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Rating:</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (ticket.studentRating || 5)
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {ticket.studentFeedback && (
                        <p className="italic text-slate-600">"{ticket.studentFeedback}"</p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-600">
                      Work completed by caretaker. Pending student verification confirmation in resident portal.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column (5 cols): Technician Assign & Activity History */}
            <div className="lg:col-span-5 space-y-5">
              {/* Technician Assignment Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900">
                    Assigned Maintenance Crew
                  </h4>
                  <Wrench className="w-4 h-4 text-slate-400" />
                </div>

                {ticket.assignedTechnicianName ? (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="font-semibold text-xs text-slate-900">
                      {ticket.assignedTechnicianName}
                    </div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      Trade: {ticket.assignedTechnicianTrade?.replace('_', ' ')}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-600 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                    No crew member assigned yet. Select a technician below:
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1">
                    Change / Assign Technician:
                  </label>
                  <select
                    value={ticket.assignedTechnicianId || ''}
                    onChange={(e) => {
                      if (e.target.value) onAssignTechnician(ticket.id, e.target.value);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="" disabled>
                      Select technician...
                    </option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.trade} · {tech.activeTicketsCount} active jobs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Activity Audit Trail */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-900 mb-3">
                  Activity Audit Trail
                </h4>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {ticket.activityLogs.map((log) => (
                    <div key={log.id} className="text-xs border-l-2 border-slate-300 pl-2.5 py-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{log.author}</span>
                        <span className="font-mono tabular-nums">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 mt-0.5">{log.action}</div>
                      {log.note && <div className="text-slate-600 mt-0.5">{log.note}</div>}
                    </div>
                  ))}
                </div>

                {/* Add caretaker note form */}
                <form onSubmit={handleAddNoteSubmit} className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add operational note / part used..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={!newNote.trim()}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-slate-800 transition-colors"
                    >
                      Log
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current status: <span className="font-semibold capitalize text-slate-800">{ticket.status.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Close
            </button>
            {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
              <button
                onClick={() => handleStatusChange('resolved')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Mark as Resolved
              </button>
            ) : ticket.status === 'resolved' ? (
              <button
                onClick={() => handleStatusChange('closed')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close Ticket
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
