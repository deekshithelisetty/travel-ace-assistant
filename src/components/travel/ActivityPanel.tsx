import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Radio, SlidersHorizontal, Mail, Plane, Users, MessageCircle, FolderOpen, Check, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, RefreshCw, PenLine, AlertTriangle, CreditCard, Bot, Send, Mic, Maximize2, Minimize2, Wallet, Ticket, Package, Receipt, Hourglass, Sparkles } from 'lucide-react';
import { ActivityItem, ActivityType, WorkedCase, FlowStep, ActivityStatus, PotentialFraud } from '@/types/crm';
import { cn } from '@/lib/utils';
import { SpacesPanel } from './SpacesPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import travelAssistantAvatar from '@/assets/travel-assistant-avatar.png';

type AvatarChatMessage = { id: string; role: 'user' | 'assistant'; content: string };
type BottomMode = 'avatar' | 'chat';

/** Travel Assistant avatar: plain img so the image always displays (no Radix fallback hiding it). */
function TravelAssistantAvatar({
  className,
  size = 16,
}: {
  className?: string;
  size?: 6 | 8 | 9 | 16;
}) {
  const sizeClass =
    size === 6 ? 'h-6 w-6' : size === 8 ? 'h-8 w-8' : size === 9 ? 'h-9 w-9' : 'h-16 w-16';
  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border-2 border-primary/30 bg-primary/10',
        sizeClass,
        className
      )}
    >
      <img
        src={travelAssistantAvatar}
        alt="Travel Assistant"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/** Live motion / signal icon (concentric rings + center dot) */
function LiveMotionIcon({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <span className="absolute w-4 h-4 rounded-full border-2 border-primary/60" />
      <span className="absolute w-6 h-6 rounded-full border-2 border-primary/40" />
      <span className="absolute w-8 h-8 rounded-full border-2 border-primary/20" />
      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
    </div>
  );
}

interface ActivityPanelProps {
  items: ActivityItem[];
  workedCases: WorkedCase[];
  onItemClick: (item: ActivityItem) => void;
  onAccept: (item: ActivityItem) => void;
  onReject: (item: ActivityItem) => void;
  onChatClick: () => void;
  /** When user sends a message from the Chat tab, pass it to main chat and open it. */
  onSendMessage?: (text: string) => void;
  onWorkedCaseClick: (workedCase: WorkedCase) => void;
  /** When true, panel is collapsed to a narrow rail. Default false (expanded). */
  collapsed?: boolean;
  onToggle?: () => void;
}

type ViewMode = 'activity' | 'spaces';

/** Emoji for new card header by activity type */
const getActivityEmoji = (type: ActivityType) => {
  switch (type) {
    case 'pnr': return '🎉';
    case 'email': return '💬';
    case 'queue': return '⏳';
    case 'ccv_rejected': return '⚠️';
    case 'ccd': return '⏳';
    case 'ticketing_failed': return '⚠️';
    case 'ancillary_failed': return '⚠️';
    case 'reissue_failed': return '🔄';
    case 'refund_failed': return '⚠️';
    default: return '📌';
  }
};

/** Small planet/sphere icon for card header */
function PlanetIcon({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-violet-500/80 to-indigo-600/80 flex items-center justify-center shrink-0', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
    </div>
  );
}

/** Right-aligned circular light-purple icon with white glyph (progress ring optional) */
function CardRightIcon({ icon, progress = 0, isDark = true }: { icon: React.ReactNode; progress?: number; isDark?: boolean }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center w-9 h-9 shrink-0 rounded-full',
        isDark ? 'bg-violet-400/90 text-white' : 'bg-violet-100 text-violet-600 border border-violet-200'
      )}
    >
      {progress > 0 && progress < 1 && (
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(139,92,246,0.3)'} strokeWidth="2" />
          <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? 'white' : 'rgb(139,92,246)'} strokeWidth="2" strokeDasharray={`${progress * 100} 100`} strokeLinecap="round" />
        </svg>
      )}
      <span className="relative flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
    </div>
  );
}

