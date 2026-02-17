import { useState, useRef } from 'react';
import { HotelOption } from '@/types/crm';
import { Building2, Star, ArrowRight, Wifi, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HotelChatCardProps {
  options: HotelOption[];
  onViewAll: () => void;
  onSelect: (option: HotelOption) => void;
}

export function HotelChatCard({ options, onViewAll, onSelect }: HotelChatCardProps) {
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
          <Building2 className="h-4 w-4 text-primary" />
          Top Hotel Options
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-sm truncate">{opt.name}</span>
                  <span className="flex items-center gap-0.5 text-amber-500 shrink-0">
                    {Array.from({ length: opt.starRating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                </div>
                <span className="font-bold text-primary text-sm shrink-0">{opt.pricePerNight}</span>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{opt.address}</div>
              {opt.distance && (
                <div className="text-xs text-muted-foreground mb-2">{opt.distance}</div>
              )}
              {opt.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {opt.amenities.slice(0, 3).map((a) => (
                    <span key={a} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Wifi className="h-2.5 w-2.5" />
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {(opt.rating != null || opt.totalPrice) && (
                <div className="flex justify-between items-center text-xs mb-2">
                  {opt.rating != null && (
                    <span className="px-1.5 py-0.5 rounded bg-secondary border border-border">
                      {opt.rating}/10
                    </span>
                  )}
                  <span className="text-muted-foreground">Total {opt.totalPrice}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Add to trip
                  <ArrowRight className="h-3 w-3" />
                </span>
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
