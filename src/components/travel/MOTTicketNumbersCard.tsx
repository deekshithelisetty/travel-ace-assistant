import { Ticket, CheckCircle2 } from 'lucide-react';

interface MOTTicketNumbersCardProps {
  pnrOrRef: string;
  numbers: string[];
}

export function MOTTicketNumbersCard({ pnrOrRef, numbers }: MOTTicketNumbersCardProps) {
  return (
    <div className="w-full max-w-md bg-card border border-green-500/20 rounded-xl overflow-hidden shadow-sm mt-2 bg-green-500/5">
      <div className="px-4 py-3 border-b border-green-500/20 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-semibold">Ticket numbers – {pnrOrRef}</h3>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {numbers.map((num, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background border border-border font-mono text-sm"
            >
              <Ticket className="h-4 w-4 text-muted-foreground" />
              {num}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