const getBadgeStyles = (type: ActivityType) => {
  switch (type) {
    case 'pnr':
      return 'bg-badge-pnr/20 text-badge-pnr border-badge-pnr/30';
    case 'email':
      return 'bg-badge-email/20 text-badge-email border-badge-email/30';
    case 'queue':
      return 'bg-badge-queue/20 text-badge-queue border-badge-queue/30';
    case 'ccv_rejected':
      return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'ccd':
      return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'ticketing_failed':
      return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
    case 'ancillary_failed':
      return 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30';
    case 'reissue_failed':
      return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'refund_failed':
      return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getIcon = (type: ActivityType) => {
  switch (type) {
    case 'pnr':
      return <Plane className="h-3.5 w-3.5" />;
    case 'email':
      return <Mail className="h-3.5 w-3.5" />;
    case 'queue':
      return <Users className="h-3.5 w-3.5" />;
    case 'ccv_rejected':
      return <CreditCard className="h-3.5 w-3.5" />;
    case 'ccd':
      return <Wallet className="h-3.5 w-3.5" />;
    case 'ticketing_failed':
      return <Ticket className="h-3.5 w-3.5" />;
    case 'ancillary_failed':
      return <Package className="h-3.5 w-3.5" />;
    case 'reissue_failed':
      return <RefreshCw className="h-3.5 w-3.5" />;
    case 'refund_failed':
      return <Receipt className="h-3.5 w-3.5" />;
    default:
      return <AlertTriangle className="h-3.5 w-3.5" />;
  }
};

/** Pill header gradient by type (travel=teal, success=green, issue=red/amber/etc, message=no pill) */
const getPillGradient = (type: ActivityType) => {
  switch (type) {
    case 'pnr':
      return 'bg-gradient-to-b from-teal-600/90 to-teal-700/90 dark:from-teal-500/20 dark:to-teal-600/30 border-teal-500/30 text-white';
    case 'ccv_rejected':
      return 'bg-gradient-to-b from-red-700/90 to-red-800/90 dark:from-red-600/30 dark:to-red-700/40 border-red-500/40 text-white';
    case 'ccd':
      return 'bg-gradient-to-b from-amber-600/90 to-amber-700/90 dark:from-amber-500/25 dark:to-amber-600/35 border-amber-500/40 text-white';
    case 'ticketing_failed':
      return 'bg-gradient-to-b from-orange-600/90 to-orange-700/90 dark:from-orange-500/25 dark:to-orange-600/35 border-orange-500/40 text-white';
    case 'ancillary_failed':
      return 'bg-gradient-to-b from-violet-600/90 to-violet-700/90 dark:from-violet-500/25 dark:to-violet-600/35 border-violet-500/40 text-white';
    case 'reissue_failed':
      return 'bg-gradient-to-b from-blue-600/90 to-blue-700/90 dark:from-blue-500/25 dark:to-blue-600/35 border-blue-500/40 text-white';
    case 'refund_failed':
      return 'bg-gradient-to-b from-rose-600/90 to-rose-700/90 dark:from-rose-500/25 dark:to-rose-600/35 border-rose-500/40 text-white';
    case 'queue':
      return 'bg-gradient-to-b from-amber-500/80 to-amber-600/90 dark:from-amber-500/20 dark:to-amber-600/30 border-amber-500/30 text-white';
    default:
      return 'bg-gradient-to-b from-muted to-muted/80 border-border text-foreground';
  }
};

/** Card body background (subtle) for non-pill area */
const getCardBodyBg = (type: ActivityType) => {
  const issueTypes: ActivityType[] = ['ccv_rejected', 'ccd', 'ticketing_failed', 'ancillary_failed', 'reissue_failed', 'refund_failed'];
  if (issueTypes.includes(type)) return 'bg-background/80';
  return 'bg-transparent';
};

/** Activity status (new / working / resolved / closed) – for multi-state display */
const getStatusLabel = (status?: ActivityStatus) => {
  if (!status) return null;
  switch (status) {
    case 'new': return 'New';
    case 'working': return 'In progress';
    case 'resolved': return 'Resolved';
    case 'closed': return 'Closed';
    default: return status;
  }
};
const getStatusStyles = (status?: ActivityStatus) => {
  return 'bg-muted text-muted-foreground border-border';
};

/** Left border color per activity type – solid 4px, same in light/dark so all cards match (incl. pnr, email, queue) */
const getLeftBorderClass = (type: ActivityType) => {
  const base = 'border-l-4';
  switch (type) {
    case 'pnr': return `${base} border-l-teal-600 dark:border-l-teal-400`;
    case 'email': return `${base} border-l-sky-600 dark:border-l-sky-400`;
    case 'queue': return `${base} border-l-amber-600 dark:border-l-amber-400`;
    case 'ccv_rejected': return `${base} border-l-red-600 dark:border-l-red-400`;
    case 'ccd': return `${base} border-l-amber-600 dark:border-l-amber-400`;
    case 'ticketing_failed': return `${base} border-l-orange-600 dark:border-l-orange-400`;
    case 'ancillary_failed': return `${base} border-l-violet-600 dark:border-l-violet-400`;
    case 'reissue_failed': return `${base} border-l-blue-600 dark:border-l-blue-400`;
    case 'refund_failed': return `${base} border-l-rose-600 dark:border-l-rose-400`;
    default: return `${base} border-l-gray-500 dark:border-l-gray-400`;
  }
};

/** Vertical flow steps. When cardStyle=true uses circle layout (for new menu design in both themes); colors depend on dark. */
function FlowTimeline({ steps, dark, cardStyle }: { steps: FlowStep[]; dark?: boolean; cardStyle?: boolean }) {
  const textCl = dark ? 'text-white' : 'text-foreground';
  const mutedCl = dark ? 'text-slate-400' : 'text-muted-foreground';
  const useCircles = dark || cardStyle;
  return (
    <div className="mt-3 space-y-2.5">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const firstPendingIndex = steps.findIndex((s) => s.status === 'pending');
        const isInProgress = step.status === 'pending' && i === firstPendingIndex;
        if (useCircles) {
          return (
            <div key={step.key} className="flex items-start gap-2">
              <div className="flex flex-col items-center shrink-0">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full border-2 flex shrink-0',
                    isCompleted && (dark ? 'bg-white border-white' : 'bg-foreground border-foreground'),
                    step.status === 'failed' && 'bg-red-400 border-red-400',
                    isInProgress && (dark ? 'bg-amber-400 border-amber-400' : 'bg-amber-500 border-amber-500'),
                    step.status === 'pending' && !isInProgress && (dark ? 'bg-transparent border-slate-500' : 'bg-transparent border-border')
                  )}
                />
                {!isLast && (
                  <span
                    className={cn(
                      'w-0.5 h-3 mt-0.5',
                      isCompleted ? (dark ? 'bg-white' : 'bg-foreground') : dark ? 'bg-slate-600' : 'bg-border'
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <span className={cn('text-xs', isCompleted || isInProgress ? textCl : mutedCl)}>{step.label}</span>
                {step.timestamp && <span className={cn('text-[11px] tabular-nums ml-1', mutedCl)}>{step.timestamp}</span>}
              </div>
            </div>
          );
        }
        return (
          <div key={step.key} className="flex items-center gap-2">
            {step.status === 'completed' && <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />}
            {step.status === 'failed' && <X className="h-3.5 w-3.5 text-destructive shrink-0" />}
            {step.status === 'pending' && <Hourglass className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className={cn('text-xs min-w-0', textCl)}>{step.label}</span>
            {step.timestamp && <span className={cn('text-[11px] tabular-nums shrink-0 ml-auto', mutedCl)}>{step.timestamp}</span>}
          </div>
        );
      })}
    </div>
  );
}

/** New menu card wrapper (all themes): header (planet + emoji + title + time) + body + right icon */
function ActivityMenuCard({
  item,
  timeStr,
  children,
  rightIcon,
  progress,
  isDark,
}: {
  item: ActivityItem;
  timeStr: string;
  children: React.ReactNode;
  rightIcon: React.ReactNode;
  progress?: number;
  isDark?: boolean;
}) {
  const isWarning = ['ccv_rejected', 'ccd', 'ticketing_failed', 'ancillary_failed', 'reissue_failed', 'refund_failed'].includes(item.type);
  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden shadow-lg',
        isDark
          ? 'border border-white/10 bg-slate-800/95'
          : 'border border-border bg-card'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 border-b',
          isDark ? 'border-white/10' : 'border-border'
        )}
      >
        <PlanetIcon className="w-5 h-5 shrink-0" />
        <span className="text-base shrink-0">{getActivityEmoji(item.type)}</span>
        <span
          className={cn(
            'flex-1 min-w-0 text-sm font-medium truncate',
            isWarning ? (isDark ? 'text-red-300' : 'text-destructive') : isDark ? 'text-white' : 'text-foreground'
          )}
        >
          {item.title}
        </span>
        <span className={cn('text-[11px] tabular-nums shrink-0', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
          {timeStr}
        </span>
        <CardRightIcon icon={rightIcon} progress={progress} isDark={isDark} />
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/** Pill-shaped header for timeline cards */
function PillHeader({
  type,
  title,
  showCheck,
  className,
}: {
  type: ActivityType;
  title: string;
  showCheck?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-full px-4 py-2.5 border flex items-center justify-between gap-2 min-h-[40px]',
        getPillGradient(type),
        className
      )}
    >
      <span className="text-sm font-medium truncate">{title}</span>
      {showCheck && <Check className="h-5 w-5 shrink-0 text-white/90" />}
    </div>
  );
}

/** Trusted customer emails (fraud: email from address not in this list) */
const TRUSTED_CUSTOMER_EMAILS = new Set(
  ['customer@example.com', 'info@ziyarahinternationaltravels.com', 'bookings@trustedagency.com'].map((e) => e.toLowerCase())
);

/** USA airport/city codes – origin outside this set = potential fraud (outside USA originating) */
const USA_ORIGIN_CODES = new Set([
  'SFO', 'LAX', 'JFK', 'ORD', 'DFW', 'ATL', 'MIA', 'SEA', 'DEN', 'BOS', 'LAS', 'MCO', 'EWR', 'PHX',
  'IAH', 'SGF', 'AZO', 'US', 'USA',
]);

function getPotentialFraud(item: ActivityItem): PotentialFraud {
  // 1. Email: from email not in trusted list
  if (item.type === 'email' && item.fromEmail) {
    const email = item.fromEmail.trim().toLowerCase();
    if (!TRUSTED_CUSTOMER_EMAILS.has(email)) {
      return { show: true, reason: 'From email not in trusted customers list' };
    }
  }

  // 2. System rejected (CCV, CCD, ticketing, reissue): advance purchase < 3 days (immediate travel)
  const systemRejectedTypes: ActivityType[] = ['ccv_rejected', 'ccd', 'ticketing_failed', 'reissue_failed'];
  if (systemRejectedTypes.includes(item.type) && item.journeyDate && item.bookedAt) {
    const journey = new Date(item.journeyDate).getTime();
    const booked = new Date(item.bookedAt).getTime();
    if (!Number.isNaN(journey) && !Number.isNaN(booked)) {
      const daysAdvance = (journey - booked) / (24 * 60 * 60 * 1000);
      if (daysAdvance < 3) return { show: true, reason: 'Immediate travel (advance purchase < 3 days)' };
    }
  }
  // Also use ccvInfo.journey if present for ccv_rejected
  if (item.type === 'ccv_rejected' && item.ccvInfo?.journey?.date && item.bookedAt) {
    const journey = new Date(item.ccvInfo.journey.date).getTime();
    const booked = new Date(item.bookedAt).getTime();
    if (!Number.isNaN(journey) && !Number.isNaN(booked)) {
      const daysAdvance = (journey - booked) / (24 * 60 * 60 * 1000);
      if (daysAdvance < 3) return { show: true, reason: 'Immediate travel (advance purchase < 3 days)' };
    }
  }

  // 3. Outside USA originating booking (e.g. SGN–HKG, HYD–AUS)
  if (item.origin) {
    const originUpper = item.origin.trim().toUpperCase();
    if (originUpper.length >= 2 && !USA_ORIGIN_CODES.has(originUpper)) {
      return { show: true, reason: 'Booking originating outside USA' };
    }
  }

  return { show: false };
}

function FraudAlertBanner({ reason }: { reason?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg bg-destructive/15 border-b border-destructive/30 text-destructive">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="text-xs font-semibold">Potential fraud</span>
      {reason && <span className="text-[11px] opacity-90">– {reason}</span>}
    </div>
  );
}

const isActionable = (item: ActivityItem) =>
  item.status === 'new' || item.status === 'working' || !item.status;

/** Renders the correct layout for each activity category; each category has a distinct design and shows multiple states (status + flow steps). */
function ActivityItemLayout({
  item,
  index,
  relativeTime,
  isActionable: isItemActionable,
  onItemClick,
  onAccept,
  getIcon,
  getActionLabel,
  expanded,
  onToggleExpand,
  variant = 'default',
}: {
  item: ActivityItem;
  index: number;
  relativeTime: (i: number) => string;
  isActionable: (i: ActivityItem) => boolean;
  onItemClick: (i: ActivityItem) => void;
  onAccept: (i: ActivityItem) => void;
  getIcon: (t: ActivityType) => React.ReactNode;
  getActionLabel: (t: ActivityType) => string;
  expanded: boolean;
  onToggleExpand: () => void;
  variant?: 'default' | 'darkCard' | 'lightCard';
}) {
  const timeStr = relativeTime(index);
  const statusLabel = getStatusLabel(item.status);
  const statusStyles = getStatusStyles(item.status);
  const dark = variant === 'darkCard';
  const isMenuCard = variant === 'darkCard' || variant === 'lightCard';
  const linkClass = dark
    ? 'text-xs font-medium text-sky-300 hover:underline shrink-0'
    : 'text-xs font-medium text-primary hover:underline shrink-0';
  const t1 = dark ? 'text-white' : 'text-foreground';
  const t2 = dark ? 'text-slate-400' : 'text-muted-foreground';
  const borderCl = dark ? 'border-white/10' : 'border-border';
  const cardRoot = isMenuCard
    ? 'bg-transparent border-0 rounded-none overflow-visible cursor-pointer'
    : '';

  // —— PNR: Timeline block (title, subtitle, steps, status chip, time; actions as links) ——
  if (item.type === 'pnr') {
    const fraud = getPotentialFraud(item);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onItemClick(item)}
        onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
        className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:bg-secondary/30 transition-colors", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}
      >
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div className={cn("space-y-2", !isMenuCard && "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={cn("text-sm font-semibold", t1)}>{item.title}</h3>
            {item.subtitle && <p className={cn("text-xs mt-0.5", t2)}>{item.subtitle}</p>}
          </div>
          {!isMenuCard && (
          <div className="flex items-center gap-1.5 shrink-0">
            {statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", statusStyles)}>{statusLabel}</span>}
            <span className={cn("text-[11px] tabular-nums", t2)}>{timeStr}</span>
          </div>
          )}
        </div>
        {item.flowSteps && item.flowSteps.length > 0 ? <FlowTimeline steps={item.flowSteps} dark={dark} cardStyle={isMenuCard} /> : null}
        {isItemActionable(item) && (
          <div className={cn("flex gap-3 pt-1 mt-2", `border-t ${borderCl}/50`)}>
            <button type="button" onClick={(e) => { e.stopPropagation(); onAccept(item); }} className={linkClass}>Accept</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={linkClass}>Details</button>
          </div>
        )}
        </div>
      </div>
    );
  }

  // —— Email: Message block (title, quote, status, time; Send Reply link) ——
  if (item.type === 'email') {
    const fraud = getPotentialFraud(item);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onItemClick(item)}
        onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
        className={cn(!isMenuCard && "rounded-lg border border-border bg-card/50 overflow-hidden cursor-pointer hover:bg-secondary/30 transition-colors", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}
      >
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div className={cn("space-y-2", !isMenuCard && "p-3")}>
        {!isMenuCard && (
        <div className="flex items-center justify-between gap-2">
          <h3 className={cn("text-sm font-medium", t1)}>{item.title}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", statusStyles)}>{statusLabel}</span>}
            <span className={cn("text-[11px]", t2)}>{timeStr}</span>
          </div>
        </div>
        )}
        {item.subtitle && <p className={cn("text-xs italic pl-2 border-l-2", t2, dark ? "border-white/20" : "border-border")}>&ldquo;{item.subtitle}&rdquo;</p>}
        {isItemActionable(item) && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={cn(linkClass, "inline-flex items-center gap-1")}>
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Send Reply
          </button>
        )}
        </div>
      </div>
    );
  }

  // —— Queue: Banner strip (single line, icon + title + time + Take action link) ——
  if (item.type === 'queue') {
    const fraud = getPotentialFraud(item);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onItemClick(item)}
        onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
        className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:bg-secondary/30 transition-colors", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}
      >
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div className={cn("flex items-center gap-3 py-2.5", !isMenuCard && "px-3")}>
        <AlertTriangle className={cn("h-4 w-4 shrink-0", dark ? "text-slate-400" : "text-muted-foreground")} />
        <div className="flex-1 min-w-0">
          <span className={cn("text-sm font-medium", t1)}>{item.title}</span>
          <span className={cn("text-xs ml-2", t2)}>{item.subtitle || 'Deadline approaching'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isMenuCard && statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", statusStyles)}>{statusLabel}</span>}
          {!isMenuCard && <span className={cn("text-[11px]", t2)}>{timeStr}</span>}
          {isItemActionable(item) && <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={linkClass}>Take action</button>}
        </div>
        </div>
      </div>
    );
  }

  // —— CCV Rejected: Inline alert row (icon, title, subtitle, flow steps, status, Review link) ——
  if (item.type === 'ccv_rejected') {
    const fraud = getPotentialFraud(item);
    return (
      <div className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}>
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onItemClick(item)}
          onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
          className={cn("cursor-pointer hover:bg-secondary/30 transition-colors", !isMenuCard && "p-3")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-2 min-w-0">
              <CreditCard className={cn("h-4 w-4 shrink-0 mt-0.5", dark ? "text-slate-400" : "text-muted-foreground")} />
              <div>
                <h3 className={cn("text-sm font-semibold", t1)}>{item.title}</h3>
                <p className={cn("text-xs mt-0.5", t2)}>{item.subtitle || 'CCV declined – review required'}</p>
              </div>
            </div>
            {!isMenuCard && (
            <div className="flex items-center gap-1.5 shrink-0">
              {statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", statusStyles)}>{statusLabel}</span>}
              <span className={cn("text-[11px]", t2)}>{timeStr}</span>
            </div>
            )}
          </div>
          {item.flowSteps && item.flowSteps.length > 0 && <FlowTimeline steps={item.flowSteps} dark={dark} cardStyle={isMenuCard} />}
        </div>
        {isItemActionable(item) && (
          <div className={cn("py-2 border-t border-border/50", !isMenuCard && "px-3", dark && "border-white/10")}>
            <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={cn(linkClass, "inline-flex items-center gap-1")}>
              <CreditCard className="h-3.5 w-3.5" /> Review CCV
            </button>
          </div>
        )}
      </div>
    );
  }

  // —— CCD: Table-like row (columns: icon | title | badge | status | link) ——
  if (item.type === 'ccd') {
    const fraud = getPotentialFraud(item);
    return (
      <div className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}>
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onItemClick(item)}
          onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
          className={cn("grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center cursor-pointer hover:bg-secondary/30 transition-colors min-w-0", !isMenuCard && "p-3")}
        >
          <Wallet className={cn("h-4 w-4 shrink-0", dark ? "text-slate-400" : "text-muted-foreground")} />
          <div className="min-w-0">
            <h3 className={cn("text-sm font-semibold truncate", t1)}>{item.title}</h3>
            {item.subtitle && <p className={cn("text-xs truncate", t2)}>{item.subtitle}</p>}
          </div>
          <span className={cn("text-[11px] tabular-nums shrink-0", t2)}>{item.badge}</span>
          {!isMenuCard && statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0", statusStyles)}>{statusLabel}</span>}
          {isItemActionable(item) && <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={linkClass}>Review</button>}
        </div>
        {item.flowSteps && item.flowSteps.length > 0 && (
          <div className={cn("pb-3 pt-0", !isMenuCard && "px-3")}>
            <FlowTimeline steps={item.flowSteps} dark={dark} cardStyle={isMenuCard} />
          </div>
        )}
      </div>
    );
  }

  // —— Ticketing failed: Expandable row (collapsed = one line; expanded = flow steps + link) ——
  if (item.type === 'ticketing_failed') {
    const fraud = getPotentialFraud(item);
    return (
      <div className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}>
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleExpand}
          onKeyDown={(e) => e.key === 'Enter' && onToggleExpand()}
          className={cn("flex items-center gap-2 cursor-pointer hover:bg-secondary/30 transition-colors", !isMenuCard && "p-3")}
        >
          <Ticket className={cn("h-4 w-4 shrink-0", dark ? "text-slate-400" : "text-muted-foreground")} />
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-sm font-semibold", t1)}>{item.title}</h3>
            {item.subtitle && <p className={cn("text-xs truncate", t2)}>{item.subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isMenuCard && statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", statusStyles)}>{statusLabel}</span>}
            {!isMenuCard && <span className={cn("text-[11px]", t2)}>{timeStr}</span>}
            {expanded ? <ChevronUp className={cn("h-4 w-4", dark ? "text-slate-400" : "text-muted-foreground")} /> : <ChevronDown className={cn("h-4 w-4", dark ? "text-slate-400" : "text-muted-foreground")} />}
          </div>
        </div>
        {expanded && (
          <>
            {item.flowSteps && item.flowSteps.length > 0 && <div className={cn("pb-2", !isMenuCard && "px-3")}><FlowTimeline steps={item.flowSteps} dark={dark} cardStyle={isMenuCard} /></div>}
            {isItemActionable(item) && (
              <div className={cn("py-2 border-t border-border/50", !isMenuCard && "px-3", dark && "border-white/10")}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={cn(linkClass, "inline-flex items-center gap-1")}>
                  {getIcon(item.type)} {getActionLabel(item.type)}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // —— Ancillary failed: Chip row (type chip + title + subtitle; steps; Fix link) ——
  if (item.type === 'ancillary_failed') {
    const fraud = getPotentialFraud(item);
    return (
      <div className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}>
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onItemClick(item)}
          onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
          className={cn("cursor-pointer hover:bg-secondary/30 transition-colors", !isMenuCard && "p-3")}
        >
          {!isMenuCard && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">Ancillary</span>
            {statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", statusStyles)}>{statusLabel}</span>}
            <span className={cn("text-[11px] ml-auto", t2)}>{timeStr}</span>
          </div>
          )}
          <h3 className={cn("text-sm font-semibold mt-1.5", t1)}>{item.title}</h3>
          {item.subtitle && <p className={cn("text-xs mt-0.5", t2)}>{item.subtitle}</p>}
          {item.flowSteps && item.flowSteps.length > 0 && <FlowTimeline steps={item.flowSteps} dark={dark} cardStyle={isMenuCard} />}
        </div>
        {isItemActionable(item) && (
          <div className={cn("py-2 border-t border-border/50", !isMenuCard && "px-3", dark && "border-white/10")}>
            <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={cn(linkClass, "inline-flex items-center gap-1")}>
              {getIcon(item.type)} {getActionLabel(item.type)}
            </button>
          </div>
        )}
      </div>
    );
  }

  // —— Reissue failed: Minimal strip (title left, Review link right) ——
  if (item.type === 'reissue_failed') {
    const fraud = getPotentialFraud(item);
    return (
      <div className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}>
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onItemClick(item)}
        onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
        className={cn("flex items-center justify-between gap-3 py-2 cursor-pointer hover:bg-secondary/30 transition-colors", !isMenuCard && "px-3")}
      >
        <div className="flex items-center gap-2 min-w-0">
          <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", dark ? "text-slate-400" : "text-muted-foreground")} />
          <span className={cn("text-sm font-medium truncate", t1)}>{item.title}</span>
          {!isMenuCard && statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0", statusStyles)}>{statusLabel}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isMenuCard && <span className={cn("text-[11px]", t2)}>{timeStr}</span>}
          {isItemActionable(item) && <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={linkClass}>Review</button>}
        </div>
      </div>
      </div>
    );
  }

  // —— Refund failed: Inline alert (same structure as CCV) ——
  if (item.type === 'refund_failed') {
    const fraud = getPotentialFraud(item);
    return (
      <div className={cn(!isMenuCard && "rounded-lg border border-border bg-card overflow-hidden", isMenuCard && cardRoot, !isMenuCard && getLeftBorderClass(item.type))}>
        {fraud.show && <FraudAlertBanner reason={fraud.reason} />}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onItemClick(item)}
          onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
          className={cn("cursor-pointer hover:bg-secondary/30 transition-colors", !isMenuCard && "p-3")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-2 min-w-0">
              <Receipt className={cn("h-4 w-4 shrink-0 mt-0.5", dark ? "text-slate-400" : "text-muted-foreground")} />
              <div>
                <h3 className={cn("text-sm font-semibold", t1)}>{item.title}</h3>
                <p className={cn("text-xs mt-0.5", t2)}>{item.subtitle || 'Refund failed – review required'}</p>
              </div>
            </div>
            {!isMenuCard && (
            <div className="flex items-center gap-1.5 shrink-0">
              {statusLabel && <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", statusStyles)}>{statusLabel}</span>}
              <span className={cn("text-[11px]", t2)}>{timeStr}</span>
            </div>
            )}
          </div>
          {item.flowSteps && item.flowSteps.length > 0 && <FlowTimeline steps={item.flowSteps} dark={dark} cardStyle={isMenuCard} />}
        </div>
        {isItemActionable(item) && (
          <div className={cn("py-2 border-t border-border/50", !isMenuCard && "px-3", dark && "border-white/10")}>
            <button type="button" onClick={(e) => { e.stopPropagation(); onItemClick(item); }} className={cn(linkClass, "inline-flex items-center gap-1")}>
              <Receipt className="h-3.5 w-3.5" /> Review refund
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback for unknown type
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onItemClick(item)}
      onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
      className={cn(!dark && "rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/30", dark && cardRoot)}
    >
      <h3 className={cn("text-sm font-semibold", t1)}>{item.title}</h3>
      {item.subtitle && <p className={cn("text-xs mt-1", t2)}>{item.subtitle}</p>}
      {!isMenuCard && <span className={cn("text-[11px]", t2)}>{timeStr}</span>}
    </div>
  );
}

export function ActivityPanel({
  items,
  workedCases,
  onItemClick,
  onAccept,
  onReject,
  onChatClick,
  onSendMessage,
  onWorkedCaseClick,
  collapsed = false,
  onToggle,
}: ActivityPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('activity');
  const [bottomMode, setBottomMode] = useState<BottomMode>('avatar');
  const [avatarMessages, setAvatarMessages] = useState<AvatarChatMessage[]>([]);
  const [avatarInput, setAvatarInput] = useState('');
  const [chatTabMessages, setChatTabMessages] = useState<AvatarChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const avatarScrollRef = useRef<HTMLDivElement>(null);
  const chatTabScrollRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen not supported or denied
    }
  };

  useEffect(() => {
    avatarScrollRef.current?.scrollTo({ top: avatarScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [avatarMessages]);

  useEffect(() => {
    chatTabScrollRef.current?.scrollTo({ top: chatTabScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatTabMessages]);

  const relativeTime = (index: number) => {
    if (index === 0) return 'JUST NOW';
    if (index === 1) return '5M AGO';
    if (index === 2) return '14M AGO';
    return items[index]?.timestamp ?? '';
  };

  const getActionLabel = (type: ActivityType) => {
    switch (type) {
      case 'ccv_rejected': return 'REVIEW CCV';
      case 'ccd': return 'RESOLVE PAYMENT';
      case 'ticketing_failed': return 'FIX TICKETING';
      case 'ancillary_failed': return 'FIX ANCILLARIES';
      case 'reissue_failed': return 'REVIEW REISSUE';
      case 'refund_failed': return 'REVIEW REFUND';
      default: return 'REVIEW';
    }
  };

  /* Collapsed rail: expand, live hint + quick icons, chat at bottom */
  if (collapsed) {
    return (
      <aside className="w-14 h-full flex flex-col bg-card/80 border-r border-border shrink-0 backdrop-blur-xl">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open activity panel"
          className="p-3 border-b border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        {/* Middle: label + quick-access icons (expand panel on click) */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 py-4">
          <div className="flex flex-col items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-badge-queue animate-pulse-glow" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode('activity');
                onToggle?.();
              }}
              aria-label="Open activity stream"
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Radio className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('spaces');
                onToggle?.();
              }}
              aria-label="Open my spaces"
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors relative"
            >
              <FolderOpen className="h-5 w-5" />
              {workedCases.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {workedCases.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="p-2 border-t border-border">
          <button
            onClick={onChatClick}
            aria-label="Open chat"
            className="w-full py-2 flex items-center justify-center rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <TravelAssistantAvatar size={9} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "w-full h-full flex flex-col min-h-0 min-w-[200px] border-r shadow-soft",
        isDark
          ? "border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950"
          : "border-border bg-card/90 backdrop-blur-xl"
      )}
    >
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        {/* Top: View toggle + Activity list or Spaces */}
        <ResizablePanel defaultSize={65} minSize={25} maxSize={88} className="min-h-0 flex flex-col">
          {/* View Toggle */}
          <div
            className={cn(
              "p-2 flex gap-1 border-b shrink-0",
              isDark ? "border-white/10 bg-slate-900/80" : "border-border"
            )}
          >
            <button
              onClick={() => setViewMode('activity')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2",
                viewMode === 'activity'
                  ? isDark ? "bg-white/15 text-white" : "bg-secondary text-foreground"
                  : isDark ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Radio className="h-4 w-4" />
              ACTIVITY
            </button>
            <button
              onClick={() => setViewMode('spaces')}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2",
                viewMode === 'spaces'
                  ? isDark ? "bg-white/15 text-white" : "bg-secondary text-foreground"
                  : isDark ? "text-slate-400 hover:text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen className="h-4 w-4" />
              SPACES
              {workedCases.length > 0 && (
                <span
                  className={cn(
                    "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                    isDark ? "bg-violet-500 text-white" : "bg-primary text-primary-foreground"
                  )}
                >
                  {workedCases.length}
                </span>
              )}
            </button>
          </div>

          {viewMode === 'activity' ? (
            <>
              {/* LIVE MOTION header */}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 border-b shrink-0",
                  isDark ? "border-white/10 bg-slate-900/50" : "border-border"
                )}
              >
                <LiveMotionIcon className={cn("h-5 w-5 shrink-0", isDark ? "text-violet-400" : "text-primary")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-foreground")}>LIVE MOTION</p>
                  <p className={cn("text-xs truncate", isDark ? "text-violet-300" : "text-primary")}>MONITORING ACTIVE</p>
                </div>
                <button
                  type="button"
                  className={cn("p-1.5 rounded-md", isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-muted text-muted-foreground hover:text-foreground")}
                  aria-label="Filter"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onToggle}
                  aria-label="Hide activity panel"
                  className={cn("p-1.5 rounded-md", isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Activity list – new menu card design in all themes (light + dark) */}
              <div
                className={cn(
                  "flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-3",
                  isDark && "bg-gradient-to-b from-slate-900/30 to-transparent"
                )}
              >
                {items.map((item, index) => {
                  const steps = item.flowSteps ?? [];
                  const completed = steps.filter((s) => s.status === 'completed').length;
                  const progress = steps.length > 0 ? completed / steps.length : 0;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "animate-slide-up",
                        item.isNew && (isDark ? "ring-1 ring-violet-400/40 rounded-xl" : "ring-1 ring-primary/30 rounded-xl")
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ActivityMenuCard
                        item={item}
                        timeStr={relativeTime(index)}
                        rightIcon={getIcon(item.type)}
                        progress={progress}
                        isDark={isDark}
                      >
                        <ActivityItemLayout
                          variant={isDark ? 'darkCard' : 'lightCard'}
                          item={item}
                          index={index}
                          relativeTime={relativeTime}
                          isActionable={isActionable}
                          onItemClick={onItemClick}
                          onAccept={onAccept}
                          getIcon={getIcon}
                          getActionLabel={getActionLabel}
                          expanded={expandedActivityId === item.id}
                          onToggleExpand={() => setExpandedActivityId((id) => (id === item.id ? null : item.id))}
                        />
                      </ActivityMenuCard>
                    </div>
                  );
                })}
              </div>
        </>
      ) : (
        <SpacesPanel workedCases={workedCases} onCaseClick={onWorkedCaseClick} />
      )}
        </ResizablePanel>

        <ResizableHandle withHandle className={cn("data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:after:top-1/2", isDark ? "bg-white/10" : "bg-border")} />
        <ResizablePanel defaultSize={35} minSize={12} maxSize={75} className={cn("min-h-0 flex flex-col overflow-hidden", isDark && "bg-slate-900/50")}>
      {/* Avatar section: toggle (Avatar | Chat) + avatar + conversation below */}
      <div className={cn("flex-1 min-h-0 border-t flex flex-col min-w-0", isDark ? "border-white/10" : "border-border")}>
        {/* Toggle: Avatar mode | Chat mode */}
        <div className={cn("flex gap-1 p-2 border-b", isDark ? "border-white/10" : "border-border/60")}>
          <button
            type="button"
            onClick={() => setBottomMode('avatar')}
            aria-label="Talk with avatar"
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
              bottomMode === 'avatar'
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-secondary/50 border border-transparent"
            )}
          >
            <Bot className="h-4 w-4" />
            Avatar
          </button>
          <button
            type="button"
            onClick={() => setBottomMode('chat')}
            aria-label="Open main chat"
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
              bottomMode === 'chat'
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-secondary/50 border border-transparent"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
        </div>

        {bottomMode === 'avatar' ? (
          <>
            {/* Full-panel avatar: image fills space, label + chat + input overlaid at bottom */}
            <div className="flex flex-col flex-1 min-h-0 relative">
              {/* Full-bleed avatar image */}
              <div className="absolute inset-0">
                <img
                  src={travelAssistantAvatar}
                  alt="Travel Assistant"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              {/* Bottom overlay: gradient + label + messages + input */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col min-h-[160px] pt-12 pb-0 bg-gradient-to-t from-background/98 via-background/75 to-transparent">
                <span className="text-sm font-semibold text-foreground px-3 text-center">Travel Assistant</span>
                <div
                  ref={avatarScrollRef}
                  className="flex-1 min-h-0 max-h-[120px] overflow-y-auto px-3 py-2 space-y-2"
                >
                  {avatarMessages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Send a message to start the conversation.</p>
                  )}
                  {avatarMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex gap-2",
                        m.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {m.role === 'assistant' && (
                        <TravelAssistantAvatar size={6} />
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-xs",
                          m.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary border border-border text-foreground"
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  className="p-2 flex gap-2 shrink-0"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = avatarInput.trim();
                    if (!text) return;
                    const userMsg: AvatarChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
                    setAvatarMessages((prev) => [...prev, userMsg]);
                    setAvatarInput('');
                    setTimeout(() => {
                      const assistantMsg: AvatarChatMessage = {
                        id: `a-${Date.now()}`,
                        role: 'assistant',
                        content: "I'm your Travel Assistant. I can help with PNRs, ticketing, and search. Try /add-flight in the main chat for more.",
                      };
                      setAvatarMessages((prev) => [...prev, assistantMsg]);
                    }, 600);
                  }}
                >
                  <Input
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    placeholder="Type here..."
                    className="flex-1 min-w-0 h-8 text-xs bg-background/95"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0 bg-background/95 border-border"
                    aria-label="Voice input"
                    title="Voice input"
                  >
                    <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!avatarInput.trim()}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
                <div className="px-2 pb-1 flex justify-center">
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Hide status bar (fullscreen)'}
                  >
                    {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    <span>{isFullscreen ? 'Exit fullscreen' : 'Hide status bar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 min-h-0 flex flex-col min-w-0">
              {chatTabMessages.length === 0 ? (
                <div className="flex-1 min-h-0 flex items-center justify-center px-4">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={onChatClick}
                      aria-label="Open main chat"
                      className="rounded-xl flex items-center justify-center p-3 hover:bg-muted/50 transition-colors"
                    >
                      <MessageCircle
                        className="h-10 w-10 text-primary"
                        strokeWidth={1.5}
                      />
                    </button>
                    <span className="text-xs text-muted-foreground">Open main chat</span>
                  </div>
                </div>
              ) : (
                <div
                  ref={chatTabScrollRef}
                  className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2"
                >
                  {chatTabMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex gap-2",
                        m.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {m.role === 'assistant' && (
                        <TravelAssistantAvatar size={6} />
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-xs",
                          m.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary border border-border text-foreground"
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Chatbar at bottom when Chat tab is selected — messages stay in left panel only */}
            <form
              className="p-2 border-t border-border flex gap-2 shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                const text = chatInput.trim();
                if (!text) return;
                const userMsg: AvatarChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
                setChatTabMessages((prev) => [...prev, userMsg]);
                setChatInput('');
                setTimeout(() => {
                  const assistantMsg: AvatarChatMessage = {
                    id: `a-${Date.now()}`,
                    role: 'assistant',
                    content: `Processing your request... I'm analyzing "${text}" and will provide results shortly. You can open the main chat for PNR, itinerary, and full AI features.`,
                  };
                  setChatTabMessages((prev) => [...prev, assistantMsg]);
                }, 600);
              }}
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type here..."
                className="flex-1 min-w-0 h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Hide status bar (fullscreen)'}
                title={isFullscreen ? 'Exit fullscreen' : 'Hide status bar'}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!chatInput.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </>
        )}
      </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </aside>
  );
}
