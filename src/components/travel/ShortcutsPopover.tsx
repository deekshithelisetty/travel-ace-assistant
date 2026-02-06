import { CommandSuggestion } from '@/types/crm';
import { cn } from '@/lib/utils';

interface ShortcutsPopoverProps {
  type: '/' | '@' | '#';
  onSelect: (value: string) => void;
  visible: boolean;
}

const slashCommands: CommandSuggestion[] = [
  { command: '/searchpnr', description: 'Search for a PNR across all GDS' },
  { command: '/rebook', description: 'Initiate rebooking workflow' },
  { command: '/refund', description: 'Process refund request' },
  { command: '/cancel', description: 'Cancel booking' },
  { command: '/close-case', description: 'Finalize and notify traveler' },
  { command: '/itinerary', description: 'View full itinerary' },
  { command: '/sync', description: 'Sync PNR with GDS' },
];

const atMentions = [
  { command: '@john.doe', description: 'John Doe - Senior Agent' },
  { command: '@mary.smith', description: 'Mary Smith - Supervisor' },
  { command: '@support.team', description: 'Support Team' },
  { command: '@admin', description: 'System Administrator' },
];

const hashTags = [
  { command: '#urgent', description: 'Mark as urgent priority' },
  { command: '#escalation', description: 'Route to escalation team' },
  { command: '#refunds', description: 'Refunds processing team' },
  { command: '#corporate', description: 'Corporate travel team' },
  { command: '#vip', description: 'VIP customer handling' },
];

export function ShortcutsPopover({ type, onSelect, visible }: ShortcutsPopoverProps) {
  if (!visible) return null;

  const items = type === '/' ? slashCommands : type === '@' ? atMentions : hashTags;
  const title = type === '/' ? 'Commands' : type === '@' ? 'Assign to' : 'Route to Team';

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground uppercase">{title}</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.command}
            onClick={() => onSelect(item.command)}
            className={cn(
              "w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors",
              "flex items-center gap-3"
            )}
          >
            <span className="text-primary font-mono text-sm">{item.command}</span>
            <span className="text-xs text-muted-foreground truncate">{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
