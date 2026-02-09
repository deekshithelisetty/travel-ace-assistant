import { FlightOption } from '@/types/crm';
import { Plane, Clock, ArrowRight } from 'lucide-react';

interface FlightChatCardProps {
  options: FlightOption[];
  onViewAll: () => void;
  onSelect: (option: FlightOption) => void;
}

export function FlightChatCard({ options, onViewAll, onSelect }: FlightChatCardProps) {
  const displayOptions = options.slice(0, 5);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" />
          Top Flight Options
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
                 <span className="font-bold text-sm">{opt.airline}</span>
                 <span className="text-xs text-muted-foreground">{opt.flightNumber}</span>
              </div>
              <span className="font-bold text-primary">${opt.price}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{opt.departureTime}</span>
                <div className="h-px w-8 bg-border relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-border" />
                </div>
                <span>{opt.arrivalTime}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {opt.duration}
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>{opt.origin} → {opt.destination}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-secondary border border-border group-hover:border-primary/30 transition-colors">
                {opt.stops === 0 ? 'Non-stop' : `${opt.stops} stop${opt.stops > 1 ? 's' : ''}`}
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
