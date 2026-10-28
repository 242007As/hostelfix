import React, { useState } from 'react';
import { User, Phone, CheckCircle, Clock, Wrench, Star, Zap, Droplets, Wifi, Armchair, Fan, Plus } from 'lucide-react';
import { Technician, Ticket, TicketCategory } from '../types';

interface TechnicianRosterProps {
  technicians: Technician[];
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onToggleStatus: (techId: string) => void;
  onAddTechnician: (tech: Omit<Technician, 'id' | 'activeTicketsCount' | 'completedTodayCount' | 'rating'>) => void;
}

export const TechnicianRoster: React.FC<TechnicianRosterProps> = ({
  technicians,
  tickets,
  onSelectTicket,
  onToggleStatus,
  onAddTechnician,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrade, setNewTrade] = useState<TicketCategory>('electrical');
  const [newPhone, setNewPhone] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    onAddTechnician({
      name: newName.trim(),
      trade: newTrade,
      phone: newPhone.trim(),
      status: 'available',
    });
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
  };

  const getTradeIcon = (trade: TicketCategory) => {
    switch (trade) {
      case 'electrical':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'plumbing':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'networking':
        return <Wifi className="w-4 h-4 text-indigo-600" />;
      case 'carpentry':
        return <Armchair className="w-4 h-4 text-amber-800" />;
      case 'appliances_cooling':
        return <Fan className="w-4 h-4 text-teal-600" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Campus Maintenance Crew Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor technician workload balancing, active assigned jobs, and on-duty availability.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cancel' : 'Register Crew Member'}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="text-xs font-semibold text-slate-900">Add New Technician</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Singh"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-md focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Discipline / Trade</label>
              <select
                value={newTrade}
                onChange={(e) => setNewTrade(e.target.value as TicketCategory)}
                className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-hidden"
              >
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="networking">Wi-Fi & Network</option>
                <option value="appliances_cooling">Cooling & Appliances</option>
                <option value="carpentry">Carpentry & Locks</option>
                <option value="sanitation">Sanitation</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="+91 98765-XXXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-md focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800"
            >
              Save Technician
            </button>
          </div>
        </form>
      )}

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((tech) => {
          const assignedTickets = tickets.filter(
            (t) => t.assignedTechnicianId === tech.id && t.status !== 'resolved' && t.status !== 'closed'
          );

          return (
            <div
              key={tech.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                {/* Top strip */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {tech.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">{tech.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        {getTradeIcon(tech.trade)}
                        <span className="capitalize">{tech.trade.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleStatus(tech.id)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors ${
                      tech.status === 'available'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : tech.status === 'on_job'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {tech.status === 'available' ? 'Available' : tech.status === 'on_job' ? 'On Job' : 'Off Duty'}
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 my-4 border-y border-slate-100 text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Active</div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {assignedTickets.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Done Today</div>
                    <div className="text-sm font-bold text-emerald-700 tabular-nums">
                      {tech.completedTodayCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Rating</div>
                    <div className="text-sm font-bold text-amber-600 tabular-nums flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      {tech.rating}
                    </div>
                  </div>
                </div>

                {/* Phone contact */}
                <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tech.phone}</span>
                </div>

                {/* Active Jobs List */}
                <div className="mt-4 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Active Jobs ({assignedTickets.length})
                  </div>
                  {assignedTickets.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-1">
                      No tickets currently in progress
                    </div>
                  ) : (
                    assignedTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTicket(t)}
                        className="p-2 bg-slate-50 hover:bg-slate-100/80 rounded-lg cursor-pointer border border-slate-200 text-xs transition-colors flex items-center justify-between"
                      >
                        <div className="truncate pr-2">
                          <span className="font-mono text-[10px] text-slate-500 font-semibold mr-1.5">
                            {t.ticketNumber}
                          </span>
                          <span className="text-slate-800 font-medium truncate">{t.roomNumber}: {t.title}</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            t.priority === 'P0' ? 'text-rose-700 bg-rose-100' : 'text-amber-800 bg-amber-100'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
