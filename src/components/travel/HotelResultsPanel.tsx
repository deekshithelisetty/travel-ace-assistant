import { HotelOption } from '@/types/crm';
import { Building2, ChevronLeft, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HotelResultsPanelProps {
  options: HotelOption[];
  onSelect: (option: HotelOption) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  searchLocation?: string;
}

export function HotelResultsPanel({
  options,
  onSelect,
  collapsed = true,
  onToggle,
  searchLocation,
}: HotelResultsPanelProps) {
  if (collapsed) {
    return (
      <aside className="w-14 h-full flex flex-col bg-card border-l border-border shrink-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open hotel results panel"
          className="p-3 border-b border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-h-0 flex flex-col items-center pt-4 gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground rotate-180 writing-vertical-rl">
            Hotel Results
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 h-full flex flex-col bg-card border-l border-border shrink-0 min-h-0 transition-all duration-300">
      <div className="shrink-0 p-4 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide truncate min-w-0 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          HOTEL RESULTS ({options.length})
        </h2>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Hide hotel results panel"
          className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {options.map((opt) => (
          <div
            key={opt.id}
            className={cn(
              'bg-secondary/30 border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md'
            )}
            onClick={() => onSelect(opt)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-sm flex items-center gap-1">
                  {opt.name}
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: opt.starRating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">{opt.address}</div>
              </div>
              <span className="font-bold text-primary text-lg shrink-0 ml-2">{opt.pricePerNight}</span>
            </div>
            {opt.rating != null && (
              <div className="text-xs text-muted-foreground mb-2">
                {opt.rating}/10
                {opt.reviewCount != null && ` · ${opt.reviewCount} reviews`}
              </div>
            )}
            <Button
              size="sm"
              className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20"
            >
              Select <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ))}
        {options.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No hotels found.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
