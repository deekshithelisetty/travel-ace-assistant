import { useState } from 'react';
import { Radio, SlidersHorizontal, Mail, Plane, Users, MessageCircle, FolderOpen, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ActivityItem, ActivityType, WorkedCase } from '@/types/crm';
import { cn } from '@/lib/utils';
import { SpacesPanel } from './SpacesPanel';

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
          {/* Header with collapse */}
          <div className="p-4 flex items-center justify-between border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Radio className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm text-foreground truncate">LIVE STREAM</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-badge-queue animate-pulse-glow shrink-0" />
                  <span className="text-xs text-badge-queue font-medium">MONITORING</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label="Filters"
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onToggle}
                aria-label="Hide activity panel"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Activity List - well organized cards with Accept/Reject */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={cn(
                  "rounded-xl border bg-card shadow-sm overflow-hidden animate-slide-up",
                  "border-l-4 transition-all duration-200",
                  item.type === 'pnr' && "border-l-badge-pnr",
                  item.type === 'email' && "border-l-badge-email",
                  item.type === 'queue' && "border-l-badge-queue",
                  item.isNew && "ring-1 ring-primary/30"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onItemClick(item)}
                  onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
                  className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
                >
                  {/* Top row: badge + status + time */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border shrink-0",
                      getBadgeStyles(item.type)
                    )}>
                      {item.badge}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'resolved' && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-badge-queue">
                          Resolved
                        </span>
                      )}
                      <time className="text-[11px] font-medium text-muted-foreground tabular-nums">
                        {item.timestamp}
                      </time>
                    </div>
                  </div>
                  {/* Title - clear hierarchy */}
                  <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
                    {item.title}
                  </h3>
                  {/* Subtitle / details */}
                  {item.subtitle && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getIcon(item.type)}
                      <span className="font-mono truncate">{item.subtitle}</span>
                    </div>
                  )}
                  {item.caseId && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="text-[11px] text-muted-foreground">ID: {item.caseId}</span>
                      {item.status === 'closed' && (
                        <span className="text-[11px] text-muted-foreground">Closed</span>
                      )}
                    </div>
                  )}
                </div>
                {/* Accept / Reject - only for actionable items */}
                {isActionable(item) && (
                  <div className="flex border-t border-border/60 bg-secondary/20 px-3 py-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onAccept(item); }}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                        "bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onReject(item); }}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                        "bg-transparent border border-border text-muted-foreground hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <SpacesPanel workedCases={workedCases} onCaseClick={onWorkedCaseClick} />
      )}

      {/* Chat Button - glacy wireframe-style icon, no background */}
      <div className="p-4 shrink-0 border-t border-border">
        <button
          onClick={onChatClick}
          aria-label="New Case"
          className="w-full py-3 px-4 rounded-xl bg-transparent flex items-center justify-center hover:bg-secondary/50 transition-colors duration-200 group"
        >
          <MessageCircle
            className="h-8 w-8 chat-icon-glacy pointer-events-none"
            strokeWidth={1.5}
          />
          <span className="sr-only">New Case</span>
        </button>
      </div>
    </aside>
  );
}
