import { FolderOpen, Clock, CheckCircle, Loader } from 'lucide-react';
import { WorkedCase, ActivityStatus } from '@/types/crm';
import { cn } from '@/lib/utils';

interface SpacesPanelProps {
  workedCases: WorkedCase[];
  onCaseClick: (caseItem: WorkedCase) => void;
}

const getStatusIcon = (status: ActivityStatus) => {
  switch (status) {
    case 'working':
      return <Loader className="h-3.5 w-3.5 animate-spin" />;
    case 'resolved':
      return <CheckCircle className="h-3.5 w-3.5" />;
    case 'closed':
      return <CheckCircle className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
};

const getStatusStyles = (status: ActivityStatus) => {
  switch (status) {
    case 'working':
      return 'text-gds-amadeus';
    case 'resolved':
      return 'text-badge-queue';
    case 'closed':
      return 'text-muted-foreground';
    default:
      return 'text-primary';
  }
};

export function SpacesPanel({ workedCases, onCaseClick }: SpacesPanelProps) {
  const workingCases = workedCases.filter(c => c.status === 'working');
  const resolvedCases = workedCases.filter(c => c.status === 'resolved' || c.status === 'closed');

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <FolderOpen className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-sm text-foreground">MY SPACES</h2>
          <div className="text-xs text-muted-foreground">
            {workedCases.length} case{workedCases.length !== 1 ? 's' : ''} in progress
          </div>
        </div>
      </div>

      {/* Working Cases */}
      {workingCases.length > 0 && (
        <div className="p-3">
          <div className="text-xs text-muted-foreground uppercase mb-2 px-1">Currently Working</div>
          <div className="space-y-2">
            {workingCases.map((item) => (
              <button
                key={item.id}
                onClick={() => onCaseClick(item)}
                className={cn(
                  "w-full text-left p-3 rounded-xl bg-secondary/50 border border-gds-amadeus/30",
                  "hover:bg-secondary transition-all duration-200"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary">PNR: {item.pnr}</span>
                  <span className={cn("flex items-center gap-1", getStatusStyles(item.status))}>
                    {getStatusIcon(item.status)}
                  </span>
                </div>
                <div className="text-sm text-foreground truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.lastWorked}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Cases */}
      {resolvedCases.length > 0 && (
        <div className="p-3">
          <div className="text-xs text-muted-foreground uppercase mb-2 px-1">Resolved Today</div>
          <div className="space-y-2">
            {resolvedCases.map((item) => (
              <button
                key={item.id}
                onClick={() => onCaseClick(item)}
                className={cn(
                  "w-full text-left p-3 rounded-xl bg-secondary/30 border border-border",
                  "hover:bg-secondary/50 transition-all duration-200 opacity-70"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">PNR: {item.pnr}</span>
                  <span className={cn("flex items-center gap-1", getStatusStyles(item.status))}>
                    {getStatusIcon(item.status)}
                    <span className="text-xs capitalize">{item.status}</span>
                  </span>
                </div>
                <div className="text-sm text-muted-foreground truncate">{item.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {workedCases.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">
          <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <div className="text-sm">No cases in your space yet</div>
          <div className="text-xs mt-1">Select a case from the activity stream</div>
        </div>
      )}
    </div>
  );
}
