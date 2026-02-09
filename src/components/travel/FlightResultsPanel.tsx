import { FlightOption } from '@/types/crm';
import { Plane, ChevronLeft, ChevronRight, Filter, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FlightResultsPanelProps {
  options: FlightOption[];
  onSelect: (option: FlightOption) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function FlightResultsPanel({
  options,
  onSelect,
  collapsed = true,
  onToggle,
}: FlightResultsPanelProps) {

  /* Collapsed rail: only icons at bottom + expand button */
  if (collapsed) {
    return (
      <aside className="w-14 h-full flex flex-col bg-card border-l border-border shrink-0">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open flight results panel"
          className="p-3 border-b border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-h-0 flex flex-col items-center pt-4 gap-4">
             <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Plane className="h-5 w-5" />
             </div>
             <span className="text-[10px] uppercase font-bold text-muted-foreground rotate-180 writing-vertical-rl">
                Flight Results
             </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 h-full flex flex-col bg-card border-l border-border shrink-0 min-h-0 transition-all duration-300">
      {/* Header with collapse - always visible */}
      <div className="shrink-0 p-4 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide truncate min-w-0 flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            FLIGHT RESULTS ({options.length})
        </h2>
        <div className="flex items-center gap-1">
             <button
              type="button"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
            type="button"
            onClick={onToggle}
            aria-label="Hide flight results panel"
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
            <ChevronRight className="h-5 w-5" />
            </button>
        </div>
      
      </div>

      {/* Scrollable middle content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {options.map((opt) => (
             <div 
             key={opt.id}
             className="bg-secondary/30 border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
             onClick={() => onSelect(opt)}
           >
             <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        {/* Placeholder generic logo if none provided */}
                       <Plane className="h-4 w-4 text-zinc-800" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block">{opt.airline}</span>
                    <span className="text-xs text-muted-foreground">{opt.flightNumber}</span>
                  </div>
                  
               </div>
               <span className="font-bold text-lg text-primary">${opt.price}</span>
             </div>
             
             <div className="flex items-center justify-between text-sm mb-3">
               <div className="text-center">
                 <div className="font-semibold text-lg">{opt.departureTime}</div>
                 <div className="text-xs text-muted-foreground">{opt.origin}</div>
               </div>

                <div className="flex-1 px-4 flex flex-col items-center">
                    <div className="text-[10px] text-muted-foreground mb-1">{opt.duration}</div>
                    <div className="w-full h-px bg-border relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-border" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-border" />
                        {opt.stops > 0 && (
                             <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-muted-foreground bg-card" />
                        )}
                    </div>
                     <div className="text-[10px] text-muted-foreground mt-1">
                        {opt.stops === 0 ? 'Non-stop' : `${opt.stops} stop${opt.stops > 1 ? 's' : ''}`}
                     </div>
                </div>

               <div className="text-center">
                 <div className="font-semibold text-lg">{opt.arrivalTime}</div>
                 <div className="text-xs text-muted-foreground">{opt.destination}</div>
               </div>
             </div>
            
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
                <Plane className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No flights found.</p>
            </div>
        )}
      </div>
    </aside>
  );
}
