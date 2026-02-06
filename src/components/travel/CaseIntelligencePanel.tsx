import { Shield, Inbox, UserCheck, Zap, CheckCircle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { CaseIntelligence, TimelineEvent } from '@/types/crm';
import { cn } from '@/lib/utils';

interface CaseIntelligencePanelProps {
  intelligence: CaseIntelligence | null;
  userInitials: string;
  userName: string;
  /** When true, panel is collapsed and only a narrow rail with icons is shown. Default true (hidden by default). */
  collapsed?: boolean;
  onToggle?: () => void;
}

const getTimelineIcon = (type: TimelineEvent['icon']) => {
  switch (type) {
    case 'received':
      return <Inbox className="h-4 w-4" />;
    case 'assignment':
      return <UserCheck className="h-4 w-4" />;
    case 'gds':
      return <Zap className="h-4 w-4" />;
    case 'resolution':
      return <CheckCircle className="h-4 w-4" />;
  }
};

const getTimelineIconBg = (type: TimelineEvent['icon']) => {
  switch (type) {
    case 'received':
      return 'bg-muted text-muted-foreground';
    case 'assignment':
      return 'bg-badge-queue/20 text-badge-queue';
    case 'gds':
      return 'bg-gds-amadeus/20 text-gds-amadeus';
    case 'resolution':
      return 'bg-primary/20 text-primary';
  }
};

export function CaseIntelligencePanel({
  intelligence,
  userInitials,
  userName,
  collapsed = true,
  onToggle,
}: CaseIntelligencePanelProps) {
  /* Collapsed rail: only icons at bottom + expand button */
  if (collapsed) {
    return (
      <aside className="w-14 h-full flex flex-col bg-card border-l border-border shrink-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open case intelligence panel"
          className="p-3 border-b border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-h-0" />
        <div className="p-2 border-t border-border flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label="Open panel"
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {userInitials}
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 h-full flex flex-col bg-card border-l border-border shrink-0 min-h-0">
      {/* Header with collapse - always visible */}
      <div className="shrink-0 p-4 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide truncate min-w-0">CASE INTELLIGENCE</h2>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Hide case intelligence panel"
          className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable middle content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Complexity Score */}
        {intelligence && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase">Complexity Score</div>
                <div className="text-lg font-semibold text-foreground">
                  Low ({intelligence.complexityScore}/{intelligence.maxScore})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {intelligence && intelligence.timeline.length > 0 && (
          <div className="p-4 border-b border-border">
            <div className="space-y-4">
              {intelligence.timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    getTimelineIconBg(event.icon)
                  )}>
                    {getTimelineIcon(event.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{event.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{event.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{event.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SLA Status */}
        {intelligence && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase">SLA Status</span>
              <span className="text-sm font-semibold text-primary">{intelligence.slaPercentage}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${intelligence.slaPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Efficiency Chart */}
        {intelligence && (
          <div className="p-4 border-b border-border">
            <div className="text-xs text-muted-foreground uppercase mb-3">Efficiency (Last 24H)</div>
            <div className="flex items-end gap-1.5 h-20">
              {intelligence.efficiencyData.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-primary/30 rounded-sm transition-all duration-300 hover:bg-primary/50"
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {!intelligence && (
          <div className="p-4 text-sm text-muted-foreground">
            Open a case to see intelligence here.
          </div>
        )}
      </div>

      {/* User Info + Settings - always visible at bottom */}
      <div className="shrink-0 p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{userName}</div>
            <div className="text-xs text-primary uppercase tracking-wide">Performance Peak</div>
          </div>
          <button
            type="button"
            aria-label="Settings"
            className="shrink-0 p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
