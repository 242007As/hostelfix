import React, { useState } from 'react';
import {
  Send,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Star,
  RotateCcw,
  Zap,
  Droplets,
  Wifi,
  Armchair,
  Fan,
  HelpCircle,
  Camera,
} from 'lucide-react';
import { ImpactScope, PriorityLevel, Ticket, TicketCategory, TicketStatus } from '../types';
import { calculateTriageScore, SLA_HOURS_BY_PRIORITY } from '../utils/triage';

interface StudentPortalProps {
  tickets: Ticket[];
  onSubmitTicket: (newTicketData: {
    title: string;
    description: string;
    category: TicketCategory;
    hostelBlock: string;
    floor: number;
    roomNumber: string;
    isCommonArea: boolean;
    hasSafetyHazard: boolean;
    hasAcademicImpact: boolean;
    affectedResidentCount: number;
    scope: ImpactScope;
  }) => void;
  onVerifyResolution: (ticketId: string, rating: number, feedback: string) => void;
  onReopenTicket: (ticketId: string, reason: string) => void;
  presetRoom?: { block: string; floor: number; room: string } | null;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  tickets,
  onSubmitTicket,
  onVerifyResolution,
  onReopenTicket,
  presetRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'track'>('log');

  // Form State
  const [hostelBlock, setHostelBlock] = useState(presetRoom?.block || 'Block A · Ramanujan Hall');
  const [floor, setFloor] = useState<number>(presetRoom?.floor ?? 2);
  const [roomNumber, setRoomNumber] = useState(presetRoom?.room || 'Room 204');
  const [isCommonArea, setIsCommonArea] = useState(false);
  const [category, setCategory] = useState<TicketCategory>('electrical');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hasSafetyHazard, setHasSafetyHazard] = useState(false);
  const [hasAcademicImpact, setHasAcademicImpact] = useState(false);
  const [scope, setScope] = useState<ImpactScope>('single_resident');
  const [affectedCount, setAffectedCount] = useState<number>(2);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Verification state for feedback modal
  const [verifyingTicketId, setVerifyingTicketId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [reopenReason, setReopenReason] = useState<string>('');
  const [showReopenBox, setShowReopenBox] = useState<string | null>(null);

  // Live Triage Score calculation
  const liveTriage = calculateTriageScore({
    category,
    scope,
    hasSafetyHazard,
    hasAcademicImpact,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSubmitTicket({
      title: title.trim(),
      description: description.trim(),
      category,
      hostelBlock,
      floor,
      roomNumber,
      isCommonArea,
      hasSafetyHazard,
      hasAcademicImpact,
      affectedResidentCount: affectedCount,
      scope,
    });

    setTitle('');
    setDescription('');
    setHasSafetyHazard(false);
    setHasAcademicImpact(false);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setActiveTab('track');
    }, 1500);
  };

  const myRoomTickets = tickets.filter(
    (t) => t.hostelBlock === hostelBlock && t.roomNumber.toLowerCase().includes(roomNumber.toLowerCase().replace('room', '').trim())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Perspective banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Hostel Resident Maintenance Portal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log room issues with instant AI triage scoring or track live progress of your complaints.
          </p>
        </div>

        {/* Segmented Controls for Sub-tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('log')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'log'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            File New Complaint
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'track'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Room Tickets ({myRoomTickets.length})
          </button>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Complaint Logged & Dispatched to Triage!</div>
            <div>Your issue has been automatically scored and assigned an SLA priority.</div>
          </div>
        </div>
      )}

      {activeTab === 'log' ? (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          {/* Location Picker */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              1. Location Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Hostel Block
                </label>
                <select
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="Block A · Ramanujan Hall">Block A · Ramanujan Hall</option>
                  <option value="Block B · Aryabhata Hall">Block B · Aryabhata Hall</option>
                  <option value="Block C · Sarojini Hall">Block C · Sarojini Hall</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Floor</label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value={0}>Ground Floor (0)</option>
                  <option value={1}>1st Floor</option>
                  <option value={2}>2nd Floor</option>
                  <option value={3}>3rd Floor</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Room or Facility
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 or Washroom East"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Issue Category Picker */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              2. Nature of Problem
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'electrical', label: 'Electrical & Power', icon: Zap },
                { id: 'plumbing', label: 'Plumbing & Water', icon: Droplets },
                { id: 'networking', label: 'Wi-Fi & LAN', icon: Wifi },
                { id: 'carpentry', label: 'Doors, Furniture & Locks', icon: Armchair },
                { id: 'appliances_cooling', label: 'Ceiling Fan & Cooler', icon: Fan },
                { id: 'sanitation', label: 'Sanitation & Cleaning', icon: HelpCircle },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as TicketCategory)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description & Impact */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              3. Symptoms & Urgency Factors
            </h3>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Short Summary Title
              </label>
              <input
                type="text"
                placeholder="e.g. Broken Wi-Fi router red light / Sparking switchboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Detailed Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe what happened, exact location in room, and any steps already attempted..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            {/* Smart Triage Multipliers Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-start gap-3 p-3 bg-rose-50/50 border border-rose-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSafetyHazard}
                  onChange={(e) => setHasSafetyHazard(e.target.checked)}
                  className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-semibold text-rose-950 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    Immediate Hazard / Structural Risk
                  </div>
                  <div className="text-[11px] text-rose-800 mt-0.5">
                    Sparks, burning smell, flooding water, or broken door lock compromising room safety.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcademicImpact}
                  onChange={(e) => setHasAcademicImpact(e.target.checked)}
                  className="mt-0.5 rounded border-indigo-300 text-indigo-600 focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-semibold text-indigo-950 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Academic / Exam Disruption
                  </div>
                  <div className="text-[11px] text-indigo-800 mt-0.5">
                    Assignment submission or midterm within 24h requiring functional study desk or Wi-Fi.
                  </div>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Scope of Impact
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as ImpactScope)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="single_resident">Single Student / Desk</option>
                  <option value="shared_room">Entire Shared Room (2-3 roommates)</option>
                  <option value="corridor_wing">Entire Wing / Corridor (10+ rooms)</option>
                  <option value="entire_block">Whole Hostel Block</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Estimated Affected Residents
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Live Algorithmic Triage Preview */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Live Triage Priority Calculator
              </span>
              <span className="font-mono text-emerald-400 font-bold tabular-nums">
                Score: {liveTriage.totalScore}/100
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                  liveTriage.computedPriority === 'P0'
                    ? 'bg-rose-500 text-white'
                    : liveTriage.computedPriority === 'P1'
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {liveTriage.computedPriority} ·{' '}
                {liveTriage.computedPriority === 'P0'
                  ? 'Immediate Hazard'
                  : liveTriage.computedPriority === 'P1'
                  ? 'High Urgency'
                  : liveTriage.computedPriority === 'P2'
                  ? 'Standard'
                  : 'Routine'}
              </span>

              <span className="text-xs text-slate-300 font-mono">
                Guaranteed SLA: {SLA_HOURS_BY_PRIORITY[liveTriage.computedPriority]} Hours Response
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              The automated dispatch system transparently balances safety risks, academic impact, and scope to allocate technician crews.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Complaint for Triage</span>
            </button>
          </div>
        </form>
      ) : (
        /* My Room Tickets Tracker */
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing tickets logged for {hostelBlock} · {roomNumber}:
          </div>

          {myRoomTickets.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800">No active tickets for your room</p>
              <p className="text-xs text-slate-400 mt-1">
                Everything looks good! If you notice an issue, click "File New Complaint".
              </p>
            </div>
          ) : (
            myRoomTickets.map((t) => {
              return (
                <div
                  key={t.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            t.priority === 'P0'
                              ? 'text-rose-700 bg-rose-50'
                              : t.priority === 'P1'
                              ? 'text-amber-800 bg-amber-50'
                              : 'text-sky-800 bg-sky-50'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{t.title}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold uppercase text-slate-700 block">
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        SLA: {t.slaTargetHours}h target
                      </span>
                    </div>
                  </div>

                  {/* Progress Pipeline */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium">
                    <span className={t.status !== 'submitted' ? 'text-slate-900' : 'text-indigo-600 font-bold'}>
                      1. Logged
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={t.status === 'triaged' ? 'text-indigo-600 font-bold' : t.status !== 'submitted' ? 'text-slate-900' : 'text-slate-400'}>
                      2. Triaged ({t.priority})
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={t.status === 'dispatched' ? 'text-indigo-600 font-bold' : ['in_progress', 'resolved', 'closed'].includes(t.status) ? 'text-slate-900' : 'text-slate-400'}>
                      3. Dispatched
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={t.status === 'in_progress' ? 'text-indigo-600 font-bold' : ['resolved', 'closed'].includes(t.status) ? 'text-slate-900' : 'text-slate-400'}>
                      4. In Progress
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className={['resolved', 'closed'].includes(t.status) ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                      5. Resolved
                    </span>
                  </div>

                  {/* Student Verification Prompt */}
                  {t.status === 'resolved' && !t.studentVerified && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-amber-950">
                        Caretaker marked this issue resolved. Please verify the physical repair in your room:
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setVerifyingTicketId(t.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Confirm Fixed & Rate Work
                        </button>

                        <button
                          onClick={() => setShowReopenBox(t.id)}
                          className="px-3.5 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Issue Persists (Reopen)
                        </button>
                      </div>

                      {/* Verification rating form */}
                      {verifyingTicketId === t.id && (
                        <div className="pt-3 border-t border-amber-200/80 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-900">Rating:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  className="p-0.5"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      star <= rating
                                        ? 'fill-amber-400 text-amber-500'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Optional comment for caretaker team..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onVerifyResolution(t.id, rating, feedback);
                              setVerifyingTicketId(null);
                            }}
                            className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md"
                          >
                            Submit Verification
                          </button>
                        </div>
                      )}

                      {/* Reopen form */}
                      {showReopenBox === t.id && (
                        <div className="pt-3 border-t border-amber-200/80 space-y-2">
                          <input
                            type="text"
                            placeholder="Explain why the problem is still unresolved..."
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 bg-white border border-rose-300 rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (reopenReason.trim()) {
                                onReopenTicket(t.id, reopenReason);
                                setShowReopenBox(null);
                                setReopenReason('');
                              }
                            }}
                            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-md"
                          >
                            Send Back to Triage
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {t.studentVerified && (
                    <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resolution verified by resident ({t.studentRating} / 5 Stars)
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
