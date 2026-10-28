/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_TICKETS,
  INITIAL_TECHNICIANS,
  HOSTEL_BLOCKS,
} from './data/mockData';
import {
  ImpactScope,
  PriorityLevel,
  Technician,
  Ticket,
  TicketCategory,
  TicketStatus,
} from './types';
import { Header } from './components/Header';
import { TriageQueue } from './components/TriageQueue';
import { TicketDetailModal } from './components/TicketDetailModal';
import { CampusMapVisualizer } from './components/CampusMapVisualizer';
import { TechnicianRoster } from './components/TechnicianRoster';
import { StudentPortal } from './components/StudentPortal';
import { AnalyticsView } from './components/AnalyticsView';
import { calculateTriageScore, SLA_HOURS_BY_PRIORITY } from './utils/triage';
import { RotateCcw } from 'lucide-react';

export default function App() {
  // Load tickets with localStorage persistence
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem('hostelfix_tickets_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TICKETS;
  });

  // Load technicians with localStorage persistence
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    try {
      const saved = localStorage.getItem('hostelfix_techs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TECHNICIANS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hostelfix_tickets_v1', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('hostelfix_techs_v1', JSON.stringify(technicians));
  }, [technicians]);

  // Navigation & perspective
  const [activeTab, setActiveTab] = useState<'triage' | 'map' | 'technicians' | 'analytics' | 'student'>('triage');
  const [activeRole, setActiveRole] = useState<'caretaker' | 'student'>('caretaker');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('all');
  const [presetRoom, setPresetRoom] = useState<{ block: string; floor: number; room: string } | null>(null);

  // Urgent tickets count (P0 / P1 active)
  const urgentTicketsCount = tickets.filter(
    (t) => (t.priority === 'P0' || t.priority === 'P1') && t.status !== 'resolved' && t.status !== 'closed'
  ).length;

  // Handlers
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleUpdateStatus = (ticketId: string, status: TicketStatus, note?: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;

        const isResolvedNow = status === 'resolved' || status === 'closed';
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: activeRole === 'caretaker' ? 'Hostel Caretaker Desk' : 'Resident Portal',
          role: activeRole,
          action: `Status marked ${status.replace('_', ' ')}`,
          note: note || (isResolvedNow ? 'Work validated on site.' : undefined),
        };

        return {
          ...t,
          status,
          resolvedAt: isResolvedNow ? new Date().toISOString() : t.resolvedAt,
          activityLogs: [newLog, ...t.activityLogs],
        };
      })
    );

    // Also update selected ticket in modal view
    setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, status } : prev));
  };

  const handleAssignTechnician = (ticketId: string, techId: string) => {
    const tech = technicians.find((tc) => tc.id === techId);
    if (!tech) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: 'Caretaker Operations',
          role: 'caretaker' as const,
          action: `Assigned to ${tech.name}`,
          note: `Technician Trade: ${tech.trade}`,
        };

        return {
          ...t,
          status: t.status === 'submitted' ? 'dispatched' : t.status,
          assignedTechnicianId: tech.id,
          assignedTechnicianName: tech.name,
          assignedTechnicianTrade: tech.trade,
          activityLogs: [newLog, ...t.activityLogs],
        };
      })
    );

    // Update technician load
    setTechnicians((prev) =>
      prev.map((tc) =>
        tc.id === techId ? { ...tc, activeTicketsCount: tc.activeTicketsCount + 1 } : tc
      )
    );

    setSelectedTicket((prev) =>
      prev && prev.id === ticketId
        ? {
            ...prev,
            assignedTechnicianId: tech.id,
            assignedTechnicianName: tech.name,
            assignedTechnicianTrade: tech.trade,
            status: prev.status === 'submitted' ? 'dispatched' : prev.status,
          }
        : prev
    );
  };

  const handleBatchAssign = (ticketIds: string[], techId: string) => {
    const tech = technicians.find((tc) => tc.id === techId);
    if (!tech) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (!ticketIds.includes(t.id)) return t;
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: 'Caretaker Operations',
          role: 'caretaker' as const,
          action: `Batch Assigned to ${tech.name}`,
          note: `Part of coordinated wing dispatch`,
        };
        return {
          ...t,
          status: t.status === 'submitted' ? 'dispatched' : t.status,
          assignedTechnicianId: tech.id,
          assignedTechnicianName: tech.name,
          assignedTechnicianTrade: tech.trade,
          activityLogs: [newLog, ...t.activityLogs],
        };
      })
    );

    setTechnicians((prev) =>
      prev.map((tc) =>
        tc.id === techId
          ? { ...tc, activeTicketsCount: tc.activeTicketsCount + ticketIds.length }
          : tc
      )
    );
  };

  const handleBatchUpdateStatus = (ticketIds: string[], status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (!ticketIds.includes(t.id)) return t;
        return {
          ...t,
          status,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : t.resolvedAt,
          activityLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              author: 'Caretaker Operations',
              role: 'caretaker' as const,
              action: `Batch updated to ${status}`,
            },
            ...t.activityLogs,
          ],
        };
      })
    );
  };

  const handleOverridePriority = (ticketId: string, newPriority: PriorityLevel, reason: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const newSlaHours = SLA_HOURS_BY_PRIORITY[newPriority];
        const newDeadline = new Date(
          new Date(t.createdAt).getTime() + newSlaHours * 60 * 60 * 1000
        ).toISOString();

        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: 'Caretaker Desk',
          role: 'caretaker' as const,
          action: `Priority Overridden to ${newPriority}`,
          note: `Reason: ${reason}`,
        };

        return {
          ...t,
          priority: newPriority,
          manualPriorityOverride: newPriority,
          overrideReason: reason,
          slaTargetHours: newSlaHours,
          slaDeadline: newDeadline,
          activityLogs: [newLog, ...t.activityLogs],
        };
      })
    );

    setSelectedTicket((prev) =>
      prev && prev.id === ticketId
        ? {
            ...prev,
            priority: newPriority,
            manualPriorityOverride: newPriority,
            overrideReason: reason,
          }
        : prev
    );
  };

  const handleAddNote = (ticketId: string, note: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: 'Caretaker Operations',
          role: 'caretaker' as const,
          action: 'Log Entry Added',
          note,
        };
        return {
          ...t,
          caretakerNotes: t.caretakerNotes ? `${t.caretakerNotes}\n${note}` : note,
          activityLogs: [newLog, ...t.activityLogs],
        };
      })
    );

    setSelectedTicket((prev) =>
      prev && prev.id === ticketId
        ? {
            ...prev,
            caretakerNotes: prev.caretakerNotes ? `${prev.caretakerNotes}\n${note}` : note,
          }
        : prev
    );
  };

  const handleSubmitNewTicket = (data: {
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
  }) => {
    const createdAt = new Date().toISOString();
    const triageBreakdown = calculateTriageScore({
      category: data.category,
      scope: data.scope,
      hasSafetyHazard: data.hasSafetyHazard,
      hasAcademicImpact: data.hasAcademicImpact,
      createdAt,
    });

    const priority = triageBreakdown.computedPriority;
    const slaTargetHours = SLA_HOURS_BY_PRIORITY[priority];
    const slaDeadline = new Date(Date.now() + slaTargetHours * 60 * 60 * 1000).toISOString();
    const ticketNumber = `TKT-${Math.floor(2100 + Math.random() * 800)}`;

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      title: data.title,
      description: data.description,
      category: data.category,
      hostelBlock: data.hostelBlock,
      floor: data.floor,
      roomNumber: data.roomNumber,
      isCommonArea: data.isCommonArea,
      hasSafetyHazard: data.hasSafetyHazard,
      hasAcademicImpact: data.hasAcademicImpact,
      affectedResidentCount: data.affectedResidentCount,
      scope: data.scope,
      triageBreakdown,
      priority,
      status: 'submitted',
      createdAt,
      slaTargetHours,
      slaDeadline,
      activityLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: createdAt,
          author: 'Resident Intake Portal',
          role: 'student',
          action: 'Complaint Registered',
          note: `Automated triage score: ${triageBreakdown.totalScore}/100 · ${priority}`,
        },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleVerifyResolution = (ticketId: string, rating: number, feedback: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: 'Resident Room Occupant',
          role: 'student' as const,
          action: `Resolution Verified (${rating} Stars)`,
          note: feedback || 'Resident confirmed problem is resolved.',
        };
        return {
          ...t,
          status: 'closed',
          studentVerified: true,
          studentRating: rating,
          studentFeedback: feedback,
          activityLogs: [newLog, ...t.activityLogs],
        };
      })
    );
  };

  const handleReopenTicket = (ticketId: string, reason: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: 'Resident Room Occupant',
          role: 'student' as const,
          action: 'Ticket Reopened by Resident',
          note: `Issue unresolved: ${reason}`,
        };
        return {
          ...t,
          status: 'triaged',
          studentVerified: false,
          activityLogs: [newLog, ...t.activityLogs],
        };
      })
    );
  };

  const handleToggleTechStatus = (techId: string) => {
    setTechnicians((prev) =>
      prev.map((tc) => {
        if (tc.id !== techId) return tc;
        const nextStatus =
          tc.status === 'available'
            ? 'on_job'
            : tc.status === 'on_job'
            ? 'off_duty'
            : 'available';
        return { ...tc, status: nextStatus };
      })
    );
  };

  const handleAddTechnician = (
    data: Omit<Technician, 'id' | 'activeTicketsCount' | 'completedTodayCount' | 'rating'>
  ) => {
    const newTech: Technician = {
      ...data,
      id: `tech-${Date.now()}`,
      activeTicketsCount: 0,
      completedTodayCount: 0,
      rating: 5.0,
    };
    setTechnicians((prev) => [...prev, newTech]);
  };

  const handleResetDemoData = () => {
    localStorage.removeItem('hostelfix_tickets_v1');
    localStorage.removeItem('hostelfix_techs_v1');
    setTickets(INITIAL_TICKETS);
    setTechnicians(INITIAL_TECHNICIANS);
  };

  const handleOpenNewTicketForRoom = (block: string, floor: number, room: string) => {
    setPresetRoom({ block, floor, room });
    setActiveTab('student');
    setActiveRole('student');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNewTicketModal={() => {
          setActiveTab('student');
          setActiveRole('student');
          setPresetRoom(null);
        }}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        urgentTicketsCount={urgentTicketsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'triage' && (
          <TriageQueue
            tickets={tickets}
            technicians={technicians}
            onSelectTicket={handleSelectTicket}
            onUpdateTicketStatus={handleUpdateStatus}
            onAssignTechnician={handleAssignTechnician}
            onBatchAssign={handleBatchAssign}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            selectedBlockFilter={selectedBlockFilter}
            setSelectedBlockFilter={setSelectedBlockFilter}
          />
        )}

        {activeTab === 'map' && (
          <CampusMapVisualizer
            blocks={HOSTEL_BLOCKS}
            tickets={tickets}
            onSelectTicket={handleSelectTicket}
            onOpenNewTicketForRoom={handleOpenNewTicketForRoom}
          />
        )}

        {activeTab === 'technicians' && (
          <TechnicianRoster
            technicians={technicians}
            tickets={tickets}
            onSelectTicket={handleSelectTicket}
            onToggleStatus={handleToggleTechStatus}
            onAddTechnician={handleAddTechnician}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView tickets={tickets} />}

        {activeTab === 'student' && (
          <StudentPortal
            tickets={tickets}
            onSubmitTicket={handleSubmitNewTicket}
            onVerifyResolution={handleVerifyResolution}
            onReopenTicket={handleReopenTicket}
            presetRoom={presetRoom}
          />
        )}
      </main>

      {/* Detail & Triage Inspector Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          technicians={technicians}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={handleUpdateStatus}
          onAssignTechnician={handleAssignTechnician}
          onOverridePriority={handleOverridePriority}
          onAddNote={handleAddNote}
        />
      )}

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            HostelFix Ops · Campus Facility Logistics & Ticket Priority Triage System
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetDemoData}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Data</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>Ramanujan · Aryabhata · Sarojini Halls</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
