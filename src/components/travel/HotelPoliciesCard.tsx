import { HotelPolicies } from '@/types/crm';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface HotelPoliciesCardProps {
  hotelName: string;
  policies: HotelPolicies;
}

export function HotelPoliciesCard({ hotelName, policies }: HotelPoliciesCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between gap-2 hover:bg-secondary/70 transition-colors text-left"
      >
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Hotel policies – {hotelName}
        </h3>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted-foreground">Check-in</span>
            <span>{policies.checkIn}</span>
            <span className="text-muted-foreground">Check-out</span>
            <span>{policies.checkOut}</span>
          </div>
          {policies.checkInInstructions && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">Check-in instructions</div>
              <p className="text-xs">{policies.checkInInstructions}</p>
            </div>
          )}
          {policies.cancellationPolicy && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">Cancellation</div>
              <p className="text-xs">{policies.cancellationPolicy}</p>
            </div>
          )}
          {policies.parking && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">Parking</div>
              <p className="text-xs">{policies.parking}</p>
            </div>
          )}
          {policies.childrenAndBeds && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">Children & beds</div>
              <p className="text-xs">{policies.childrenAndBeds}</p>
            </div>
          )}
          {policies.pets && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">Pets</div>
              <p className="text-xs">{policies.pets}</p>
            </div>
          )}
          {policies.optionalFees && policies.optionalFees.length > 0 && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">Optional fees</div>
              <ul className="text-xs list-disc list-inside space-y-0.5">
                {policies.optionalFees.map((fee, i) => (
                  <li key={i}>{fee}</li>
                ))}
              </ul>
            </div>
          )}
          {policies.general && policies.general.length > 0 && (
            <div>
              <div className="text-muted-foreground text-xs font-medium mb-0.5">General</div>
              <p className="text-xs">{policies.general.join(' · ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
