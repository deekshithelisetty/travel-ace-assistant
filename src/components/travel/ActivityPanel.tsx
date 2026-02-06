import { useState } from 'react';
import { Radio, SlidersHorizontal, Mail, Plane, Users, MessageCircle, FolderOpen } from 'lucide-react';
import { ActivityItem, ActivityType, WorkedCase } from '@/types/crm';
import { cn } from '@/lib/utils';
import { SpacesPanel } from './SpacesPanel';

interface ActivityPanelProps {
  items: ActivityItem[];
  workedCases: WorkedCase[];
  onItemClick: (item: ActivityItem) => void;
  onChatClick: () => void;
  onWorkedCaseClick: (workedCase: WorkedCase) => void;
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

export function ActivityPanel({ items, workedCases, onItemClick, onChatClick, onWorkedCaseClick }: ActivityPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('activity');

  return (
    <aside className="w-80 h-full flex flex-col bg-card border-r border-border">
      {/* View Toggle */}
      <div className="p-2 flex gap-1 border-b border-border">
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
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Radio className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-foreground">LIVE STREAM</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-badge-queue animate-pulse-glow" />
                  <span className="text-xs text-badge-queue font-medium">MONITORING</span>
                </div>
              </div>
            </div>
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className={cn(
                  "w-full text-left p-4 rounded-xl bg-secondary/50 border border-border",
                  "hover:bg-secondary hover:border-primary/30 transition-all duration-200",
                  "group animate-slide-up",
                  item.isNew && "border-primary/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold border",
                    getBadgeStyles(item.type)
                  )}>
                    {item.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.status === 'resolved' && (
                      <span className="text-xs text-badge-queue font-medium">RESOLVED</span>
                    )}
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                </div>
                <h3 className="font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                {item.subtitle && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getIcon(item.type)}
                    <span className="font-mono">{item.subtitle}</span>
                  </div>
                )}
                {item.caseId && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">ID: {item.caseId}</span>
                    {item.status === 'closed' && (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <SpacesPanel workedCases={workedCases} onCaseClick={onWorkedCaseClick} />
      )}

      {/* Chat Button */}
      <div className="p-4">
        <button
          onClick={onChatClick}
          className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:glow-cyan transition-all duration-200"
        >
          <MessageCircle className="h-5 w-5" />
          NEW CASE
        </button>
      </div>
    </aside>
  );
}
