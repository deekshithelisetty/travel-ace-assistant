import { Filter } from 'lucide-react';
import { SearchResult, GDSType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface SearchResultsTableProps {
  title: string;
  results: SearchResult[];
  onProcess: (pnr: string) => void;
}

const getGDSBadgeStyle = (gds: GDSType) => {
  switch (gds) {
    case 'SBR':
      return 'bg-gds-sabre/20 text-gds-sabre border-gds-sabre/30';
    case 'AMD':
      return 'bg-gds-amadeus/20 text-gds-amadeus border-gds-amadeus/30';
    case 'WSP':
      return 'bg-gds-worldspan/20 text-gds-worldspan border-gds-worldspan/30';
  }
};

export function SearchResultsTable({ title, results, onProcess }: SearchResultsTableProps) {
  return (
    <div className="bg-secondary/50 border border-border rounded-2xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {title}
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
          {results.length} MATCHES FOUND
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">GDS</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">PNR</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Passenger</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">TTL</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((result, index) => (
              <tr 
                key={index} 
                className="hover:bg-secondary/50 transition-colors"
              >
                <td className="px-5 py-4">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded text-xs font-bold border",
                    getGDSBadgeStyle(result.gds)
                  )}>
                    {result.gds}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-mono font-semibold text-foreground">
                    {result.pnr}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {result.passenger}
                </td>
                <td className="px-5 py-4">
                  <span className={cn(
                    "font-mono text-sm",
                    result.status === 'urgent' && "text-destructive",
                    result.status === 'warning' && "text-gds-amadeus",
                    result.status === 'normal' && "text-badge-queue"
                  )}>
                    {result.ttl} <span className="text-muted-foreground">GMT</span>
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onProcess(result.pnr)}
                    className="text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
                  >
                    PROCESS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
