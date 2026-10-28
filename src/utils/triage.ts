import { ImpactScope, PriorityLevel, Ticket, TicketCategory, TriageScoreBreakdown } from '../types';

const CATEGORY_BASE_SCORES: Record<TicketCategory, number> = {
  electrical: 35,
  plumbing: 30,
  networking: 25,
  appliances_cooling: 20,
  sanitation: 20,
  carpentry: 15,
};

const SCOPE_POINTS: Record<ImpactScope, number> = {
  single_resident: 5,
  shared_room: 15,
  corridor_wing: 30,
  entire_block: 50,
};

export const SLA_HOURS_BY_PRIORITY: Record<PriorityLevel, number> = {
  P0: 2,   // Emergency hazard: 2 hours SLA
  P1: 8,   // High priority: 8 hours SLA
  P2: 24,  // Medium priority: 24 hours SLA
  P3: 72,  // Low routine: 72 hours SLA
};

export function calculateTriageScore(params: {
  category: TicketCategory;
  scope: ImpactScope;
  hasSafetyHazard: boolean;
  hasAcademicImpact: boolean;
  createdAt?: string;
}): TriageScoreBreakdown {
  const categoryBase = CATEGORY_BASE_SCORES[params.category] || 20;
  const scopePoints = SCOPE_POINTS[params.scope] || 5;
  const hazardBonus = params.hasSafetyHazard ? 40 : 0;
  const academicBonus = params.hasAcademicImpact ? 15 : 0;

  // Aging bonus: tickets that haven't been resolved gain +1 point every 2 hours passed, max 20 pts
  let timeDecayBonus = 0;
  if (params.createdAt) {
    const hoursElapsed = Math.max(0, (Date.now() - new Date(params.createdAt).getTime()) / (1000 * 60 * 60));
    timeDecayBonus = Math.min(20, Math.floor(hoursElapsed / 2));
  }

  const rawTotal = categoryBase + scopePoints + hazardBonus + academicBonus + timeDecayBonus;
  const totalScore = Math.min(100, Math.max(5, rawTotal));

  let computedPriority: PriorityLevel = 'P3';
  if (totalScore >= 75) {
    computedPriority = 'P0';
  } else if (totalScore >= 50) {
    computedPriority = 'P1';
  } else if (totalScore >= 25) {
    computedPriority = 'P2';
  } else {
    computedPriority = 'P3';
  }

  const reasons: string[] = [];
  if (params.hasSafetyHazard) {
    reasons.push('+40 pts: Severe safety or physical damage risk detected');
  }
  if (params.scope === 'entire_block') {
    reasons.push('+50 pts: Critical infrastructure outage affecting entire hostel block');
  } else if (params.scope === 'corridor_wing') {
    reasons.push('+30 pts: Multi-room wing / common corridor facility impacted');
  } else if (params.scope === 'shared_room') {
    reasons.push('+15 pts: Multi-occupant room disruption');
  }
  if (params.hasAcademicImpact) {
    reasons.push('+15 pts: Imminent academic deadline or exam study disruption');
  }
  if (timeDecayBonus > 0) {
    reasons.push(`+${timeDecayBonus} pts: Time escalation queue aging penalty`);
  }
  reasons.push(`Base weight for ${params.category.replace('_', ' ')}: ${categoryBase} pts`);

  return {
    categoryBase,
    scopePoints,
    hazardBonus,
    academicBonus,
    timeDecayBonus,
    totalScore,
    computedPriority,
    reasons,
  };
}

export function formatTimeRemaining(slaDeadline: string, status: string): {
  text: string;
  isBreached: boolean;
  isUrgent: boolean;
} {
  if (status === 'resolved' || status === 'closed') {
    return { text: 'Resolved in time', isBreached: false, isUrgent: false };
  }

  const deadline = new Date(slaDeadline).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overdueMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
    const overdueHours = Math.floor(overdueMinutes / 60);
    const mins = overdueMinutes % 60;
    const text = overdueHours > 0 ? `Breached by ${overdueHours}h ${mins}m` : `Breached by ${mins}m`;
    return { text, isBreached: true, isUrgent: true };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const isUrgent = hours < 2;
  const text = hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;

  return { text, isBreached: false, isUrgent };
}

export function detectClusters(tickets: Ticket[]): Map<string, { clusterKey: string; title: string; count: number; tickets: Ticket[] }> {
  // Cluster rule: same hostelBlock + floor + category where count >= 2
  const clusters = new Map<string, { clusterKey: string; title: string; count: number; tickets: Ticket[] }>();

  tickets.forEach((t) => {
    if (t.status === 'resolved' || t.status === 'closed') return;
    const key = `${t.hostelBlock}__FL${t.floor}__${t.category}`;
    if (!clusters.has(key)) {
      clusters.set(key, {
        clusterKey: key,
        title: `${t.hostelBlock} · Floor ${t.floor} (${t.category.toUpperCase()})`,
        count: 0,
        tickets: [],
      });
    }
    const item = clusters.get(key)!;
    item.count += 1;
    item.tickets.push(t);
  });

  // Filter to only those with >= 2 tickets
  const significantClusters = new Map<string, { clusterKey: string; title: string; count: number; tickets: Ticket[] }>();
  clusters.forEach((val, k) => {
    if (val.count >= 2) {
      significantClusters.set(k, val);
    }
  });

  return significantClusters;
}
