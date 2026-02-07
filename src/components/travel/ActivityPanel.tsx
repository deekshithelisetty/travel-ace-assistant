import { useState } from 'react';
import { Radio, SlidersHorizontal, Mail, Plane, Users, MessageCircle, FolderOpen, Check, X, ChevronLeft, ChevronRight, RefreshCw, PenLine, AlertTriangle, CreditCard } from 'lucide-react';
import { ActivityItem, ActivityType, WorkedCase } from '@/types/crm';
import { cn } from '@/lib/utils';
import { SpacesPanel } from './SpacesPanel';

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
  onWorkedCaseClick: (workedCase: WorkedCase) => void;
  /** When true, panel is collapsed to a narrow rail. Default false (expanded). */
  collapsed?: boolean;
  onToggle?: () => void;
}

type ViewMode = 'activity' | 'spaces';

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
  }
};

const isActionable = (item: ActivityItem) =>
  item.status === 'new' || item.status === 'working' || !item.status;

export function ActivityPanel({
  items,
  workedCases,
  onItemClick,
  onAccept,
  onReject,
  onChatClick,
  onWorkedCaseClick,
  collapsed = false,
  onToggle,
}: ActivityPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('activity');

  const relativeTime = (index: number) => {
    if (index === 0) return 'JUST NOW';
    if (index === 1) return '5M AGO';
    if (index === 2) return '14M AGO';
    return items[index]?.timestamp ?? '';
  };

  const timelineDotColor = (type: ActivityType) => {
    switch (type) {
      case 'pnr': return 'bg-primary';
      case 'email': return 'bg-badge-email';
      case 'queue': return 'bg-badge-queue';
      case 'ccv_rejected': return 'bg-destructive';
    }
  };

  /* Collapsed rail: expand, live hint + quick icons, chat at bottom */
  if (collapsed) {
    return (
      <aside className="w-14 h-full flex flex-col bg-card border-r border-border shrink-0">
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
            aria-label="New Case"
            className="w-full py-2 flex items-center justify-center rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <MessageCircle
              className="h-8 w-8 chat-icon-glacy pointer-events-none"
              strokeWidth={1.5}
            />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full flex flex-col bg-card border-r border-border shrink-0 min-h-0">
      {/* View Toggle */}
      <div className="p-2 flex gap-1 border-b border-border shrink-0">
        <button
          onClick={() => setViewMode('activity')}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2",
            viewMode === 'activity'
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
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
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FolderOpen className="h-4 w-4" />
          SPACES
          {workedCases.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {workedCases.length}
            </span>
          )}
        </button>
      </div>

      {viewMode === 'activity' ? (
        <>
          {/* LIVE MOTION header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0">
            <LiveMotionIcon className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">LIVE MOTION</p>
              <p className="text-xs text-primary truncate">MONITORING ACTIVE</p>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Filter"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-label="Hide activity panel"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Timeline activity list */}
          <div className="flex-1 min-h-0 overflow-y-auto py-3 pl-4 pr-3">
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {items.map((item, index) => (
                <div key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className={cn(
                    "relative z-10 mt-1.5 w-4 h-4 rounded-full shrink-0 border-2 border-background",
                    timelineDotColor(item.type)
                  )} />
                  <article
                    className={cn(
                      "flex-1 min-w-0 rounded-xl border bg-card shadow-sm overflow-hidden animate-slide-up border-border transition-all duration-200",
                      item.isNew && "ring-1 ring-primary/30"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onItemClick(item)}
                      onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
                      className="p-3 cursor-pointer hover:bg-secondary/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-foreground leading-tight">
                            {item.title}
                          </h3>
                          {item.subtitle && item.type !== 'email' && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                          )}
                        </div>
                        <time className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0 uppercase">
                          {relativeTime(index)}
                        </time>
                      </div>
                      {item.type === 'pnr' && (
                        <div className="space-y-1.5 mt-2 text-xs text-foreground">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 text-green-500" />
                              Payment Verified
                            </span>
                            <span className="text-muted-foreground tabular-nums">09:12 AM</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                              Ticketing Started
                            </span>
                            <span className="text-muted-foreground tabular-nums">{item.timestamp}</span>
                          </div>
                        </div>
                      )}
                      {item.type === 'email' && item.subtitle && (
                        <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                          &ldquo;{item.subtitle}&rdquo;
                        </p>
                      )}
                      {item.type === 'queue' && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-foreground">
                          <AlertTriangle className="h-4 w-4 text-badge-queue shrink-0" />
                          <span>{item.subtitle || 'Ticketing Deadline approaching'}</span>
                        </div>
                      )}
                      {item.type === 'ccv_rejected' && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-foreground">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                          <span>{item.subtitle || 'CCV declined – review required'}</span>
                        </div>
                      )}
                    </div>
                    {isActionable(item) && (
                      <div className="flex border-t border-border/60 bg-secondary/20 px-3 py-2 gap-2">
                        {item.type === 'pnr' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onAccept(item); }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
                            >
                              ACCEPT
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-transparent border border-border text-foreground hover:bg-secondary"
                            >
                              DETAILS
                            </button>
                          </>
                        )}
                        {item.type === 'email' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-transparent border border-border text-foreground hover:bg-secondary"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                            QUICK REPLY
                          </button>
                        )}
                        {item.type === 'queue' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-badge-queue text-white hover:opacity-90"
                          >
                            TAKE ACTION
                          </button>
                        )}
                        {item.type === 'ccv_rejected' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            REVIEW CCV
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <SpacesPanel workedCases={workedCases} onCaseClick={onWorkedCaseClick} />
      )}

      {/* New case – chat bubble with glow (minimal) */}
      <div className="p-4 shrink-0 border-t border-border flex items-center justify-center">
        <button
          onClick={onChatClick}
          aria-label="New Case"
          className="rounded-xl flex items-center justify-center p-3 hover:bg-muted/50 transition-colors"
        >
          <MessageCircle
            className="h-10 w-10 chat-icon-glacy pointer-events-none"
            strokeWidth={1.5}
          />
        </button>
      </div>
    </aside>
  );
}
