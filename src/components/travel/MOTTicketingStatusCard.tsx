import { Check, Loader2 } from 'lucide-react';

interface MOTTicketingStatusCardProps {
  pnrOrRef: string;
  steps: { label: string; status: 'pending' | 'progress' | 'done' }[];
}

export function MOTTicketingStatusCard({ pnrOrRef, steps }: MOTTicketingStatusCardProps) {
  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Ticketing status – {pnrOrRef}</h3>
      </div>
      <div className="p-4 space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.status === 'done' && <Check className="h-5 w-5 text-green-600 shrink-0" />}
            {step.status === 'progress' && <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />}
            {step.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 shrink-0" />}
            <span className={step.status === 'done' ? 'text-foreground' : step.status === 'progress' ? 'text-primary font-medium' : 'text-muted-foreground'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
