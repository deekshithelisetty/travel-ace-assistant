import { CheckCircle, Plane, RefreshCw } from 'lucide-react';
import { PNRData } from '@/types/crm';
import { cn } from '@/lib/utils';

interface PNRDetailCardProps {
  data: PNRData;
  onViewReceipt?: () => void;
  onSyncPNR?: () => void;
}

export function PNRDetailCard({ data, onViewReceipt, onSyncPNR }: PNRDetailCardProps) {
  return (
    <div className="bg-secondary/50 border border-border rounded-2xl p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-badge-queue/20 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-badge-queue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Rebooking confirmed</h3>
            <p className="text-sm text-foreground">for {data.pnr}</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
          <span className="text-xs font-bold text-primary">LIVE SYNC</span>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground mb-5">
        Sabre PNR Master Record Updated Successfully
      </p>

      {/* Flight Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="text-xs text-muted-foreground uppercase mb-1">Flight Status</div>
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{data.flightStatus}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase mb-1">New Itinerary</div>
          <div className="text-sm font-medium text-primary">{data.route}</div>
          <div className="text-sm text-primary">{data.date}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase mb-1">Passenger</div>
          <div className="text-sm font-medium text-foreground">{data.passenger}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase mb-1">E-Ticket</div>
          <div className="text-sm font-mono text-foreground">{data.eTicket}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onViewReceipt}
          className="flex-1 py-3 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-muted transition-colors"
        >
          VIEW RECEIPT
        </button>
        <button
          onClick={onSyncPNR}
          className={cn(
            "flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
            "bg-primary text-primary-foreground hover:glow-cyan"
          )}
        >
          <RefreshCw className="h-4 w-4" />
          SYNC PNR
        </button>
      </div>
    </div>
  );
}
