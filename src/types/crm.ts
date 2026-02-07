export type ActivityType = 'pnr' | 'email' | 'queue' | 'ccv_rejected';
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
  /** When type is ccv_rejected, link to CCV info for the opened tab */
  ccvInfo?: CCVInfo;
  pnrActivity?: PNRActivityEvent[];
}

/** Payomo/CCV fraud and identity verification summary for a PNR */
export interface CCVInfo {
  pnr: string;
  status: 'DECLINED' | 'APPROVED';
  highRisk: boolean;
  proceedFulfillment: boolean;
  riskScore: number;
  identityCheckScore: number;
  identityNetworkScore: number;
  threeDSStatus?: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    ipAddress: string;
    billingAddress: string;
  };
  binInfo?: Record<string, string>;
  /** Validation results: phone, email, address */
  validations: {
    phone: { valid: boolean; value: string; match?: boolean };
    email: { valid: boolean; value: string; match?: boolean };
    address: { valid: boolean; match?: boolean };
  };
  /** Journey summary for display in conversation */
  journey?: {
    route: string;
    date: string;
    segments?: string[];
  };
}

/** Single event in PNR activity timeline (CCV, Case, TICKET_ORDER, TICKETING_QC, BOOKING) */
export type PNRActivityEventType = 'CCV' | 'CASE' | 'TICKET_ORDER' | 'TICKETING_QC' | 'BOOKING';
export type PNRActivityStatus = 'SUCCESS' | 'FAILURE' | 'PENDING';

export interface PNRActivityEvent {
  id: string;
  type: PNRActivityEventType;
  title: string;
  subtitle: string;
  timestamp: string;
  status: PNRActivityStatus;
}

export type GDSType = 'SBR' | 'AMD' | 'WSP';

export interface GDSState {
  selected: GDSType | null;
  pcc: string | null;
  isConnected: boolean;
}

export interface Tab {
  id: string;
  type: 'global' | 'pnr' | 'email' | 'ccv';
  label: string;
  pnr?: string;
  email?: string;
  status?: ActivityStatus;
  /** When true, tab was accepted from activity stream; closing it does not remove from Spaces */
  accepted?: boolean;
  /** When type is 'ccv', full CCV info and PNR activity for this case */
  ccvInfo?: CCVInfo;
  pnrActivity?: PNRActivityEvent[];
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  sender?: string;
  suggestions?: CommandSuggestion[];
  pnrData?: PNRData;
  /** GDS terminal-style command output (displayed in chat in a terminal block) */
  gdsOutput?: string;
  /** When present, show issued ticket numbers (e.g. after "verified good" → ticketing) */
  ticketNumbers?: string[];
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
  pnr?: string;
  title: string;
  status: ActivityStatus;
  lastWorked: string;
}
