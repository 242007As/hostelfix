import { HostelBlockInfo, Technician, Ticket } from '../types';
import { calculateTriageScore, SLA_HOURS_BY_PRIORITY } from '../utils/triage';

export const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Suresh Kumar',
    trade: 'electrical',
    phone: '+91 98765-43210',
    status: 'on_job',
    activeTicketsCount: 2,
    completedTodayCount: 5,
    rating: 4.8,
  },
  {
    id: 'tech-2',
    name: 'Ramesh Patel',
    trade: 'plumbing',
    phone: '+91 98765-43211',
    status: 'available',
    activeTicketsCount: 1,
    completedTodayCount: 4,
    rating: 4.7,
  },
  {
    id: 'tech-3',
    name: 'Anand Verma',
    trade: 'networking',
    phone: '+91 98765-43212',
    status: 'available',
    activeTicketsCount: 1,
    completedTodayCount: 6,
    rating: 4.9,
  },
  {
    id: 'tech-4',
    name: 'Jagdish Rao',
    trade: 'carpentry',
    phone: '+91 98765-43213',
    status: 'available',
    activeTicketsCount: 0,
    completedTodayCount: 3,
    rating: 4.6,
  },
  {
    id: 'tech-5',
    name: 'Vikram Singh',
    trade: 'appliances_cooling',
    phone: '+91 98765-43214',
    status: 'on_job',
    activeTicketsCount: 2,
    completedTodayCount: 2,
    rating: 4.5,
  },
];

export const HOSTEL_BLOCKS: HostelBlockInfo[] = [
  {
    id: 'block-a',
    name: 'Block A · Ramanujan Hall',
    code: 'BLK-A',
    totalFloors: 4,
    roomsPerFloor: 12,
    floors: [0, 1, 2, 3].map((fl) => ({
      floorNumber: fl,
      rooms: Array.from({ length: 12 }, (_, i) => `${fl * 100 + (i + 1)}`),
      commonAreas: [`Floor ${fl} Washroom East`, `Floor ${fl} Washroom West`, `Floor ${fl} Study Lounge`],
    })),
  },
  {
    id: 'block-b',
    name: 'Block B · Aryabhata Hall',
    code: 'BLK-B',
    totalFloors: 4,
    roomsPerFloor: 12,
    floors: [0, 1, 2, 3].map((fl) => ({
      floorNumber: fl,
      rooms: Array.from({ length: 12 }, (_, i) => `${fl * 100 + (i + 1)}`),
      commonAreas: [`Floor ${fl} Washroom Central`, `Floor ${fl} RO Water Cooler`, `Floor ${fl} Network Switch Room`],
    })),
  },
  {
    id: 'block-c',
    name: 'Block C · Sarojini Hall',
    code: 'BLK-C',
    totalFloors: 3,
    roomsPerFloor: 10,
    floors: [0, 1, 2].map((fl) => ({
      floorNumber: fl,
      rooms: Array.from({ length: 10 }, (_, i) => `${fl * 100 + (i + 1)}`),
      commonAreas: [`Floor ${fl} Common Washroom`, `Floor ${fl} Pantry`, `Floor ${fl} Ironing Station`],
    })),
  },
];

