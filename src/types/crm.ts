export type ActivityType = 'pnr' | 'email' | 'queue';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: string;
  badge: string;
  isNew?: boolean;
}

export type GDSType = 'SBR' | 'AMD' | 'WSP';

export interface Tab {
  id: string;
  type: 'global' | 'pnr' | 'email';
  label: string;
  pnr?: string;
  email?: string;
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  sender?: string;
}

export interface SearchResult {
  gds: GDSType;
  pnr: string;
  passenger: string;
  ttl: string;
  status: 'urgent' | 'warning' | 'normal';
}
