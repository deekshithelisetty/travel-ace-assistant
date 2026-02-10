import {
  Plane,
  FileText,
  Shield,
  Users,
  Ticket,
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ItinerarySegment,
  InvoiceSummary,
  TravelerSummary,
  TripActivityEvent,
  CCVInfo,
} from '@/types/crm';

const segmentBg = 'bg-muted/40 border border-border/60 rounded-xl';

export function ItineraryCard({
  pnr,
  ref: refNum,
  segments,
}: {
  pnr: string;
  ref: string;
  segments: ItinerarySegment[];
}) {
  return (
    <div className={cn('mt-4 overflow-hidden rounded-xl border border-border bg-card/80 shadow-soft', segmentBg)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Plane className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Itinerary</span>
        <span className="text-xs text-muted-foreground ml-auto">PNR {pnr} · Ref {refNum}</span>
      </div>
      <div className="p-4 space-y-3">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="flex flex-col items-center text-muted-foreground min-w-[3rem]">
              <span className="font-mono font-medium text-foreground">{seg.departure.airport}</span>
              <span className="text-xs">{seg.departure.time}</span>
              <span className="text-xs">{seg.departure.date}</span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{seg.duration}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {seg.airline} {seg.flightNumber}
              </span>
              <span className="text-xs text-muted-foreground">{seg.cabin}</span>
            </div>
            <div className="flex flex-col items-center text-muted-foreground text-right min-w-[3rem]">
              <span className="font-mono font-medium text-foreground">{seg.arrival.airport}</span>
              <span className="text-xs">{seg.arrival.time}</span>
              <span className="text-xs">{seg.arrival.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InvoiceCard({ data }: { data: InvoiceSummary }) {
  return (
    <div className={cn('mt-4 overflow-hidden rounded-xl border border-border bg-card/80 shadow-soft', segmentBg)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Invoice</span>
        <span className={cn('ml-auto text-xs font-medium px-2 py-0.5 rounded', data.status === 'TICKETED' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
          {data.status}
        </span>
      </div>
      <div className="p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Invoice #</span>
          <span className="font-mono font-medium">{data.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span>{data.invoiceDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ref #</span>
          <span className="font-mono">{data.refNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">PNR</span>
          <span className="font-mono">{data.pnr}</span>
        </div>
        {data.itinerarySummary && (
          <div className="pt-2 border-t border-border">
            <span className="text-muted-foreground text-xs">Trip</span>
            <p className="text-xs font-medium mt-0.5">{data.itinerarySummary}</p>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-border font-semibold">
          <span>Total</span>
          <span className="text-primary">{data.currency} {data.totalDue}</span>
        </div>
      </div>
    </div>
  );
}

/** Structured Payomo / CCV summary – no inner box; flows inside message bubble */
export function PayomoSummaryCard({ data }: { data: CCVInfo }) {
  const v = data.validations;
  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary shrink-0" />
        <span className="font-semibold text-sm text-foreground">Payomo / CCV summary — PNR {data.pnr}</span>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Status</div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className={cn('px-2 py-1 rounded-md text-xs font-medium', data.status === 'DECLINED' ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-700 dark:text-green-400')}>
            {data.status}
          </span>
          <span className={cn('px-2 py-1 rounded-md text-xs font-medium', data.highRisk ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-700 dark:text-green-400')}>
            High risk: {data.highRisk ? 'Yes' : 'No'}
          </span>
          <span className={cn('px-2 py-1 rounded-md text-xs font-medium', data.proceedFulfillment ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400')}>
            Proceed fulfillment: {data.proceedFulfillment ? 'Yes' : 'No'}
          </span>
          <span className="text-xs text-muted-foreground">
            Identity check score: <span className="font-medium text-foreground">{data.identityCheckScore}</span>
            <span className="mx-2 text-muted-foreground/70">·</span>
            Identity network score: <span className="font-medium text-foreground">{data.identityNetworkScore}</span>
          </span>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Validation</div>
        <div className="flex flex-wrap gap-2">
          <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium', v.phone.valid ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive')}>
            Phone: {v.phone.valid ? 'Valid' : 'Invalid'}{v.phone.match === false ? ' (no match)' : ''}
          </span>
          <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium', v.email.valid ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive')}>
            Email: {v.email.valid ? 'Valid' : 'Invalid'}{v.email.match === false ? ' (no match)' : ''}
          </span>
          <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium', v.address.valid ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive')}>
            Address: {v.address.valid ? 'Valid' : 'Invalid'}{v.address.match === false ? ' (no match)' : ''}
          </span>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Customer</div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-foreground">
          <div><dt className="text-muted-foreground inline">Name </dt><dd className="inline font-medium">{data.customer.name}</dd></div>
          <div><dt className="text-muted-foreground inline">Phone </dt><dd className="inline font-mono">{data.customer.phone}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground inline">Email </dt><dd className="inline font-mono break-all">{data.customer.email}</dd></div>
          <div><dt className="text-muted-foreground inline">IP </dt><dd className="inline font-mono">{data.customer.ipAddress}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground inline">Billing </dt><dd className="inline">{data.customer.billingAddress}</dd></div>
        </dl>
      </div>

      {data.journey && (
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Journey</div>
          <div className="text-sm text-foreground">
            <span className="font-medium">{data.journey.route}</span>
            <span className="text-muted-foreground mx-2">·</span>
            <span>{data.journey.date}</span>
          </div>
        </div>
      )}

      <p className="pt-2 text-sm text-muted-foreground border-t border-border/60">
        Review the above. If <span className="font-medium text-foreground">not fraud</span>, reply with <em>verified good</em> or <em>passed</em> to proceed to ticketing. If <span className="font-medium text-foreground">fraud</span>, reply with <em>verified bad</em> or <em>decline</em> to close the case.
      </p>
    </div>
  );
}

export function CCVStatusCard({
  status,
  highRisk,
  proceedFulfillment,
  identityCheckScore,
  validations,
}: {
  status: string;
  highRisk: boolean;
  proceedFulfillment: boolean;
  identityCheckScore?: number;
  validations?: { phone: { valid: boolean }; email: { valid: boolean }; address: { valid: boolean } };
}) {
  return (
    <div className={cn('mt-4 overflow-hidden rounded-xl border border-border bg-card/80 shadow-soft', segmentBg)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Shield className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">CCV / Payment status</span>
        <span className={cn('ml-auto text-xs font-medium px-2 py-0.5 rounded', status === 'APPROVED' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-destructive/20 text-destructive')}>
          {status}
        </span>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <span className={cn('px-2 py-1 rounded text-xs font-medium', highRisk ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-700 dark:text-green-400')}>
            High risk: {highRisk ? 'Yes' : 'No'}
          </span>
          <span className={cn('px-2 py-1 rounded text-xs font-medium', proceedFulfillment ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400')}>
            Proceed fulfillment: {proceedFulfillment ? 'Yes' : 'No'}
          </span>
        </div>
        {identityCheckScore != null && (
          <div className="text-muted-foreground text-xs">
            Identity check score: <span className="font-medium text-foreground">{identityCheckScore}</span>
          </div>
        )}
        {validations && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            <div className={cn('rounded-lg p-2 text-center text-xs', validations.phone.valid ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive')}>
              Phone: {validations.phone.valid ? 'Valid' : 'Invalid'}
            </div>
            <div className={cn('rounded-lg p-2 text-center text-xs', validations.email.valid ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive')}>
              Email: {validations.email.valid ? 'Valid' : 'Invalid'}
            </div>
            <div className={cn('rounded-lg p-2 text-center text-xs', validations.address.valid ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive')}>
              Address: {validations.address.valid ? 'Valid' : 'Invalid'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TravelersCard({ travelers }: { travelers: TravelerSummary[] }) {
  return (
    <div className={cn('mt-4 overflow-hidden rounded-xl border border-border bg-card/80 shadow-soft', segmentBg)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Users className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Travelers</span>
        <span className="text-xs text-muted-foreground ml-auto">{travelers.length} passenger(s)</span>
      </div>
      <div className="p-4 space-y-2">
        {travelers.map((t, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
            <div>
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.type}{t.dob ? ` · ${t.dob}` : ''} · {t.status}</p>
            </div>
            {t.eTicket && <span className="font-mono text-xs text-primary">{t.eTicket}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TicketInfoCard({ tickets }: { tickets: { ticketNumbers: string[]; pnr: string; travelerName?: string }[] }) {
  return (
    <div className={cn('mt-4 overflow-hidden rounded-xl border border-border bg-card/80 shadow-soft', segmentBg)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Ticket className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Ticket information</span>
      </div>
      <div className="p-4 space-y-2">
        {tickets.map((t, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 py-2 border-b border-border/60 last:border-0">
            {t.travelerName && <span className="text-sm font-medium">{t.travelerName}</span>}
            <span className="text-xs text-muted-foreground">PNR {t.pnr}</span>
            <div className="flex flex-wrap gap-1">
              {t.ticketNumbers.map((num, j) => (
                <span key={j} className="font-mono text-xs px-2 py-1 rounded bg-primary/10 text-primary">{num}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitiesCard({ events, title = 'Activity' }: { events: TripActivityEvent[]; title?: string }) {
  const Icon = title === 'Life Cycle' ? RefreshCw : Activity;
  return (
    <div className={cn('mt-4 overflow-hidden rounded-xl border border-border bg-card/80 shadow-soft', segmentBg)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Icon className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs text-muted-foreground ml-auto">{events.length} event(s)</span>
      </div>
      <div className="p-4">
        <div className="relative space-y-0">
          {events.map((evt, i) => (
            <div key={evt.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < events.length - 1 && <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border" />}
              <div className={cn('shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-background', evt.status === 'SUCCESS' ? 'bg-green-500/20' : evt.status === 'FAILURE' ? 'bg-destructive/20' : 'bg-muted')}>
                {evt.status === 'SUCCESS' ? <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> : evt.status === 'FAILURE' ? <XCircle className="h-3.5 w-3.5 text-destructive" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{evt.action}</p>
                {evt.detail && <p className="text-xs text-muted-foreground mt-0.5">{evt.detail}</p>}
                {evt.actor && <p className="text-xs text-muted-foreground mt-0.5">{evt.actor}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{evt.timestamp}</p>
              </div>
              <span className={cn('shrink-0 text-xs font-medium px-2 py-0.5 rounded', evt.status === 'SUCCESS' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : evt.status === 'FAILURE' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground')}>
                {evt.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CancelPnrResultCard({ pnr, cancelled, message }: { pnr: string; cancelled: boolean; message: string }) {
  return (
    <div className={cn('mt-4 rounded-xl border p-4', cancelled ? 'border-green-500/30 bg-green-500/10' : 'border-destructive/30 bg-destructive/10')}>
      <div className="flex items-center gap-2">
        {cancelled ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-destructive" />}
        <span className="font-semibold text-sm">{cancelled ? 'PNR cancelled' : 'Cancellation issue'}</span>
      </div>
      <p className="text-sm mt-2">PNR <span className="font-mono font-medium">{pnr}</span></p>
      <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
    </div>
  );
}