// Helper to seed ticket with exact triage breakdown
function createInitialTicket(data: {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: Ticket['category'];
  hostelBlock: string;
  floor: number;
  roomNumber: string;
  isCommonArea: boolean;
  hasSafetyHazard: boolean;
  hasAcademicImpact: boolean;
  scope: Ticket['scope'];
  affectedResidentCount: number;
  hoursAgo: number;
  status: Ticket['status'];
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianTrade?: string;
  caretakerNotes?: string;
}): Ticket {
  const createdAt = new Date(Date.now() - data.hoursAgo * 60 * 60 * 1000).toISOString();
  const triageBreakdown = calculateTriageScore({
    category: data.category,
    scope: data.scope,
    hasSafetyHazard: data.hasSafetyHazard,
    hasAcademicImpact: data.hasAcademicImpact,
    createdAt,
  });

  const priority = triageBreakdown.computedPriority;
  const slaTargetHours = SLA_HOURS_BY_PRIORITY[priority];
  const slaDeadline = new Date(new Date(createdAt).getTime() + slaTargetHours * 60 * 60 * 1000).toISOString();

  return {
    id: data.id,
    ticketNumber: data.ticketNumber,
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
    status: data.status,
    createdAt,
    slaTargetHours,
    slaDeadline,
    assignedTechnicianId: data.assignedTechnicianId,
    assignedTechnicianName: data.assignedTechnicianName,
    assignedTechnicianTrade: data.assignedTechnicianTrade,
    caretakerNotes: data.caretakerNotes,
    activityLogs: [
      {
        id: `log-${Date.now()}-1`,
        timestamp: createdAt,
        author: 'Resident Portal',
        role: 'student',
        action: 'Complaint Logged',
        note: `Initial submission from ${data.roomNumber}`,
      },
      ...(data.status !== 'submitted'
        ? [
            {
              id: `log-${Date.now()}-2`,
              timestamp: new Date(new Date(createdAt).getTime() + 15 * 60 * 1000).toISOString(),
              author: 'Caretaker Triage Engine',
              role: 'caretaker' as const,
              action: `Classified as ${priority}`,
              note: `Computed triage score: ${triageBreakdown.totalScore}/100`,
            },
          ]
        : []),
    ],
  };
}

