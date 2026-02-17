import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import type { AncillaryOption } from '@/types/crm';
import { cn } from '@/lib/utils';

interface AncillaryOptionsCardProps {
  pnr: string;
  items: AncillaryOption[];
  onAddToPnr: (selectedIds: string[]) => void;
  /** When set, show "Continue" button (for flight booking flow); calls onContinue(selectedIds) and button is always enabled */
  continueMode?: boolean;
  onContinue?: (selectedIds: string[]) => void;
}

const typeLabel: Record<AncillaryOption['type'], string> = {
  seat: 'Seat',
  baggage: 'Baggage',
  meal: 'Meal',
  insurance: 'Insurance',
  lounge: 'Lounge',
  other: 'Other',
};

export function AncillaryOptionsCard({ pnr, items, onAddToPnr, continueMode, onContinue }: AncillaryOptionsCardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddToPnr = () => {
    const ids = Array.from(selectedIds);
    if (continueMode && onContinue) {
      onContinue(ids);
      return;
    }
    if (ids.length === 0) return;
    onAddToPnr(ids);
    setSelectedIds(new Set());
  };

  const isContinue = continueMode && onContinue;
  const buttonEnabled = isContinue || selectedIds.size > 0;

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Available ancillaries
        </h3>
        <span className="text-xs text-muted-foreground">PNR {pnr}</span>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-secondary/30',
                isSelected && 'bg-primary/5'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(item.id)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{item.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground capitalize">{typeLabel[item.type]}</span>
                  {item.detail && <span className="text-xs text-muted-foreground">· {item.detail}</span>}
                </div>
              </div>
              {item.price != null && (
                <span className="text-sm font-semibold text-primary shrink-0">{item.price}</span>
              )}
            </label>
          );
        })}
      </div>
      <div className="p-3 bg-secondary/30 border-t border-border">
        <button
          type="button"
          onClick={handleAddToPnr}
          disabled={!buttonEnabled}
          className={cn(
            'w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors',
            buttonEnabled
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {isContinue ? (
            <>Continue {selectedIds.size > 0 ? `(${selectedIds.size} selected)` : '(Skip add-ons)'}</>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} to PNR
            </>
          )}
        </button>
      </div>
    </div>
  );
}
