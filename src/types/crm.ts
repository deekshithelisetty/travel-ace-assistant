export type ActivityType =
  | 'pnr'
  | 'email'
  | 'queue'
  | 'ccv_rejected'
  | 'ccd'
  | 'ticketing_failed'
  | 'ancillary_failed'
  | 'reissue_failed'
  | 'refund_failed';
export type ActivityStatus = 'new' | 'working' | 'resolved' | 'closed';

/** Single step in the reservation flow (Booking → CCV → Ticketing → …) for activity cards */
export type FlowStepStatus = 'completed' | 'failed' | 'pending';
export interface FlowStep {
  key: string;
  label: string;
  status: FlowStepStatus;
  /** Optional time for delivery/order-style steps (e.g. "9:12 am") */
  timestamp?: string;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: string;
  badge: string;
  isNew?: boolean;
  status?: ActivityStatus;
  caseId?: string;
  /** When type is ccv_rejected, link to CCV info for the opened tab */
  ccvInfo?: CCVInfo;
  pnrActivity?: PNRActivityEvent[];
  /** Pipeline steps: which are completed, which failed (for manual intervention cards) */
  flowSteps?: FlowStep[];
  /** For fraud indication: email cases – sender address (checked against trusted list) */
  fromEmail?: string;
  /** For fraud indication: system-rejected (CCV, CCD, ticketing, reissue) – journey start date (e.g. "15 Feb 2026" or ISO) */
  journeyDate?: string;
  /** For fraud indication: when the booking was made (e.g. "14 Feb 2026" or ISO) – advance purchase < 3 days = immediate travel */
  bookedAt?: string;
  /** For fraud indication: origin airport/city code (e.g. SGN, HYD, JFK) – outside USA = potential fraud */
  origin?: string;
  /** For fraud indication: destination airport/city code */
  destination?: string;
}

/** Result of fraud check for an activity card */
export interface PotentialFraud {
  show: boolean;
  reason?: string;
}

/** Payomo/CCV fraud and identity verification summary for a PNR */
export interface CCVInfo {
  pnr: string;
  status: 'DECLINED' | 'APPROVED';
  highRisk: boolean;
  proceedFulfillment: boolean;
  riskScore: number;
  identityCheckScore: number;
  identityNetworkScore: number;
  threeDSStatus?: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    ipAddress: string;
    billingAddress: string;
  };
  binInfo?: Record<string, string>;
  /** Validation results: phone, email, address */
  validations: {
    phone: { valid: boolean; value: string; match?: boolean };
    email: { valid: boolean; value: string; match?: boolean };
    address: { valid: boolean; match?: boolean };
  };
  /** Journey summary for display in conversation */
  journey?: {
    route: string;
    date: string;
    segments?: string[];
  };
}

/** Single event in PNR activity timeline (CCV, Case, TICKET_ORDER, TICKETING_QC, BOOKING) */
export type PNRActivityEventType = 'CCV' | 'CASE' | 'TICKET_ORDER' | 'TICKETING_QC' | 'BOOKING';
export type PNRActivityStatus = 'SUCCESS' | 'FAILURE' | 'PENDING';

export interface PNRActivityEvent {
  id: string;
  type: PNRActivityEventType;
  title: string;
  subtitle: string;
  timestamp: string;
  status: PNRActivityStatus;
}

export type GDSType = 'SBR' | 'AMD' | 'WSP';

export interface GDSState {
  selected: GDSType | null;
  pcc: string | null;
  isConnected: boolean;
}

export interface Tab {
  id: string;
  type: 'global' | 'pnr' | 'email' | 'ccv';
  label: string;
  pnr?: string;
  email?: string;
  status?: ActivityStatus;
  /** When true, tab was accepted from activity stream; closing it does not remove from Spaces */
  accepted?: boolean;
  /** When type is 'ccv', full CCV info and PNR activity for this case */
  ccvInfo?: CCVInfo;
  pnrActivity?: PNRActivityEvent[];
}

export interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  duration: string;
  price: number;
  stops: number;
  cabin: string;
  logo?: string; // URL to airline logo or icon name
}