export const INITIAL_TICKETS: Ticket[] = [
  createInitialTicket({
    id: 'tkt-1',
    ticketNumber: 'TKT-2089',
    title: 'Short circuit sparks emitting from study lamp socket',
    description: 'Black soot visible around the 3-pin switchboard above study desk. Tripped the miniature circuit breaker twice.',
    category: 'electrical',
    hostelBlock: 'Block A · Ramanujan Hall',
    floor: 2,
    roomNumber: 'Room 204',
    isCommonArea: false,
    hasSafetyHazard: true,
    hasAcademicImpact: true,
    scope: 'single_resident',
    affectedResidentCount: 2,
    hoursAgo: 1.5,
    status: 'in_progress',
    assignedTechnicianId: 'tech-1',
    assignedTechnicianName: 'Suresh Kumar',
    assignedTechnicianTrade: 'electrical',
    caretakerNotes: 'Technician on site inspecting MCB sub-panel on 2nd floor.',
  }),
  createInitialTicket({
    id: 'tkt-2',
    ticketNumber: 'TKT-2090',
    title: 'Ceiling pipe rupture in 2nd Floor East Washroom flooding hallway',
    description: 'Water leaking vigorously through ceiling tiles near stall 3. Water starting to puddle toward corridor.',
    category: 'plumbing',
    hostelBlock: 'Block B · Aryabhata Hall',
    floor: 2,
    roomNumber: 'Floor 2 Washroom Central',
    isCommonArea: true,
    hasSafetyHazard: true,
    hasAcademicImpact: false,
    scope: 'corridor_wing',
    affectedResidentCount: 24,
    hoursAgo: 0.8,
    status: 'dispatched',
    assignedTechnicianId: 'tech-2',
    assignedTechnicianName: 'Ramesh Patel',
    assignedTechnicianTrade: 'plumbing',
    caretakerNotes: 'Main overhead valve isolated. Ramesh dispatched with PVC replacement coupler.',
  }),
  createInitialTicket({
    id: 'tkt-3',
    ticketNumber: 'TKT-2091',
    title: 'Wi-Fi AP-2B offline: 8 rooms unable to submit CS Lab assignment',
    description: 'Access point AP-B2 showing flashing red LED. Entire West wing of floor 2 has zero campus network connectivity during assignment submission window.',
    category: 'networking',
    hostelBlock: 'Block B · Aryabhata Hall',
    floor: 2,
    roomNumber: 'Floor 2 Network Switch Room',
    isCommonArea: true,
    hasSafetyHazard: false,
    hasAcademicImpact: true,
    scope: 'corridor_wing',
    affectedResidentCount: 16,
    hoursAgo: 2.2,
    status: 'triaged',
    assignedTechnicianId: 'tech-3',
    assignedTechnicianName: 'Anand Verma',
    assignedTechnicianTrade: 'networking',
    caretakerNotes: 'PoE injector switch reboot requested. Anand Verma arriving after lunch.',
  }),
  createInitialTicket({
    id: 'tkt-4',
    ticketNumber: 'TKT-2092',
    title: 'Room 207 no Wi-Fi connectivity - AP-2B dropped signal',
    description: 'Cannot connect to Eduroam or CampusNet. SSID disappears and reappears intermittently.',
    category: 'networking',
    hostelBlock: 'Block B · Aryabhata Hall',
    floor: 2,
    roomNumber: 'Room 207',
    isCommonArea: false,
    hasSafetyHazard: false,
    hasAcademicImpact: true,
    scope: 'single_resident',
    affectedResidentCount: 2,
    hoursAgo: 1.8,
    status: 'submitted',
    caretakerNotes: '',
  }),
  createInitialTicket({
    id: 'tkt-5',
    ticketNumber: 'TKT-2082',
    title: 'RO Water Cooler compressor vibrating loudly and dispensing lukewarm water',
    description: 'Floor 1 water station is dispensing tepid water, cooling unit seems to have failed, students forced to go to ground floor.',
    category: 'appliances_cooling',
    hostelBlock: 'Block A · Ramanujan Hall',
    floor: 1,
    roomNumber: 'Floor 1 Study Lounge',
    isCommonArea: true,
    hasSafetyHazard: false,
    hasAcademicImpact: false,
    scope: 'corridor_wing',
    affectedResidentCount: 20,
    hoursAgo: 14.5,
    status: 'triaged',
    caretakerNotes: 'Compressor relay capacitor suspected. Spare requested from central stores.',
  }),
  createInitialTicket({
    id: 'tkt-6',
    ticketNumber: 'TKT-2075',
    title: 'Main entrance door lock deadbolt sticking in Room 114',
    description: 'Key gets jammed inside cylinder. Residents unable to lock room properly when leaving for lecture.',
    category: 'carpentry',
    hostelBlock: 'Block C · Sarojini Hall',
    floor: 1,
    roomNumber: 'Room 114',
    isCommonArea: false,
    hasSafetyHazard: true,
    hasAcademicImpact: false,
    scope: 'shared_room',
    affectedResidentCount: 3,
    hoursAgo: 6.0,
    status: 'dispatched',
    assignedTechnicianId: 'tech-4',
    assignedTechnicianName: 'Jagdish Rao',
    assignedTechnicianTrade: 'carpentry',
    caretakerNotes: 'Jagdish bringing replacement Euro cylinder latch lock.',
  }),
  createInitialTicket({
    id: 'tkt-7',
    ticketNumber: 'TKT-2068',
    title: 'Washbasin tap in Room 309 dripping steadily',
    description: 'Cold water tap washer worn out, slow persistent drip filling bucket overnight.',
    category: 'plumbing',
    hostelBlock: 'Block A · Ramanujan Hall',
    floor: 3,
    roomNumber: 'Room 309',
    isCommonArea: false,
    hasSafetyHazard: false,
    hasAcademicImpact: false,
    scope: 'single_resident',
    affectedResidentCount: 2,
    hoursAgo: 26.0,
    status: 'submitted',
    caretakerNotes: 'Low priority queue, scheduled for routine Tuesday plumbing run.',
  }),
  createInitialTicket({
    id: 'tkt-8',
    ticketNumber: 'TKT-2050',
    title: 'Wardrobe door top hinge loose in Room 008',
    description: 'Left wooden wardrobe door sagging slightly when opened. Screws stripped from particle board.',
    category: 'carpentry',
    hostelBlock: 'Block C · Sarojini Hall',
    floor: 0,
    roomNumber: 'Room 008',
    isCommonArea: false,
    hasSafetyHazard: false,
    hasAcademicImpact: false,
    scope: 'single_resident',
    affectedResidentCount: 1,
    hoursAgo: 48.0,
    status: 'resolved',
    assignedTechnicianId: 'tech-4',
    assignedTechnicianName: 'Jagdish Rao',
    assignedTechnicianTrade: 'carpentry',
    caretakerNotes: 'Wooden dowel plugs fitted and reinforced hinge screws mounted.',
  }),
];
