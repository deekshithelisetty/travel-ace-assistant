import { HotelOption } from '@/types/crm';
import { Building2, Star, ArrowRight, Wifi } from 'lucide-react';

interface HotelChatCardProps {
  options: HotelOption[];
  onViewAll: () => void;
  onSelect: (option: HotelOption) => void;
}

export function HotelChatCard({ options, onViewAll, onSelect }: HotelChatCardProps) {
  const displayOptions = options.slice(0, 5);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Top Hotel Options
        </h3>
        <span className="text-xs text-muted-foreground">{options.length} found</span>
      </div>
      <div className="divide-y divide-border">
        {displayOptions.map((opt) => (
          <div
            key={opt.id}
            className="p-3 hover:bg-secondary/30 transition-colors cursor-pointer group"
            onClick={() => onSelect(opt)}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{opt.name}</span>
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: opt.starRating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </span>
              </div>
              <span className="font-bold text-primary">{opt.pricePerNight}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-1 line-clamp-1">{opt.address}</div>
            {opt.distance && (
              <div className="text-xs text-muted-foreground mb-1">{opt.distance}</div>
            )}
            {opt.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {opt.amenities.slice(0, 3).map((a) => (
                  <span key={a} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Wifi className="h-2.5 w-2.5" />
                    {a}
                  </span>
                ))}
              </div>
            )}
            {(opt.rating != null || opt.totalPrice) && (
              <div className="flex justify-between items-center mt-2 text-xs">
                {opt.rating != null && (
                  <span className="px-1.5 py-0.5 rounded bg-secondary border border-border">
                    {opt.rating}/10 {opt.reviewCount != null && `(${opt.reviewCount})`}
                  </span>
                )}
                <span className="text-muted-foreground">Total {opt.totalPrice}</span>
              </div>
            )}
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
                Add to trip
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
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
