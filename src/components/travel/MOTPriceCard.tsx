import { MOTPriceOption } from '@/types/crm';
import { CreditCard, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MOTPriceCardProps {
  pnrOrRef: string;
  options: MOTPriceOption[];
  onSelect: (option: MOTPriceOption) => void;
}

export function MOTPriceCard({ pnrOrRef, options, onSelect }: MOTPriceCardProps) {
  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Price quote – {pnrOrRef}
        </h3>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">Select a price to proceed with payment and billing.</p>
        {options.map((opt) => (
          <div
            key={opt.id}
            className="p-3 rounded-lg border border-border bg-secondary/20 hover:border-primary/40 transition-colors flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              {opt.isLowest && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 mb-1">
                  <Tag className="h-3 w-3" /> LOWEST FARE
                </span>
              )}
              <div className="font-bold text-primary text-lg">
                {opt.currency}{opt.amount}
              </div>
              {(opt.platingCarrier || opt.bookingClass) && (
                <div className="text-xs text-muted-foreground mt-1">
                  {opt.platingCarrier && `Plating carrier: ${opt.platingCarrier}`}
                  {opt.bookingClass && ` · Booking Class: ${opt.bookingClass}`}
                  {opt.fareBasis && ` · ${opt.fareBasis}`}
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20"
              onClick={() => onSelect(opt)}
            >
              Select <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
