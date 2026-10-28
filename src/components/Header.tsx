import React from 'react';
import { Plus, ShieldAlert, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'triage' | 'map' | 'technicians' | 'analytics' | 'student';
  setActiveTab: (tab: 'triage' | 'map' | 'technicians' | 'analytics' | 'student') => void;
  openNewTicketModal: () => void;
  activeRole: 'caretaker' | 'student';
  setActiveRole: (role: 'caretaker' | 'student') => void;
  urgentTicketsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openNewTicketModal,
  activeRole,
  setActiveRole,
  urgentTicketsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('triage')}
              className="text-left font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap"
            >
              HostelFix Ops
            </button>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              / Campus Logistics
            </span>
          </div>

          {/* Zone 2: 4-5 single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('triage')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'triage'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Triage Queue
              {urgentTicketsCount > 0 && (
                <span className="ml-1.5 font-mono text-xs text-rose-600 font-semibold">
                  ({urgentTicketsCount})
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'map'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Floor Hotspots
            </button>
            <button
              onClick={() => setActiveTab('technicians')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'technicians'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Crew Dispatch
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'analytics'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              SLA Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab('student');
                setActiveRole('student');
              }}
              className={`transition-colors whitespace-nowrap py-1 ${
                activeTab === 'student'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Resident Portal
            </button>
          </nav>

          {/* Zone 3: 1 primary action button + perspective toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => {
                  setActiveRole('caretaker');
                  if (activeTab === 'student') setActiveTab('triage');
                }}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeRole === 'caretaker'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Caretaker Ops
              </button>
              <button
                onClick={() => {
                  setActiveRole('student');
                  setActiveTab('student');
                }}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeRole === 'student'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resident Mode
              </button>
            </div>

            <button
              onClick={openNewTicketModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Complaint</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