export interface FlightSearchState {
  step: 'origin' | 'destination' | 'dates' | 'travelers' | 'results' | 'brand_selection' | 'details' | 'ancillary' | 'payment' | 'confirmation' | 'processing' | 'booked';
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  travelers?: {
    adults: number;
    children: number;
    infants: number;
  };
  results: FlightOption[];
  selectedFlight?: FlightOption;
  selectedBrand?: string;
  /** Selected ancillary IDs and price (for total after ancillary step) */
  selectedAncillaries?: { id: string; name: string; price: number }[];
  travelerDetails?: {
    name: string;
    email: string;
    phone: string;
    type: 'Adult' | 'Child' | 'Infant';
  }[];
  currentTravelerIndex?: number;
  paymentDetails?: {
    cardNumber: string;
    expiry: string;
    cvv: string;
    name: string;
  };
}

/** Hotel policies for display (rules, check-in/out, fees) */
export interface HotelPolicies {
  checkIn: string;
  checkOut: string;
  checkInInstructions?: string;
  cancellationPolicy?: string;
  parking?: string;
  childrenAndBeds?: string;
  pets?: string;
  optionalFees?: string[];
  general?: string[];
}

/** Hotel search result for display and selection */
export interface HotelOption {
  id: string;
  name: string;
  address: string;
  starRating: number;
  pricePerNight: string;
  totalPrice: string;
  amenities: string[];
  rating?: number;
  reviewCount?: number;
  distance?: string;
  /** Optional image URL for hotel photo */
  imageUrl?: string;
  /** Hotel rules and policies (shown when selecting rooms) */
  policies?: HotelPolicies;
}

/** Room type option for a selected hotel */
export interface HotelRoomOption {
  id: string;
  roomType: string;
  bedType: string;
  roomSize?: string;
  pricePerNight: string;
  totalPrice: string;
  cancellationPolicy: string;
  features: string[];
  sleeps?: number;
}

/** Hotel search/booking flow state */
export interface HotelSearchState {
  step: 'location' | 'checkIn' | 'checkOut' | 'rooms' | 'guests' | 'results' | 'room_selection' | 'guest_details' | 'payment' | 'confirmation';
  location?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  guests?: number;
  results: HotelOption[];
  selectedHotel?: HotelOption;
  roomOptions?: HotelRoomOption[];
  selectedRoom?: HotelRoomOption;
  guestDetails?: { name: string; email: string; phone: string };
  paymentDetails?: { cardLast4?: string; name?: string };
  confirmed?: boolean;
}

/** Hotel booking confirmation for display after booking */
export interface HotelBookingConfirmation {
  hotel: HotelOption;
  room: HotelRoomOption;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  guestName: string;
  guestEmail: string;
  totalPrice: string;
  confirmationNumber: string;
}

/** Trip Info – itinerary segment for chat display */
export interface ItinerarySegment {
  flightNumber: string;
  airline: string;
  departure: { airport: string; city?: string; time: string; date: string };
  arrival: { airport: string; city?: string; time: string; date: string };
  duration: string;
  cabin: string;
  airlinePnr?: string;
}

/** Trip Info – invoice summary for chat */
export interface InvoiceSummary {
  invoiceNumber: string;
  invoiceDate: string;
  refNumber: string;
  pnr: string;
  totalDue: string;
  currency: string;
  paymentApplied?: string;
  status: 'TICKETED' | 'PENDING' | 'CANCELLED';
  itinerarySummary?: string;
}

/** Trip Info – travelers for chat */
export interface TravelerSummary {
  name: string;
  type: string;
  dob?: string;
  pnr: string;
  eTicket?: string;
  status: string;
}

/** Trip Info – activity/lifecycle event for chat */
export interface TripActivityEvent {
  id: string;
  timestamp: string;
  action: string;
  detail?: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  actor?: string;
}

/** Single ancillary option (seat, baggage, meal, etc.) for PNR */
export interface AncillaryOption {
  id: string;
  name: string;
  type: 'seat' | 'baggage' | 'meal' | 'insurance' | 'lounge' | 'other';
  price?: string;
  detail?: string;
}

/** MOT (Manual Order Ticketing) – price option for user to select */
export interface MOTPriceOption {
  id: string;
  label: string;
  amount: string;
  currency: string;
  platingCarrier?: string;
  bookingClass?: string;
  fareBasis?: string;
  isLowest?: boolean;
}

