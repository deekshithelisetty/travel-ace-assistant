import { HotelRoomOption } from '@/types/crm';
import { Bed, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotelRoomOptionsCardProps {
  hotelName: string;
  options: HotelRoomOption[];
  onSelect: (option: HotelRoomOption) => void;
}

export function HotelRoomOptionsCard({ hotelName, options, onSelect }: HotelRoomOptionsCardProps) {
  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bed className="h-4 w-4 text-primary" />
          Room options – {hotelName}
        </h3>
      </div>
      <div className="divide-y divide-border p-3 space-y-3">
        {options.map((opt) => (
          <div
            key={opt.id}
            className="p-3 rounded-lg border border-border bg-secondary/20 hover:border-primary/40 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-sm">{opt.roomType}</div>
                <div className="text-xs text-muted-foreground">
                  {opt.bedType}
                  {opt.roomSize && ` · ${opt.roomSize}`}
                  {opt.sleeps != null && ` · Sleeps ${opt.sleeps}`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{opt.pricePerNight}</div>
                <div className="text-xs text-muted-foreground">Total {opt.totalPrice}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{opt.cancellationPolicy}</div>
            {opt.features?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {opt.features.slice(0, 4).map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
                  >
                    <Check className="h-2.5 w-2.5 text-green-600" />
                    {f}
                  </span>
                ))}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => onSelect(opt)}
            >
              Select room <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
