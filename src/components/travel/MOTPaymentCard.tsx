import { CreditCard, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MOTPaymentCardProps {
  pnrOrRef: string;
  amount: string;
  currency: string;
  onOrderTicket: () => void;
}

export function MOTPaymentCard({ pnrOrRef, amount, currency, onOrderTicket }: MOTPaymentCardProps) {
  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Payment & billing – {pnrOrRef}</h3>
        <p className="text-xs text-muted-foreground mt-1">Total: {currency}{amount}</p>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <CreditCard className="h-3.5 w-3.5" /> CREDIT CARD INFO
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <input type="text" placeholder="Card type (e.g. VISA)" className="px-3 py-2 rounded-md border border-border bg-background text-sm" readOnly value="VISA" />
            <input type="text" placeholder="Card number" className="px-3 py-2 rounded-md border border-border bg-background text-sm col-span-2" defaultValue="4514 0785 2916 1843" />
            <input type="text" placeholder="MM" className="px-3 py-2 rounded-md border border-border bg-background text-sm" defaultValue="07" />
            <input type="text" placeholder="YYYY" className="px-3 py-2 rounded-md border border-border bg-background text-sm" defaultValue="2026" />
            <input type="text" placeholder="Card holder name" className="px-3 py-2 rounded-md border border-border bg-background text-sm col-span-2" defaultValue="John Doe" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5" /> BILLING INFO
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <input type="text" placeholder="Address" className="px-3 py-2 rounded-md border border-border bg-background text-sm col-span-2" defaultValue="123 Main St" />
            <select className="px-3 py-2 rounded-md border border-border bg-background text-sm">
              <option>United States</option>
            </select>
            <input type="text" placeholder="Select State" className="px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <input type="text" placeholder="City" className="px-3 py-2 rounded-md border border-border bg-background text-sm" defaultValue="New York" />
            <input type="text" placeholder="Zipcode" className="px-3 py-2 rounded-md border border-border bg-background text-sm" defaultValue="10001" />
            <input type="text" placeholder="Phone" className="px-3 py-2 rounded-md border border-border bg-background text-sm col-span-2" defaultValue="+1 555-123-4567" />
            <input type="text" placeholder="Email" className="px-3 py-2 rounded-md border border-border bg-background text-sm col-span-2" defaultValue="customer@example.com" />
          </div>
        </div>
        <Button className="w-full" onClick={onOrderTicket}>
          Order ticket
        </Button>
      </div>
    </div>
  );
}
