import { HotelBookingConfirmation } from '@/types/crm';
import { Building2, Calendar, User, CreditCard, CheckCircle2 } from 'lucide-react';

interface HotelBookingConfirmationCardProps {
  confirmation: HotelBookingConfirmation;
}

export function HotelBookingConfirmationCard({ confirmation }: HotelBookingConfirmationCardProps) {
  const { hotel, room, checkIn, checkOut, rooms, guests, guestName, guestEmail, totalPrice, confirmationNumber } =
    confirmation;

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-3 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">Booking confirmed</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{hotel.name}</div>
            <div className="text-xs text-muted-foreground">{hotel.address}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Check-in: {checkIn}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Check-out: {checkOut}
          </div>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Room: </span>
          <span className="font-medium">{room.roomType}</span>
          {room.bedType && <span className="text-muted-foreground"> · {room.bedType}</span>}
        </div>
        <div className="text-sm text-muted-foreground">
          {rooms} room(s), {guests} guest(s)
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{guestName}</span>
        </div>
        <div className="text-xs text-muted-foreground">{guestEmail}</div>
        <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold text-primary">Total: {totalPrice}</span>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">Confirmation number</div>
          <div className="font-mono font-semibold text-sm">{confirmationNumber}</div>
        </div>
      </div>
    </div>
  );
}
