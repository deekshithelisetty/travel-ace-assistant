export type ActivityType = 'pnr' | 'email' | 'queue';
export type ActivityStatus = 'new' | 'working' | 'resolved' | 'closed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: string;
  badge: string;
  isNew?: boolean;
  status?: ActivityStatus;
  caseId?: string;
}

export type GDSType = 'SBR' | 'AMD' | 'WSP';

export interface GDSState {
  selected: GDSType | null;
  pcc: string | null;
  isConnected: boolean;
}

export interface Tab {
  id: string;
  type: 'global' | 'pnr' | 'email';
  label: string;
  pnr?: string;
  email?: string;
  status?: ActivityStatus;
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  sender?: string;
  suggestions?: CommandSuggestion[];
  pnrData?: PNRData;
}

export interface CommandSuggestion {
  command: string;
  description: string;
}

export interface SearchResult {
  gds: GDSType;
  pnr: string;
  passenger: string;
  ttl: string;
  status: 'urgent' | 'warning' | 'normal';
}

export interface PNRData {
  pnr: string;
  passenger: string;
  flightStatus: string;
  route: string;
  date: string;
  eTicket: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface CaseIntelligence {
  complexityScore: number;
  maxScore: number;
  timeline: TimelineEvent[];
  slaPercentage: number;
  efficiencyData: number[];
}

export interface TimelineEvent {
  id: string;
  icon: 'received' | 'assignment' | 'gds' | 'resolution';
  title: string;
  description: string;
  timestamp: string;
}

export interface WorkedCase {
  id: string;
  pnr: string;
  title: string;
  status: ActivityStatus;
  lastWorked: string;
}
