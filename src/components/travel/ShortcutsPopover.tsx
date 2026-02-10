import { CommandSuggestion } from '@/types/crm';
import { cn } from '@/lib/utils';

export const slashCommands: CommandSuggestion[] = [
  { command: '/add-flight', description: 'Search and add flights' },
  { command: '/add-hotels', description: 'Search and add hotels' },
  { command: '/add-cars', description: 'Search and add car rentals' },
  { command: '/MerchantPay Terminal', description: 'Payment flow: PNR, invoice, charge card or vCard' },
  { command: '/searchpnr', description: 'Search for a PNR across all GDS' },
  { command: '/rebook', description: 'Initiate rebooking workflow' },
  { command: '/refund', description: 'Process refund request' },
  { command: '/cancel', description: 'Cancel booking' },
  { command: '/close-case', description: 'Finalize and notify traveler' },
  { command: '/itinerary', description: 'View full itinerary' },
  { command: '/sync', description: 'Sync PNR with GDS' },
];

export const atMentions: CommandSuggestion[] = [
  { command: '@john.doe', description: 'John Doe - Senior Agent' },
  { command: '@mary.smith', description: 'Mary Smith - Supervisor' },
  { command: '@support.team', description: 'Support Team' },
  { command: '@admin', description: 'System Administrator' },
];

export const hashTags: CommandSuggestion[] = [
  { command: '#urgent', description: 'Mark as urgent priority' },
  { command: '#escalation', description: 'Route to escalation team' },
  { command: '#refunds', description: 'Refunds processing team' },
  { command: '#corporate', description: 'Corporate travel team' },
  { command: '#vip', description: 'VIP customer handling' },
];

interface ShortcutsPopoverProps {
  type: '/' | '@' | '#';
  items: CommandSuggestion[];
  selectedIndex: number;
  onSelect: (value: string) => void;
  visible: boolean;
}

export function ShortcutsPopover({ type, items, selectedIndex, onSelect, visible }: ShortcutsPopoverProps) {
  if (!visible) return null;

  const title = type === '/' ? 'Commands' : type === '@' ? 'Assign to' : 'Route to Team';

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 glass-panel overflow-hidden animate-fade-in z-50">
      <div className="px-3 py-2 border-b border-border/80">
        <span className="text-xs text-muted-foreground uppercase">{title}</span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.command}
            type="button"
            onClick={() => onSelect(item.command)}
            className={cn(
              "w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3",
              index === selectedIndex ? "bg-primary/15 border-l-2 border-primary" : "hover:bg-secondary/50"
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
