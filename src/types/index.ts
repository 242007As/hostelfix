export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3';

export type TicketCategory =
  | 'electrical'
  | 'plumbing'
  | 'networking'
  | 'carpentry'
  | 'appliances_cooling'
  | 'sanitation';

export type TicketStatus =
  | 'submitted'
  | 'triaged'
  | 'dispatched'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type ImpactScope = 'single_resident' | 'shared_room' | 'corridor_wing' | 'entire_block';

export interface TriageScoreBreakdown {
  categoryBase: number;
  scopePoints: number;
  hazardBonus: number;
  academicBonus: number;
  timeDecayBonus: number;
  totalScore: number;
  computedPriority: PriorityLevel;
  reasons: string[];
}

export interface TicketLog {
  id: string;
  timestamp: string;
  author: string;
  role: 'student' | 'caretaker' | 'technician' | 'warden';
  action: string;
  note?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. TKT-1042
  title: string;
  description: string;
  category: TicketCategory;
  hostelBlock: string; // e.g. "Block A - Ramanujan", "Block B - Aryabhata", "Block C - Sarojini"
  floor: number; // 0 (Ground), 1, 2, 3
  roomNumber: string; // e.g. "Room 204", "Wing Washroom 2B", "Corridor AP-3"
  isCommonArea: boolean;
  
  // Student input factors
  hasSafetyHazard: boolean; // e.g., sparking electrical, pipe burst flooding
  hasAcademicImpact: boolean; // e.g., Wi-Fi down before submission, study lamp short
  affectedResidentCount: number;
  scope: ImpactScope;
  imageUrls?: string[];

  // Triage algorithm output
  triageBreakdown: TriageScoreBreakdown;
  priority: PriorityLevel;
  manualPriorityOverride?: PriorityLevel;
  overrideReason?: string;

  // Status & Assignment
  status: TicketStatus;
  createdAt: string; // ISO
  slaTargetHours: number;
  slaDeadline: string; // ISO
  resolvedAt?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianTrade?: string;

  // Resolution & Verification
  caretakerNotes?: string;
  studentVerified?: boolean;
  studentRating?: number; // 1-5
  studentFeedback?: string;

  // Cluster grouping
  clusterId?: string;
  clusterTitle?: string;

  // Audit logs
  activityLogs: TicketLog[];
}

export interface Technician {
  id: string;
  name: string;
  trade: TicketCategory;
  phone: string;
  status: 'available' | 'on_job' | 'off_duty';
  activeTicketsCount: number;
  completedTodayCount: number;
  rating: number;
}

export interface HostelBlockInfo {
  id: string;
  name: string;
  code: string;
  totalFloors: number;
  roomsPerFloor: number;
  floors: {
    floorNumber: number;
    rooms: string[];
    commonAreas: string[];
  }[];
}
