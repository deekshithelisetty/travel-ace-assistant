import { useState, useRef } from 'react';
import { FlightOption } from '@/types/crm';
import { Plane, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlightChatCardProps {
  options: FlightOption[];
  onViewAll: () => void;
  onSelect: (option: FlightOption) => void;
}

export function FlightChatCard({ options, onViewAll, onSelect }: FlightChatCardProps) {
  const displayOptions = options.slice(0, 6);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (i: number) => {
    const next = Math.max(0, Math.min(i, displayOptions.length - 1));
    setIndex(next);
    scrollRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" />
          Top Flight Options
        </h3>
        <span className="text-xs text-muted-foreground">{options.length} found</span>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 p-4 snap-x snap-mandatory scroll-smooth hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayOptions.map((opt, i) => (
            <div
              key={opt.id}
              className={cn(
                'flex-shrink-0 w-64 snap-center rounded-xl border border-border bg-card/80 p-4',
                'hover:border-primary/40 hover:shadow-md transition-all cursor-pointer'
              )}
              onClick={() => onSelect(opt)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{opt.airline}</span>
                  <span className="text-xs text-muted-foreground">{opt.flightNumber}</span>
                </div>
                <span className="font-bold text-primary">${opt.price}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <span>{opt.departureTime}</span>
                <div className="h-px flex-1 bg-border relative min-w-[24px]">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-border" />
                </div>
                <span>{opt.arrivalTime}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Clock className="h-3 w-3" />
                {opt.duration}
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{opt.origin} → {opt.destination}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-secondary border border-border">
                  {opt.stops === 0 ? 'Non-stop' : `${opt.stops} stop${opt.stops > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs font-medium text-primary">Select →</span>
              </div>
            </div>
          ))}
        </div>
        {displayOptions.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollTo(index - 1)}
              disabled={index === 0}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-secondary"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(index + 1)}
              disabled={index >= displayOptions.length - 1}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-foreground disabled:opacity-40 disabled:pointer-events-none hover:bg-secondary"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <div className="p-2 bg-secondary/30 border-t border-border">
        <button
          onClick={onViewAll}
          className="w-full py-2 text-xs font-medium text-primary hover:bg-secondary rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          View all results
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