/** MOT flow state */
export interface MOTFlowState {
  step: 'prices' | 'payment' | 'confirm' | 'processing' | 'success' | 'ticket_numbers' | 'email_prompt' | 'email_compose' | 'email_sent' | 'done';
  pnrOrRef?: string;
  selectedPrice?: MOTPriceOption;
  /** After confirm: show ticketing status steps */
  ticketingSteps?: { label: string; status: 'pending' | 'progress' | 'done' }[];
  ticketNumbers?: string[];
  emailRecipients?: { to?: string; cc?: string };
}

/** MOT composed email for user to confirm send/cancel */
export interface MOTEmailCompose {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  sender?: string;
  suggestions?: CommandSuggestion[];
  pnrData?: PNRData;
  /** GDS terminal-style command output (displayed in chat in a terminal block) */
  gdsOutput?: string;
  /** When present, show issued ticket numbers (e.g. after "verified good" → ticketing) */
  ticketNumbers?: string[];
  /** Flight options to display in chat */
  flightOptions?: FlightOption[];
  /** Trip Info – rich content for chat */
  itineraryData?: { pnr: string; ref: string; segments: ItinerarySegment[] };
  invoiceData?: InvoiceSummary;
  ccvStatusData?: { status: string; highRisk: boolean; proceedFulfillment: boolean; identityCheckScore?: number; validations?: CCVInfo['validations'] };
  /** Full Payomo/CCV summary for structured card (CCV tab initial message) */
  ccvSummaryData?: CCVInfo;
  travelersData?: TravelerSummary[];
  ticketInfoData?: { ticketNumbers: string[]; pnr: string; travelerName?: string }[];
  activitiesData?: TripActivityEvent[];
  lifecycleData?: TripActivityEvent[];
  /** Shown after user confirms cancel PNR */
  cancelPnrResult?: { pnr: string; cancelled: boolean; message: string };
  /** Available ancillaries for current PNR – user selects one or more, then adds to PNR */
  ancillaryOptions?: { pnr: string; items: AncillaryOption[] };
  /** Top hotel results in chat; View all opens right panel */
  hotelOptions?: HotelOption[];
  /** Room options for selected hotel */
  hotelRoomOptions?: HotelRoomOption[];
  /** Hotel name when showing room options (for card title) */
  hotelNameForRooms?: string;
  /** Hotel policies to show with room options */
  hotelPolicies?: HotelPolicies;
  /** After booking, show this confirmation */
  hotelBookingConfirmation?: HotelBookingConfirmation;
  /** MOT: price options to select */
  motPriceOptions?: MOTPriceOption[];
  /** MOT: show payment/billing form (prompt or card) */
  motPaymentPrompt?: { pnrOrRef: string; amount: string; currency: string };
  /** MOT: ticketing status steps (in progress, successful) */
  motTicketingStatus?: { pnrOrRef: string; steps: { label: string; status: 'pending' | 'progress' | 'done' }[] };
  /** MOT: issued ticket numbers */
  motTicketNumbers?: { pnrOrRef: string; numbers: string[] };
  /** MOT: composed email for Send/Cancel confirmation */
  motEmailCompose?: MOTEmailCompose;
  /** MOT: email sent confirmation */
  motEmailSent?: { to: string; subject: string };
}

export interface CommandSuggestion {
  command: string;
  description: string;
}

export interface SearchResult {
  gds: GDSType;
  pnr: string;
  passenger: string;
  ttl: string;
  status: 'urgent' | 'warning' | 'normal';
}

export interface PNRData {
  pnr: string;
  passenger: string;
  flightStatus: string;
  route: string;
  date: string;
  eTicket: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface CaseIntelligence {
  complexityScore: number;
  maxScore: number;
  timeline: TimelineEvent[];
  slaPercentage: number;
  efficiencyData: number[];
}

export interface TimelineEvent {
  id: string;
  icon: 'received' | 'assignment' | 'gds' | 'resolution';
  title: string;
  description: string;
  timestamp: string;
  
}

export interface WorkedCase {
  id: string;
  pnr?: string;
  title: string;
  status: ActivityStatus;
  lastWorked: string;
}
