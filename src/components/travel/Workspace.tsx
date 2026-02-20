import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sparkles, Clock, Zap } from 'lucide-react';
import travelAssistantAvatar from '@/assets/travel-assistant-avatar.png';
import { WorkspaceTabs } from './WorkspaceTabs';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SearchResultsTable } from './SearchResultsTable';
import { PNRDetailCard } from './PNRDetailCard';
import { FlightChatCard } from './FlightChatCard';
import { HotelChatCard } from './HotelChatCard';
import { HotelRoomOptionsCard } from './HotelRoomOptionsCard';
import { HotelBookingConfirmationCard } from './HotelBookingConfirmationCard';
import { HotelPoliciesCard } from './HotelPoliciesCard';
import { MOTPriceCard } from './MOTPriceCard';
import { MOTPaymentCard } from './MOTPaymentCard';
import { MOTTicketingStatusCard } from './MOTTicketingStatusCard';
import { MOTTicketNumbersCard } from './MOTTicketNumbersCard';
import { MOTEmailComposeCard } from './MOTEmailComposeCard';
import { AncillaryOptionsCard } from './AncillaryOptionsCard';
import { cn } from '@/lib/utils';
import { Tab, Message, SearchResult, GDSState, ActivityItem, PNRData, CommandSuggestion, GDSType, CCVInfo, FlightSearchState, FlightOption, AncillaryOption, HotelOption, HotelRoomOption, HotelSearchState, HotelBookingConfirmation, HotelPolicies, MOTPriceOption, MOTFlowState, MOTEmailCompose, type ItinerarySegment, type InvoiceSummary, type TravelerSummary, type TripActivityEvent } from '@/types/crm';

interface WorkspaceProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: (item: ActivityItem) => void;
  /** Open a recent PNR/case in its own tab */
  onOpenRecentItem?: (item: { id: string; label: string; sub: string }) => void;
  /** Quick action: open new tab and send message; AI suggests tab name */
  onQuickActionClick?: (actionLabel: string) => void;
  pendingQuickAction?: { tabId: string; message: string } | null;
  onClearPendingQuickAction?: () => void;
  onSuggestTabLabel?: (tabId: string, suggestedLabel: string) => void;
  onCaseResolved?: (tabId: string) => void;
  onShowRightPanel?: (content: 'intelligence' | 'flight_results' | 'hotel_results', data?: any) => void;
}

/** AI-determined tab name from quick-action or first message */
function suggestTabNameFromQuery(content: string): string | null {
  const q = content.trim().toLowerCase();
  if (q === 'ticketing') return 'Ticketing request';
  if (q === 're-issue') return 'Re-Issue';
  if (q === 'refunds') return 'Refund inquiry';
  if (q === 'void') return 'Void request';
  if (q) return content.length > 28 ? content.slice(0, 25) + '…' : content;
  return null;
}

/** Detect which GDS a typed command belongs to (Sabre / Amadeus / Worldspan). Uses prefix of first token. */
function detectGDSFromCommand(text: string): GDSType | null {
  const raw = text.trim().toUpperCase();
  if (!raw) return null;
  const first = raw.split(/\s+/)[0];
  const prefix2 = first.slice(0, 2);
  const prefix3 = first.slice(0, 3);
  const prefix4 = first.slice(0, 4);

  // ---- Amadeus (check first: distinctive 2–4 letter codes from Amadeus quick ref) ----
  if (prefix2 === 'AN' || prefix2 === 'AW' || prefix2 === 'AC') return 'AMD'; // Availability
  if (prefix2 === 'RT' || prefix3 === 'RTP' || prefix4 === 'RTTKT' || prefix4 === 'RTFT' || prefix3 === 'RTM') return 'AMD'; // Retrieve
  if (prefix2 === 'SS' && /^SS[0-9A-Z\/]|^SSU/i.test(first)) return 'AMD'; // Segment sell (SS1Y1, SSU2...)
  if (prefix2 === 'NM' || prefix2 === 'AP' || (prefix3 === 'APE' && first.startsWith('APE'))) return 'AMD'; // Name, phone, email
  if (prefix2 === 'TK' || prefix2 === 'FP' || prefix3 === 'FPD' || prefix3 === 'FPC') return 'AMD'; // Ticketing, form of payment
  if (prefix3 === 'FXP' || prefix3 === 'FXX' || prefix3 === 'FXQ' || prefix3 === 'FXF' || prefix3 === 'FXD') return 'AMD'; // Pricing
  if (prefix3 === 'FXK' || prefix3 === 'FXG' || prefix3 === 'FXH') return 'AMD'; // Ancillaries
  if (prefix3 === 'TQT' || prefix3 === 'TQM' || prefix3 === 'TQR' || prefix3 === 'TMI') return 'AMD'; // TST/TSM display
  if (prefix3 === 'TTP' || prefix3 === 'TTM') return 'AMD'; // Light ticket issuance
  if (prefix2 === 'ER' && /^ER($|\s)/i.test(first)) return 'AMD'; // End transaction
  if (prefix2 === 'RL' || prefix2 === 'SB' || prefix2 === 'NU') return 'AMD'; // Record locator, sector change, name change
  if (prefix2 === 'SM' || prefix2 === 'ST' || prefix3 === 'FFN') return 'AMD'; // Seat map, seat request, frequent flyer
  if (first.startsWith('PNR_')) return 'AMD';
  if (prefix3 === 'SRD' || prefix2 === 'SR') return 'AMD'; // SSR (e.g. SR XBAG, SRDOCS)

  // ---- Worldspan (before Sabre so IR isn’t confused) ----
  if (prefix2 === 'IR' || (first === 'I' && raw.length <= 2)) return 'WSP'; // Itinerary retrieve, I
  if (/^W\s|^WR\s|^WR\//i.test(raw)) return 'WSP';
  if (prefix2 === 'IG') return 'WSP'; // Worldspan Get

  // ---- Sabre: DI, GD (Get Dedicated), 1*, 3*, 5*, 6*, 9*, *1, -name, availability 1xx, EI ----
  if (/^DI(\*|$|[0-9])/i.test(first) || (/^GD(\*|$|[0-9])/i.test(first) && !first.startsWith('GDS'))) return 'SBR';
  if (/^[13569]\*/.test(first) || /^\*[0-9A-Z]/i.test(first)) return 'SBR';
  if (/^[1-9][0-9]{2}[A-Z]{2,3}[A-Z]{3}/i.test(first)) return 'SBR'; // e.g. 130JUNBAHPAR
  if (/^-/.test(first) && first.length > 2) return 'SBR'; // -WHITE/ALAN MR
  if (/^EI\*?$/i.test(first) || (/^I\*$/i.test(first))) return 'SBR'; // I* only (plain I handled as Worldspan)

  return null;
}

/** MerchantPay Terminal chat flow state (per tab) */
interface MerchantPayFlow {
  step: 'card-type' | 'card-details';
  tripId: string;
  pnr: string;
  amount: number;
  products: { name: string; status: string; price: number }[];
  invoice: { invoiceDate: string; invoice: string; dkNumber: string; pnr: string; totalFare: string; amountDue: string; creditDue: string };
}

/** Generate sample GDS terminal output for display in chat (simulated command response). */
function getSampleGdsOutput(command: string, gds: GDSType): string {
  const cmd = command.trim().toUpperCase().slice(0, 20) || 'AVAIL';
  return `I <<
${gds === 'SBR' ? 'IGD' : gds === 'AMD' ? 'AN' : 'IR'} 
${cmd} <<
20JUL MON SFO/PDT JUL/EST 2

  563  AV/** C9 J9 D9 F5 Y9 B9 M9 H9 Q9  SFOSAL 1415 2050  32N M/G 0 DCA/E
  429  AV/** C9 J9 D9 I9 Y9 B9 M9 H9     SFOLIM 2215 0330  319 G 0 DCA/E
 2205  LA/** C9 J9 D9 I9 Y9 B9 M9 H9     SFOSAL 0610 1245  32N M/G 0 DCA/E
 3115  BR/** C9 J9 D9 F9 Y9 B9 M9 H9     SFOGIG 2115 1025+ 77W G 0 DCA/E
       B9 M9 H9 Q9 V9 A9 E9 K9 L9

SUBJECT TO GOVERNMENT APPROVAL

* - FOR ADDITIONAL CLASSES ENTER 1*C.`;
}

/** Generate sample fare rules output for PNR (GDS-style display in chat). */
function getSampleFareRulesOutput(pnr: string, gds: GDSType): string {
  const gdsLabel = gds === 'SBR' ? 'SABRE' : gds === 'AMD' ? 'AMADEUS' : 'WORLDSPAN';
  return `FARE RULES - PNR ${pnr} (${gdsLabel})
────────────────────────────────────────

FARE BASIS: Y26  CATEGORY 01 - APPLICABILITY
  APPLIES TO ALL JOURNEYS

CATEGORY 02 - DAY/TIME
  NO RESTRICTIONS

CATEGORY 03 - SEASONALITY
  TRAVEL FROM 01MAR26 THRU 31OCT26

CATEGORY 04 - FLIGHT APPLICATION
  ANY FLIGHT
  RESERVATIONS REQUIRED

CATEGORY 05 - ADVANCE RESERVATION/TICKETING
  RESERVATIONS REQUIRED
  TICKETING DEADLINE: 24 HOURS BEFORE DEPARTURE

CATEGORY 06 - MINIMUM STAY
  NO MINIMUM STAY

CATEGORY 07 - MAXIMUM STAY
  1 MONTH

CATEGORY 08 - STOPOVERS
  2 STOPOVERS PERMITTED

CATEGORY 09 - TRANSFERS
  UNLIMITED TRANSFERS PERMITTED

CATEGORY 10 - COMBINATIONS
  END-ON-END COMBINATIONS PERMITTED
  SAME CARRIER COMBINATIONS PERMITTED

CATEGORY 11 - BLACKOUT DATES
  NONE

CATEGORY 12 - SURCHARGES
  NO SURCHARGES

CATEGORY 13 - ACCOMPANIED TRAVEL
  UNACCOMPANIED TRAVEL PERMITTED

CATEGORY 14 - TRAVEL RESTRICTIONS
  NON-REFUNDABLE
  CHANGES PERMITTED WITH FEE

CATEGORY 15 - PENALTIES
  CANCELLATION: USD 200.00
  CHANGE: USD 150.00 AFTER DEPARTURE

────────────────────────────────────────
* END OF FARE RULES *`;
}

// Sample PNR data for proactive AI suggestions
const samplePNRData: PNRData = {
  pnr: 'GHK821',
  passenger: 'SMITH/ALEXANDER MR',
  flightStatus: 'LH 400 | Confirmed (HK)',
  route: 'FRA → JFK',
  date: '12 NOV',
  eTicket: '220-4491023948',
  status: 'confirmed',
};

const sampleFlights: FlightOption[] = [
  { id: '1', airline: 'Delta Air Lines', flightNumber: 'DL 1539', departureTime: '6:30p', arrivalTime: '8:02p', origin: 'SFO', destination: 'LAX', duration: '1h 32m', price: 129, stops: 0, cabin: 'Economy' },
  { id: '2', airline: 'Delta Air Lines', flightNumber: 'DL 1598', departureTime: '7:00a', arrivalTime: '8:33a', origin: 'SFO', destination: 'LAX', duration: '1h 33m', price: 129, stops: 0, cabin: 'Economy' },
  { id: '3', airline: 'Alaska Airlines', flightNumber: 'AS 345', departureTime: '7:00a', arrivalTime: '8:34a', origin: 'SFO', destination: 'LAX', duration: '1h 34m', price: 129, stops: 0, cabin: 'Economy' },
  { id: '4', airline: 'United Airlines', flightNumber: 'UA 123', departureTime: '8:00a', arrivalTime: '9:30a', origin: 'SFO', destination: 'LAX', duration: '1h 30m', price: 135, stops: 0, cabin: 'Economy' },
  { id: '5', airline: 'Southwest', flightNumber: 'WN 456', departureTime: '9:00a', arrivalTime: '10:30a', origin: 'SFO', destination: 'LAX', duration: '1h 30m', price: 110, stops: 0, cabin: 'Economy' },
  { id: '6', airline: 'Delta Air Lines', flightNumber: 'DL 2000', departureTime: '10:00a', arrivalTime: '11:32a', origin: 'SFO', destination: 'LAX', duration: '1h 32m', price: 145, stops: 0, cabin: 'Economy' }
];

/** Mock Trip Info data for chat (PNR KCOHLY / Ref 1023596020) */
const TRIP_INFO_PNR = 'KCOHLY';
const TRIP_INFO_REF = '1023596020';
const mockItinerarySegments: ItinerarySegment[] = [
  { flightNumber: '4466', airline: 'UA', departure: { airport: 'SGF', time: '3:10 PM', date: '23 Mar' }, arrival: { airport: 'ORD', time: '4:59 PM', date: '23 Mar' }, duration: '1h 49m', cabin: 'Economy', airlinePnr: 'SIV20RX' },
  { flightNumber: '2179', airline: 'UA', departure: { airport: 'ORD', time: '6:20 PM', date: '23 Mar' }, arrival: { airport: 'SFO', time: '9:26 PM', date: '23 Mar' }, duration: '5h 6m', cabin: 'Economy', airlinePnr: 'SIV20RX' },
  { flightNumber: '853', airline: 'UA', departure: { airport: 'SFO', time: '11:20 PM', date: '23 Mar' }, arrival: { airport: 'TPE', time: '4:45 AM', date: '25 Mar' }, duration: '13h 25m', cabin: 'Economy', airlinePnr: 'SIV20RX' },
  { flightNumber: '852', airline: 'UA', departure: { airport: 'TPE', time: '2:30 PM', date: '08 Apr' }, arrival: { airport: 'SFO', time: '11:05 AM', date: '08 Apr' }, duration: '11h 35m', cabin: 'Economy', airlinePnr: 'LIV20RX' },
  { flightNumber: '1387', airline: 'UA', departure: { airport: 'SFO', time: '12:35 PM', date: '08 Apr' }, arrival: { airport: 'IAH', time: '6:41 PM', date: '08 Apr' }, duration: '3h 6m', cabin: 'Economy', airlinePnr: 'LIV20RX' },
  { flightNumber: '4343', airline: 'UA', departure: { airport: 'IAH', time: '8:05 PM', date: '08 Apr' }, arrival: { airport: 'SGF', time: '10:00 PM', date: '08 Apr' }, duration: '1h 55m', cabin: 'Economy', airlinePnr: 'LIV20RX' },
];
const mockInvoice: InvoiceSummary = { invoiceNumber: '2102603850', invoiceDate: 'FEB 10, 2026', refNumber: TRIP_INFO_REF, pnr: TRIP_INFO_PNR, totalDue: '1,035.03', currency: 'USD', paymentApplied: '1,040.03', status: 'TICKETED', itinerarySummary: 'SGF–TPE Mar 23, 2026 · Return Apr 8, 2026' };
const mockTravelers: TravelerSummary[] = [{ name: 'ANGEL HUANG', type: 'Adult', pnr: TRIP_INFO_PNR, eTicket: '016-7368159511', status: 'BOOKED' }];
const mockTicketInfo = [{ ticketNumbers: ['016-7368159511'], pnr: TRIP_INFO_PNR, travelerName: 'ANGEL HUANG' }];

const mockAncillaries: AncillaryOption[] = [
  { id: 'anc-1', name: 'Seat 12A (Extra legroom)', type: 'seat', price: '$45', detail: 'Window' },
  { id: 'anc-2', name: 'Seat 14C (Exit row)', type: 'seat', price: '$65', detail: 'Aisle' },
  { id: 'anc-3', name: 'Checked bag 23 kg', type: 'baggage', price: '$55' },
  { id: 'anc-4', name: 'Checked bag 32 kg', type: 'baggage', price: '$85' },
  { id: 'anc-5', name: 'Hot meal (Vegetarian)', type: 'meal', price: '$18' },
  { id: 'anc-6', name: 'Hot meal (Non-veg)', type: 'meal', price: '$22' },
  { id: 'anc-7', name: 'Travel insurance', type: 'insurance', price: '$29' },
  { id: 'anc-8', name: 'Lounge access', type: 'lounge', price: '$35', detail: 'Single use' },
];

const defaultHotelPolicies: HotelPolicies = {
  checkIn: '3:00 PM to anytime',
  checkOut: '12:00 PM',
  checkInInstructions: 'Government-issued photo ID and credit card required. Special requests subject to availability. Credit/debit cards accepted; cash not accepted. Property may pre-authorize your card prior to arrival.',
  cancellationPolicy: 'Free cancellation before 6:00 PM on arrival date. Non-refundable after that.',
  parking: 'Uncovered self-parking available (surcharge).',
  childrenAndBeds: 'Children 11 and under stay free with existing bedding.',
  pets: 'Pets allowed (2 max, 40 lb each). Pet fee applies. Service animals exempt.',
  optionalFees: ['Self-parking: USD 48/night', 'Pet fee: USD 50/night (max USD 150/stay)', 'Breakfast: USD 9–20'],
  general: ['24-hour front desk', 'Free WiFi in public areas', 'Smoke-free property', 'LGBTQ+ friendly'],
};

const sampleHotels: HotelOption[] = [
  { id: 'h1', name: 'Grand Hyatt at SFO', address: 'San Francisco International Airport, San Francisco, CA', starRating: 4, pricePerNight: '$502', totalPrice: '$5,532', amenities: ['Free WiFi', 'Pool', 'Spa', 'Free Cancellation'], rating: 9.0, reviewCount: 1240, distance: '0.76 miles from airport', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=260&fit=crop', policies: defaultHotelPolicies },
  { id: 'h2', name: 'The Westin San Francisco Airport', address: '1 Old Bayshore Hwy, Millbrae, CA 94030', starRating: 4, pricePerNight: '$182', totalPrice: '$2,002', amenities: ['Free WiFi', 'Pool', 'Free Breakfast'], rating: 8.6, reviewCount: 892, distance: '1.2 miles from airport', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=260&fit=crop', policies: defaultHotelPolicies },
  { id: 'h3', name: 'Aloft San Francisco Airport', address: '401 E Millbrae Ave, Millbrae, CA 94030', starRating: 4, pricePerNight: '$145', totalPrice: '$1,595', amenities: ['Free WiFi', 'Fitness', 'Free Cancellation'], rating: 8.4, reviewCount: 756, distance: '0.9 miles from airport', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=260&fit=crop', policies: defaultHotelPolicies },
  { id: 'h4', name: 'Marriott San Francisco Airport', address: '1800 Old Bayshore Hwy, Burlingame, CA 94010', starRating: 4, pricePerNight: '$198', totalPrice: '$2,178', amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Free Cancellation'], rating: 8.8, reviewCount: 1103, distance: '1.5 miles from airport', imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=260&fit=crop', policies: defaultHotelPolicies },
  { id: 'h5', name: 'Hilton San Francisco Airport', address: 'San Francisco International Airport, CA', starRating: 4, pricePerNight: '$225', totalPrice: '$2,475', amenities: ['Free WiFi', 'Pool', 'Spa', 'Free Airport Shuttle'], rating: 8.9, reviewCount: 987, distance: '0.3 miles from airport', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=260&fit=crop', policies: defaultHotelPolicies },
  { id: 'h6', name: 'Sheraton San Francisco Airport', address: '600 Airport Blvd, Burlingame, CA 94010', starRating: 4, pricePerNight: '$175', totalPrice: '$1,925', amenities: ['Free WiFi', 'Fitness', 'Restaurant'], rating: 8.2, reviewCount: 654, distance: '1.1 miles from airport', imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=260&fit=crop', policies: defaultHotelPolicies },
];

function getSampleRoomOptionsForHotel(_hotelName: string): HotelRoomOption[] {
  return [
    { id: 'r1', roomType: '2 Queen Beds', bedType: '2 Queen', roomSize: '350 sq.ft.', pricePerNight: '$145', totalPrice: '$1,662.50', cancellationPolicy: 'Non-Refundable', features: ['Free WiFi', 'Refrigerator', 'Climate Control', 'Non-Smoking', 'TV'], sleeps: 4 },
    { id: 'r2', roomType: '2 Queen Beds', bedType: '2 Queen', roomSize: '350 sq.ft.', pricePerNight: '$165', totalPrice: '$1,889.00', cancellationPolicy: 'Free Cancellation before 6:00 PM', features: ['Free WiFi', 'Refrigerator', 'Climate Control', 'Non-Smoking', 'TV'], sleeps: 4 },
    { id: 'r3', roomType: '1 King Bed', bedType: '1 King', roomSize: '350 sq.ft.', pricePerNight: '$185', totalPrice: '$2,123.50', cancellationPolicy: 'Free Cancellation', features: ['Free WiFi', 'Breakfast', 'Refrigerator', 'TV'], sleeps: 2 },
  ];
}

const sampleMOTPrices: MOTPriceOption[] = [
  { id: 'mot1', label: 'Original fare', amount: '1,769.25', currency: 'CA$', platingCarrier: 'AC', bookingClass: 'T,T,T,L,L,L', fareBasis: 'SKYLINKCANADA-Pub-08K0' },
  { id: 'mot2', label: 'Lowest fare', amount: '1,742.65', currency: 'CA$', platingCarrier: 'AC', bookingClass: 'T,T,T,L,L,L', fareBasis: 'CTS Canada-Lower Comm-3GAH', isLowest: true },
];
const mockActivities: TripActivityEvent[] = [
  { id: 'a1', timestamp: '02/10/2026 12:43', action: 'KCOHLY - TICKETING_QC', status: 'SUCCESS', actor: 'Auto User - QC' },
  { id: 'a2', timestamp: '02/10/2026 12:43', action: 'KCOHLY - INVOICE', status: 'SUCCESS', actor: 'Auto User - QC' },
  { id: 'a3', timestamp: '02/10/2026 12:40', action: 'KCOHLY - BOOKING', detail: 'Manual booking', status: 'SUCCESS', actor: 'Ling tomato - Canada Ticketing' },
];
const mockLifecycle: TripActivityEvent[] = [
  { id: 'l1', timestamp: '02/10/2026 12:43', action: 'Invoice created', detail: 'Ticket numbers 7368159511', status: 'SUCCESS', actor: 'Auto User' },
  { id: 'l2', timestamp: '02/10/2026 12:40', action: 'QC completed', detail: 'Tickets 7368159511', status: 'SUCCESS', actor: 'Auto User' },
  { id: 'l3', timestamp: '02/10/2026 12:40', action: 'Booking created', status: 'SUCCESS', actor: 'Ling tomato' },
];

export function Workspace({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  onOpenRecentItem,
  onQuickActionClick,
  pendingQuickAction,
  onClearPendingQuickAction,
  onSuggestTabLabel,
  onCaseResolved,
  onShowRightPanel,
}: WorkspaceProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [messagesPerTab, setMessagesPerTab] = useState<Record<string, Message[]>>({
    global: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [showPNRCard, setShowPNRCard] = useState<PNRData | null>(null);
  const [gdsState, setGDSState] = useState<GDSState>({
    selected: null,
    pcc: null,
    isConnected: false,
  });
  const [merchantPayFlow, setMerchantPayFlow] = useState<Record<string, MerchantPayFlow>>({});
  const [flightSearchFlow, setFlightSearchFlow] = useState<Record<string, FlightSearchState>>({});
  const [hotelSearchFlow, setHotelSearchFlow] = useState<Record<string, HotelSearchState>>({});
  const [motFlow, setMotFlow] = useState<Record<string, MOTFlowState>>({});
  /** When user types a GDS command before PCC is set, we ask for PCC and store the command to run after they connect. */
  const [pendingGdsCommand, setPendingGdsCommand] = useState<Record<string, string>>({});
  /** When user asked to cancel PNR, we store PNR per tab until they confirm (yes/confirm). */
  const [pendingCancelPnr, setPendingCancelPnr] = useState<Record<string, string | null>>({});

  const currentMessages = messagesPerTab[activeTab] || [];
  const currentTab = tabs.find(t => t.id === activeTab);
  const sentQuickActionForRef = useRef<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const parseAncillaryPrice = (s: string | undefined): number => {
    if (!s) return 0;
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const handleFlightAncillaryContinue = (selectedIds: string[]) => {
    const items = mockAncillaries.filter(a => selectedIds.includes(a.id)).map(a => ({
      id: a.id,
      name: a.name,
      price: parseAncillaryPrice(a.price),
    }));
    const totalTravelers = (flightSearchFlow[activeTab]?.travelers?.adults || 1) + (flightSearchFlow[activeTab]?.travelers?.children || 0) + (flightSearchFlow[activeTab]?.travelers?.infants || 0);
    const flightState = flightSearchFlow[activeTab];
    const flightTotal = (flightState?.selectedFlight?.price || 0) * totalTravelers;
    const ancTotal = items.reduce((s, a) => s + a.price, 0);
    const total = flightTotal + ancTotal;
    setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState!, selectedAncillaries: items, step: 'confirmation' } }));
    const msg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `**Booking summary**\n\nFlight: **$${flightTotal}** (${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''})\nAdd-ons: **$${ancTotal}**${items.length > 0 ? ` — ${items.map(i => i.name).join(', ')}` : ''}\n\n**Total: $${total}**\n\nReply **confirm** to proceed to payment.`,
      timestamp: '',
      suggestions: [{ command: 'confirm', description: 'Proceed to payment' }, { command: 'cancel', description: 'Cancel booking' }],
    };
    setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
  };

  const handleItineraryAddToTrip = () => {
    setMessagesPerTab(prev => ({
      ...prev,
      [activeTab]: [
        ...(prev[activeTab] || []),
        {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: '✅ **Itinerary added to this trip.** This PNR is now the active itinerary for the current case.',
          timestamp: '',
        },
      ],
    }));
    onShowRightPanel?.('intelligence');
  };

  const handleInvoiceSendEmail = (data: InvoiceSummary) => {
    const body = `Invoice #${data.invoiceNumber}\nDate: ${data.invoiceDate}\nRef: ${data.refNumber}\nPNR: ${data.pnr}\n${data.itinerarySummary ? `Trip: ${data.itinerarySummary}\n` : ''}Total: ${data.currency} ${data.totalDue}\nStatus: ${data.status}`;
    const msg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Compose and send the invoice email to the customer. You can edit the fields below before sending.',
      timestamp: '',
      motEmailCompose: {
        to: 'customer@example.com',
        cc: 'subagent@example.com',
        subject: `Invoice ${data.invoiceNumber} - PNR ${data.pnr}`,
        body,
      },
    };
    setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
  };

  // Auto-scroll chat to bottom when messages or tab change
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };
    requestAnimationFrame(scrollToBottom);
    const t = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(t);
  }, [currentMessages.length, currentMessages, activeTab]);

  // When a quick-action tab is opened (or message sent from sidebar to global), send the pending message once
  useEffect(() => {
    if (!pendingQuickAction || activeTab !== pendingQuickAction.tabId) return;
    if (sentQuickActionForRef.current === pendingQuickAction.tabId) return;
    sentQuickActionForRef.current = pendingQuickAction.tabId;
    handleSend(pendingQuickAction.message, gdsState);
    onClearPendingQuickAction?.();
    sentQuickActionForRef.current = null; // allow next sidebar/quick message to same or other tab
  }, [activeTab, pendingQuickAction]);

  // Proactive AI suggestions when a PNR tab is opened
  useEffect(() => {
    if (currentTab?.type === 'pnr' && !messagesPerTab[activeTab]) {
      const pnr = currentTab.pnr || currentTab.label.replace('PNR: ', '');
      
      // Simulate AI reading the PNR and providing suggestions
      const initialMessages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: `**Loading PNR ${pnr}...**\n\nRetrieving passenger details, itinerary, and ticket status from GDS...`,
          timestamp: '',
        },
      ];

      setMessagesPerTab(prev => ({
        ...prev,
        [activeTab]: initialMessages,
      }));

      // Simulate AI response after "loading"
      setTimeout(() => {
        const aiResponse: Message = {
          id: '2',
          role: 'assistant',
          content: `All re-protection parameters have been validated. Class J availability is locked and the PNR has been updated.\n\nThe case is now ready to be finalized. Would you like me to close the ticket and notify the traveler?`,
          timestamp: '',
          pnrData: samplePNRData,
          suggestions: [
            { command: '/close-case', description: 'Finalize and notify traveler' },
            { command: '/sync', description: 'Sync PNR with GDS' },
          ],
        };

        setMessagesPerTab(prev => ({
          ...prev,
          [activeTab]: [...(prev[activeTab] || []), aiResponse],
        }));
        setShowPNRCard(samplePNRData);
      }, 1500);
    }
  }, [activeTab, currentTab?.type]);

  // CCV tab: seed conversation with structured Payomo/CCV summary card so agent can review and decide fraud or not
  useEffect(() => {
    if (currentTab?.type !== 'ccv' || !currentTab.ccvInfo || messagesPerTab[activeTab]?.length) return;
    const c = currentTab.ccvInfo as CCVInfo;
    const initialMessages: Message[] = [
      {
        id: 'ccv-1',
        role: 'assistant',
        content: `Payomo / CCV summary for PNR ${c.pnr}. Review the details below and reply with *verified good* or *verified bad*.`,
        timestamp: '',
        ccvSummaryData: c,
        suggestions: [
          { command: 'verified good', description: 'Not fraud – proceed to ticketing' },
          { command: 'verified bad', description: 'Fraud – decline and close' },
        ],
      },
    ];
    setMessagesPerTab(prev => ({ ...prev, [activeTab]: initialMessages }));
  }, [activeTab, currentTab?.type, currentTab?.ccvInfo]);

  const handleGDSChange = (gds: GDSType | null, pcc: string | null) => {
    setGDSState({
      selected: gds,
      pcc,
      isConnected: !!gds && !!pcc,
    });

    if (gds && pcc) {
      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Connected to **${gds}** with PCC **${pcc}**.\n\nAll queries will now be executed in this GDS context. Click the GDS button again to disconnect.`,
        timestamp: '',
      };
      setMessagesPerTab(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), systemMessage],
      }));
      return;
    }

    if (gds && !pcc) {
      const askForPcc: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `To connect to **${gds}**, please provide your PCC (3–6 characters).\n\nExample: \`1S2K\` or \`PCC 1S2K\`.`,
        timestamp: '',
        suggestions: [
          { command: 'PCC 1S2K', description: 'Send your PCC' },
        ],
      };
      setMessagesPerTab(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), askForPcc],
      }));
    }
  };

  const extractPccCandidate = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Accept: "1S2K" or "PCC 1S2K" or "PCC: 1S2K"
    const normalized = trimmed.replace(/^pcc\s*[:-]?\s*/i, '').trim();
    const candidate = normalized.toUpperCase();

    // Typical PCCs are 3-6 characters; allow alphanumeric
    if (!/^[A-Z0-9]{3,6}$/.test(candidate)) return null;
    return candidate;
  };

  /** Extract new PCC from "change/set PCC to X" or "PCC X" style messages (updates chat bar). */
  const extractPccFromChangeMessage = (raw: string): string | null => {
    const t = raw.trim();
    if (!t) return null;
    // "Change the PCC to CDREW", "Set PCC to CDREW", "Switch PCC to CDREW", "PCC to CDREW"
    const toMatch = t.match(/(?:change|set|switch|use)\s+(?:the\s+)?pcc\s+to\s+([A-Z0-9]{3,6})\b/i);
    if (toMatch) return toMatch[1].toUpperCase();
    const pccToMatch = t.match(/pcc\s+to\s+([A-Z0-9]{3,6})\b/i);
    if (pccToMatch) return pccToMatch[1].toUpperCase();
    // "PCC CDREW" or "PCC: CDREW" anywhere in message
    const pccColonMatch = t.match(/\bpcc\s*[:-]?\s*([A-Z0-9]{3,6})\b/i);
    if (pccColonMatch) return pccColonMatch[1].toUpperCase();
    return null;
  };

  /** Parse card + address from message (e.g. "4111111111111111, 12/28, John Doe, 123, 123 Main St, New York, NY, 10001, US") */
  const parseCardDetails = (raw: string): { valid: boolean; last4?: string } => {
    const t = raw.trim();
    const digits = t.replace(/\D/g, '');
    const cardMatch = t.match(/\b(\d{13,19})\b/);
    const expMatch = t.match(/\b(\d{1,2})\s*\/\s*(\d{2,4})\b/);
    const cvvMatch = t.match(/\b(\d{3,4})\b/g);
    if (!cardMatch || !expMatch) return { valid: false };
    const card = cardMatch[1];
    const last4 = card.slice(-4);
    const cvv = cvvMatch && cvvMatch.length >= 1 ? cvvMatch[cvvMatch.length - 1] : null;
    if (card.length < 13 || card.length > 19) return { valid: false };
    if (!cvv || (cvv.length !== 3 && cvv.length !== 4)) return { valid: false };
    const mm = parseInt(expMatch[1], 10);
    const yy = parseInt(expMatch[2], 10);
    if (mm < 1 || mm > 12) return { valid: false };
    return { valid: true, last4 };
  };

  const getPnrOrTripIdFromContext = (): { tripId: string; pnr: string } => {
    const pnrFromTab = currentTab?.pnr || (currentTab?.label?.startsWith('PNR:') ? currentTab.label.replace(/^PNR:\s*/i, '').trim() : null);
    if (pnrFromTab) return { tripId: pnrFromTab, pnr: pnrFromTab };
    return { tripId: '1023578926', pnr: 'AZDDRO' };
  };

  const handleSend = (content: string, currentGdsState: GDSState) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      sender: 'H. BENNETT',
    };

    setMessagesPerTab(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newMessage],
    }));

    // ----- Trip Info intents FIRST (so itinerary/invoice/CCV etc. always show cards, including on CCV tab) -----
    const lowerContent = content.trim().toLowerCase();
    const pendingPnr = pendingCancelPnr[activeTab];
    if (pendingPnr && /^(yes|confirm|yeah|yep|ok|proceed|cancel\s+it)$/i.test(lowerContent)) {
      setPendingCancelPnr(prev => ({ ...prev, [activeTab]: null }));
      setTimeout(() => {
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `PNR **${pendingPnr}** has been cancelled.`,
          timestamp: '',
          cancelPnrResult: { pnr: pendingPnr, cancelled: true, message: 'Cancellation completed successfully.' },
        };
        setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
      }, 600);
      return;
    }
    if (pendingPnr && !/^(no|cancel|nevermind|abort)$/i.test(lowerContent)) {
      setTimeout(() => {
        const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Reply **yes** to confirm cancelling the PNR or **no** to keep it.', timestamp: '' };
        setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
      }, 400);
      return;
    }
    if (pendingPnr && /^(no|cancel|nevermind|abort)$/i.test(lowerContent)) {
      setPendingCancelPnr(prev => ({ ...prev, [activeTab]: null }));
      setTimeout(() => {
        const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Cancellation not performed. PNR remains active.', timestamp: '' };
        setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
      }, 400);
      return;
    }

    // Handle slash commands first so /add-flight starts flight search instead of showing PNR itinerary
    if (content.startsWith('/')) {
      handleSlashCommand(content, currentGdsState);
      return;
    }

    const showItinerary = /\b(itinerary|itin|flights?|segments?|route)\b/i.test(lowerContent) || /show\s+(me\s+)?(the\s+)?(trip\s+)?itinerary/i.test(lowerContent) || /(what'?s?|give me|want to see|get|provide)\s+(me\s+)?(the\s+)?(trip\s+)?itinerary/i.test(lowerContent);
    const showInvoice = /\b(invoice|inv)\b/i.test(lowerContent) || /show\s+(me\s+)?(the\s+)?invoice/i.test(lowerContent) || /what'?s?\s+(the\s+)?invoice/i.test(lowerContent);
    const showCcv = /\b(ccv|cvv|payment\s+status|card\s+status|payomo|verification)\b/i.test(lowerContent) || /show\s+ccv\s+status/i.test(lowerContent) || /what'?s?\s+(the\s+)?ccv/i.test(lowerContent);
    const showTravelers = /\b(travelers?|passengers?|pax)\b/i.test(lowerContent) || /show\s+(me\s+)?(the\s+)?travelers/i.test(lowerContent);
    const showTickets = !/order\s*ticket/i.test(lowerContent) && (/\b(ticket(s)?|e-?ticket|eticket)\b/i.test(lowerContent) || /show\s+(me\s+)?(the\s+)?ticket/i.test(lowerContent));
    const showFareRules = /\b(fare\s*rules?|fare\s*rule)\b/i.test(lowerContent) || /show\s+(me\s+)?(the\s+)?fare\s*rules?/i.test(lowerContent) || /(what'?s?|give me|get|want to see)\s+(the\s+)?fare\s*rules?/i.test(lowerContent);
    const showAncillaries = /\b(ancillaries?|ancillary)\b/i.test(lowerContent) || /show\s+(me\s+)?(all\s+)?(the\s+)?ancillaries?/i.test(lowerContent) || /(what\s+ancillaries?|view\s+ancillaries?|available\s+ancillaries?)/i.test(lowerContent);
    const showActivities = /\b(activities?|activity\s+log|timeline)\b/i.test(lowerContent) && !/life\s*cycle/i.test(lowerContent);
    const showLifecycle = /\b(life\s*cycle|lifecycle)\b/i.test(lowerContent) || /show\s+life\s*cycle/i.test(lowerContent);
    const cancelPnrIntent = /\b(cancel\s+(the\s+)?(pnr|booking)|cancel\s+pnr|void\s+pnr)\b/i.test(lowerContent);
    if (cancelPnrIntent) {
      setPendingCancelPnr(prev => ({ ...prev, [activeTab]: TRIP_INFO_PNR }));
      setTimeout(() => {
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Do you want to cancel PNR **${TRIP_INFO_PNR}**? This cannot be undone. Reply **yes** to confirm or **no** to keep the booking.`,
          timestamp: '',
          suggestions: [{ command: 'yes', description: 'Confirm cancellation' }, { command: 'no', description: 'Keep booking' }],
        };
        setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
      }, 500);
      return;
    }
    if (showItinerary || showInvoice || showCcv || showTravelers || showTickets || showFareRules || showAncillaries || showActivities || showLifecycle) {
      const pnrForResponse = currentTab?.pnr || (currentTab?.label?.match(/PNR:\s*(\S+)/i)?.[1]) || TRIP_INFO_PNR;
      const parts: string[] = [];
      if (showItinerary) parts.push('itinerary');
      if (showInvoice) parts.push('invoice');
      if (showCcv) parts.push('CCV status');
      if (showTravelers) parts.push('travelers');
      if (showTickets) parts.push('ticket info');
      if (showFareRules) parts.push('fare rules');
      if (showAncillaries) parts.push('ancillaries');
      if (showActivities) parts.push('activities');
      if (showLifecycle) parts.push('life cycle');
      const summary = parts.length === 1
        ? (showAncillaries ? `Here are the **available ancillaries** for PNR ${pnrForResponse}. Select one or more and click **Add to PNR**.` : `Here's the **${parts[0]}** for PNR ${pnrForResponse}.`)
        : `Here's the **${parts.join(', ')}** for PNR ${pnrForResponse}.`;
      const fareRulesGdsOutput = showFareRules ? getSampleFareRulesOutput(pnrForResponse, currentGdsState?.selected ?? 'SBR') : undefined;
      setTimeout(() => {
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: summary,
          timestamp: '',
          ...(showItinerary && { itineraryData: { pnr: pnrForResponse, ref: TRIP_INFO_REF, segments: mockItinerarySegments } }),
          ...(showInvoice && { invoiceData: mockInvoice }),
          ...(showCcv && { ccvStatusData: { status: 'APPROVED', highRisk: false, proceedFulfillment: true, identityCheckScore: 65, validations: { phone: { valid: true, value: '', match: true }, email: { valid: true, value: '', match: true }, address: { valid: false, match: false } } } }),
          ...(showTravelers && { travelersData: mockTravelers }),
          ...(showTickets && { ticketInfoData: mockTicketInfo }),
          ...(showFareRules && fareRulesGdsOutput && { gdsOutput: fareRulesGdsOutput }),
          ...(showAncillaries && { ancillaryOptions: { pnr: pnrForResponse, items: mockAncillaries } }),
          ...(showActivities && { activitiesData: mockActivities }),
          ...(showLifecycle && { lifecycleData: mockLifecycle }),
        };
        setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
      }, 600);
      return;
    }

    // ----- CCV tab: agent decision (verified good → ticketing; verified bad → close) -----
    if (currentTab?.type === 'ccv') {
      const lower = content.trim().toLowerCase();
      const isPass = /verified\s+good|passed|proceed\s+(for\s+)?ticketing|not\s+fraud/.test(lower) || lower === 'passed' || lower === 'good';
      const isDecline = /verified\s+bad|decline|fraud|close\s+(the\s+)?(case|ticket)/.test(lower) || lower === 'decline' || lower === 'bad';

      if (isPass) {
        setTimeout(() => {
          const processing: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '✅ **Verified good.** Proceeding to ticketing...',
            timestamp: '',
          };
          setMessagesPerTab(prev => ({
            ...prev,
            [activeTab]: [...(prev[activeTab] || []), processing],
          }));
        }, 400);
        setTimeout(() => {
          const ticketMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `**Ticket issued successfully.**\n\nTicket numbers:\n· **${currentTab.pnr || 'PNR'}** — \`176-2293847561\`, \`176-2293847562\``,
            timestamp: '',
            ticketNumbers: ['176-2293847561', '176-2293847562'],
          };
          setMessagesPerTab(prev => ({
            ...prev,
            [activeTab]: [...(prev[activeTab] || []), ticketMsg],
          }));
          onCaseResolved?.(activeTab);
        }, 1800);
        return;
      }
      if (isDecline) {
        setTimeout(() => {
          const msg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '✅ **Verified bad.** Case marked as fraud. Fulfillment declined and ticket closed.',
            timestamp: '',
            suggestions: [{ command: '/close-case', description: 'Confirm close' }],
          };
          setMessagesPerTab(prev => ({
            ...prev,
            [activeTab]: [...(prev[activeTab] || []), msg],
          }));
          onCaseResolved?.(activeTab);
        }, 600);
        return;
      }
    }

    // ----- MOT (Manual Order Ticketing) intent: issue through mot, open mot, issue mot, order ticket, etc. -----
    const motIntent = /\b(issue\s+through\s+mot|open\s+mot|issue\s+in\s+mot|issue\s+mot|issue\s+ticket\s+through\s+mot|order\s*ticket)\b/i.test(lowerContent);
    if (motIntent && !motFlow[activeTab]) {
      const pnrRef = getPnrOrTripIdFromContext().pnr;
      const initial: MOTFlowState = { step: 'prices', pnrOrRef: pnrRef, ticketingSteps: [] };
      setMotFlow(prev => ({ ...prev, [activeTab]: initial }));
      setTimeout(() => {
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Opening **MOT** for ${pnrRef}. Here are the available prices. Select one to proceed with payment and billing.`,
          timestamp: '',
          motPriceOptions: sampleMOTPrices,
        };
        setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
      }, 500);
      return;
    }

    // ----- MOT Flow (when already in MOT) -----
    const motState = motFlow[activeTab];
    if (motState) {
      if (motState.step === 'prices') {
        const opts = sampleMOTPrices;
        let selected: MOTPriceOption | undefined;
        const n = lowerContent.match(/(?:option|#|select)?\s*(\d+)/);
        if (n) {
          const idx = parseInt(n[1]);
          if (idx >= 1 && idx <= opts.length) selected = opts[idx - 1];
        }
        if (!selected && /\b(first|one|1st)\b/i.test(lowerContent)) selected = opts[0];
        if (!selected && /\b(second|two|2nd|lowest)\b/i.test(lowerContent)) selected = opts[1] || opts[0];
        if (!selected) selected = opts.find(o => o.label.toLowerCase().includes(lowerContent) || (o.isLowest && /lowest/i.test(lowerContent)));
        if (selected) {
          setMotFlow(prev => ({ ...prev, [activeTab]: { ...motState, selectedPrice: selected, step: 'payment' } }));
          setTimeout(() => {
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `You selected **${selected!.currency}${selected!.amount}**. Please review the payment and billing information below, then click **Order ticket** to confirm. I will ask for your confirmation before issuing.`,
              timestamp: '',
              motPaymentPrompt: { pnrOrRef: motState.pnrOrRef!, amount: selected!.amount, currency: selected!.currency },
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 500);
          return;
        }
      }
      if (motState.step === 'payment') {
        const isOrderTicket = /\b(order\s+ticket|confirm|proceed)\b/i.test(lowerContent);
        if (isOrderTicket) {
          // Show order ticket successfully and ticketing status steps immediately (no confirm step)
          setMotFlow(prev => ({ ...prev, [activeTab]: { ...motState, step: 'processing', ticketingSteps: [
            { label: 'Ticketing in progress', status: 'done' },
            { label: 'GDS Invoice Process', status: 'done' },
            { label: 'Ticketing Successful', status: 'done' },
          ] } }));
          const ticketNumbers = ['176-2293847561', '176-2293847562'];
          setTimeout(() => {
            const successMsg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: '**Order ticket done successfully.**',
              timestamp: '',
              motTicketingStatus: { pnrOrRef: motState.pnrOrRef!, steps: [
                { label: 'Ticketing in progress', status: 'done' },
                { label: 'GDS Invoice Process', status: 'done' },
                { label: 'Ticketing Successful', status: 'done' },
              ] },
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), successMsg] }));
          }, 300);
          setTimeout(() => {
            const ticketMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `Ticket numbers issued for **${motState.pnrOrRef}**:`,
              timestamp: '',
              motTicketNumbers: { pnrOrRef: motState.pnrOrRef!, numbers: ticketNumbers },
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), ticketMsg] }));
            setMotFlow(prev => ({ ...prev, [activeTab]: { ...prev[activeTab]!, step: 'ticket_numbers', ticketNumbers } }));
          }, 600);
          setTimeout(() => {
            const emailPromptMsg: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: 'Would you like to **send email confirmation** to the customer and subagent? Reply **send** or **send email** to compose and send, or **no** to skip.',
              timestamp: '',
              suggestions: [{ command: 'send', description: 'Compose and send email' }, { command: 'no', description: 'Skip email' }],
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), emailPromptMsg] }));
            setMotFlow(prev => ({ ...prev, [activeTab]: { ...prev[activeTab]!, step: 'email_prompt' } }));
          }, 1000);
          return;
        }
      }
      // Allow "send" / "send email" even if still in ticket_numbers or processing (user replied before email prompt appeared)
      if ((motState.step === 'email_prompt' || motState.step === 'ticket_numbers' || motState.step === 'processing') && (/\b(send|yes|compose)\b/i.test(lowerContent.trim()) || /send\s*email|email\s*confirmation/i.test(lowerContent.trim()))) {
        const to = 'ZAHRA SAHARA TRAVEL TOURS';
        const subject = `Please issue ticket RLOC/${motState.pnrOrRef} SALIM/ZAINAB`;
        const body = 'Tickets have been issued.\n\nSalim/Zainab – Your ticket numbers are 176-2293847561, 176-2293847562. Thank you for your booking.';
        setMotFlow(prev => ({ ...prev, [activeTab]: { ...motState, step: 'email_compose' } }));
        setTimeout(() => {
          const msg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Here is the composed email. Click **Send** to send to customer and subagent, or **Cancel** to discard.',
            timestamp: '',
            motEmailCompose: { to, cc: 'subagent@example.com', subject, body },
          };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 400);
        return;
      }
      if (motState.step === 'email_prompt') {
        if (/^no$/i.test(lowerContent.trim())) {
          setMotFlow(prev => ({ ...prev, [activeTab]: { ...motState, step: 'done' } }));
          setTimeout(() => {
            const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Email skipped. MOT flow complete.', timestamp: '' };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 400);
          return;
        }
      }
      if (motState.step === 'email_compose') {
        const doSend = /^send$/i.test(lowerContent.trim()) || /\bsend\s*email\b|\bsend\b/i.test(lowerContent.trim());
        if (doSend) {
          setMotFlow(prev => ({ ...prev, [activeTab]: { ...motState, step: 'email_sent' } }));
          setTimeout(() => {
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: '**Email sent** to customer and subagent.',
              timestamp: '',
              motEmailSent: { to: 'ZAHRA SAHARA TRAVEL TOURS', subject: `Ticket confirmation ${motState.pnrOrRef}` },
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
            setMotFlow(prev => ({ ...prev, [activeTab]: { ...prev[activeTab]!, step: 'done' } }));
          }, 400);
          return;
        }
        const doCancel = /^cancel$/i.test(lowerContent.trim()) || /\bcancel\b/i.test(lowerContent.trim());
        if (doCancel) {
          setMotFlow(prev => ({ ...prev, [activeTab]: { ...motState, step: 'done' } }));
          setTimeout(() => {
            const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Email cancelled. MOT flow complete.', timestamp: '' };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 400);
          return;
        }
      }
    }

    // When user says "send email" (or "send" for email) but we're not in MOT (e.g. they got ticket info from PNR view), still show email compose
    const sendEmailStandalone = /\bsend\s*email\b|\bemail\s*confirmation\b/i.test(lowerContent.trim()) || /^send$/i.test(lowerContent.trim());
    if (!motFlow[activeTab] && sendEmailStandalone) {
      const pnrCtx = getPnrOrTripIdFromContext();
      const pnrForEmail = currentTab?.pnr || (currentTab?.label?.match(/PNR:\s*(\S+)/i)?.[1]) || pnrCtx.pnr || TRIP_INFO_PNR;
      const to = 'ZAHRA SAHARA TRAVEL TOURS';
      const subject = `Please issue ticket RLOC/${pnrForEmail} SALIM/ZAINAB`;
      const body = 'Tickets have been issued.\n\nSalim/Zainab – Your ticket numbers are 176-2293847561, 176-2293847562. Thank you for your booking.';
      setMotFlow(prev => ({ ...prev, [activeTab]: { step: 'email_compose', pnrOrRef: pnrForEmail } }));
      setTimeout(() => {
        const msg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Here is the composed email. Click **Send** to send to customer and subagent, or **Cancel** to discard.',
          timestamp: '',
          motEmailCompose: { to, cc: 'subagent@example.com', subject, body },
        };
        setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
      }, 400);
      return;
    }

    // ----- Hotel Search Flow -----
    const hotelState = hotelSearchFlow[activeTab];
    if (hotelState) {
      if (hotelState.step === 'location') {
        setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, location: content, step: 'checkIn' } }));
        setTimeout(() => {
          const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'What is your **check-in date**? (e.g. Feb 20, 2026)', timestamp: '' };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
      }
      if (hotelState.step === 'checkIn') {
        setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, checkIn: content, step: 'checkOut' } }));
        setTimeout(() => {
          const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'What is your **check-out date**? (e.g. Mar 2, 2026)', timestamp: '' };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
      }
      if (hotelState.step === 'checkOut') {
        setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, checkOut: content, step: 'rooms' } }));
        setTimeout(() => {
          const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'How many **rooms**? (e.g. 1)', timestamp: '' };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
      }
      if (hotelState.step === 'rooms') {
        const roomsMatch = content.match(/(\d+)/);
        const rooms = roomsMatch ? parseInt(roomsMatch[1], 10) : 1;
        setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, rooms, step: 'guests' } }));
        setTimeout(() => {
          const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'How many **guests**? (e.g. 2)', timestamp: '' };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
      }
      if (hotelState.step === 'guests') {
        const guestsMatch = content.match(/(\d+)/);
        const guests = guestsMatch ? parseInt(guestsMatch[1], 10) : 1;
        setTimeout(() => {
          const searchingMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Searching hotels...', timestamp: '' };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), searchingMsg] }));
        }, 200);
        setTimeout(() => {
          const updatedState: HotelSearchState = { ...hotelState, guests, results: sampleHotels, step: 'results' };
          setHotelSearchFlow(prev => ({ ...prev, [activeTab]: updatedState }));
          const resultMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I found ${sampleHotels.length} hotels for ${hotelState.location}. Here are the top 5. Click "View all results" to see all in the side panel, or select by number (e.g. 1st, 2nd) or hotel name.`,
            timestamp: '',
            hotelOptions: sampleHotels,
          };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), resultMsg] }));
          // Right panel opens only when user clicks "View all results"
        }, 1500);
        return;
      }
      if (hotelState.step === 'results') {
        const lower = content.toLowerCase();
        let selected: HotelOption | undefined;
        const pickByIndex = (n: number) => (n >= 1 && n <= hotelState.results.length ? hotelState.results[n - 1] : null);
        const numberMatch = lower.match(/(?:option|choice|#|select)?\s*(\d+)/);
        if (numberMatch) {
          const idx = parseInt(numberMatch[1]);
          if (idx >= 1 && idx <= 10) {
            const match = pickByIndex(idx);
            if (match) selected = match;
          }
        }
        if (!selected) {
          const wordMap: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, one: 1, two: 2, three: 3, four: 4, five: 5, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, last: hotelState.results.length };
          for (const [word, val] of Object.entries(wordMap)) {
            if (new RegExp(`\\b${word}\\b`).test(lower)) {
              const match = pickByIndex(val);
              if (match) { selected = match; break; }
            }
          }
        }
        if (!selected) {
          const cleanQuery = lower.replace(/select|book|hotel|option|choose|the|add\s+to\s+trip/gi, '').trim();
          if (cleanQuery.length > 2) {
            selected = hotelState.results.find(h => h.name.toLowerCase().includes(cleanQuery));
          }
        }
        if (selected) {
          const roomOptions = getSampleRoomOptionsForHotel(selected.name);
          setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, selectedHotel: selected, roomOptions, step: 'room_selection' } }));
          setTimeout(() => {
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `You selected **${selected!.name}**. Choose a room option below. Hotel policies are shown for your reference.`,
              timestamp: '',
              hotelRoomOptions: roomOptions,
              hotelNameForRooms: selected!.name,
              hotelPolicies: selected!.policies,
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 500);
          return;
        }
      }
      if (hotelState.step === 'room_selection') {
        const lower = content.toLowerCase();
        let selectedRoom: HotelRoomOption | undefined;
        const opts = hotelState.roomOptions || [];
        const numMatch = lower.match(/(?:option|room|#)?\s*(\d+)/);
        if (numMatch) {
          const idx = parseInt(numMatch[1]);
          if (idx >= 1 && idx <= opts.length) selectedRoom = opts[idx - 1];
        }
        if (!selectedRoom && opts.length) {
          const wordMap: Record<string, number> = { first: 1, second: 2, third: 3, one: 1, two: 2, three: 3, '1st': 1, '2nd': 2, '3rd': 3 };
          for (const [word, val] of Object.entries(wordMap)) {
            if (new RegExp(`\\b${word}\\b`).test(lower) && val <= opts.length) {
              selectedRoom = opts[val - 1];
              break;
            }
          }
        }
        if (!selectedRoom) {
          const roomType = opts.find(r => r.roomType.toLowerCase().includes(lower) || r.bedType.toLowerCase().includes(lower));
          if (roomType) selectedRoom = roomType;
        }
        if (selectedRoom) {
          setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, selectedRoom, step: 'guest_details' } }));
          setTimeout(() => {
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Room **${selectedRoom!.roomType}** selected. Total: **${selectedRoom!.totalPrice}**. Please provide **guest details**: name, email, and phone. You can type them in one message (e.g. "John Doe, john@example.com, +1 555-123-4567") or say "Enter all information" after I ask for card details.`,
              timestamp: '',
              suggestions: [{ command: 'Enter all information', description: 'I have all details ready' }],
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 500);
          return;
        }
      }
      if (hotelState.step === 'guest_details') {
        const isEnterAll = /enter\s+all\s+information/i.test(content.trim());
        if (isEnterAll) {
          setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, guestDetails: { name: hotelState.guestDetails?.name || 'Guest', email: hotelState.guestDetails?.email || '', phone: hotelState.guestDetails?.phone || '' }, step: 'payment' } }));
          setTimeout(() => {
            const total = hotelState.selectedRoom?.totalPrice || '';
            const msg: Message = { id: Date.now().toString(), role: 'assistant', content: `**Total to pay: ${total}**. Please provide **card details** or say "Enter all information" to confirm booking.`, timestamp: '', suggestions: [{ command: 'Enter all information', description: 'Confirm and book' }] };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 500);
          return;
        }
        const parts = content.split(',').map(s => s.trim()).filter(Boolean);
        const emailPart = parts.find(p => /@/.test(p));
        const phonePart = parts.find(p => /\+?\d[\d\s\-()]{7,}/.test(p));
        const namePart = parts.find(p => p !== emailPart && p !== phonePart && /[A-Za-z]/.test(p)) || parts[0];
        const name = namePart || hotelState.guestDetails?.name || '';
        const email = emailPart || hotelState.guestDetails?.email || '';
        const phone = phonePart || hotelState.guestDetails?.phone || '';
        if (name || email || phone) {
          setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, guestDetails: { name: name || hotelState.guestDetails?.name || '', email: email || hotelState.guestDetails?.email || '', phone: phone || hotelState.guestDetails?.phone || '' }, step: 'payment' } }));
          setTimeout(() => {
            const total = hotelState.selectedRoom?.totalPrice || '';
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Guest details noted. **Total to pay: ${total}**. Please provide **card details** (card number, expiry, CVV, name on card). Or say "Enter all information" to confirm booking with the details you've provided.`,
              timestamp: '',
              suggestions: [{ command: 'Enter all information', description: 'Confirm and book' }],
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 500);
          return;
        }
      }
      if (hotelState.step === 'payment') {
        const isEnterAll = /enter\s+all\s+information|confirm|book\s+now|pay\s+now/i.test(content.trim());
        const cardInfo = parseCardDetails(content);
        if (isEnterAll || cardInfo.valid) {
          setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...hotelState, paymentDetails: cardInfo.valid ? { cardLast4: cardInfo.last4, name: undefined } : hotelState.paymentDetails, step: 'confirmation', confirmed: true } }));
          const confNum = 'HTL-' + Date.now().toString().slice(-8);
          const confirmation: HotelBookingConfirmation = {
            hotel: hotelState.selectedHotel!,
            room: hotelState.selectedRoom!,
            checkIn: hotelState.checkIn!,
            checkOut: hotelState.checkOut!,
            rooms: hotelState.rooms ?? 1,
            guests: hotelState.guests ?? 1,
            guestName: hotelState.guestDetails?.name || 'Guest',
            guestEmail: hotelState.guestDetails?.email || '',
            totalPrice: hotelState.selectedRoom!.totalPrice,
            confirmationNumber: confNum,
          };
          setTimeout(() => {
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `✅ **Hotel booked successfully.** Confirmation number: **${confNum}**.`,
              timestamp: '',
              hotelBookingConfirmation: confirmation,
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
            setHotelSearchFlow(prev => ({ ...prev, [activeTab]: { ...prev[activeTab]!, step: 'confirmation', confirmed: true } }));
          }, 500);
          return;
        }
        setTimeout(() => {
          const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Please provide valid card details (number, expiry MM/YY, CVV, name) or say "Enter all information" to book.', timestamp: '' };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 400);
        return;
      }
    }

    // ----- Flight Search Flow -----
    const flightState = flightSearchFlow[activeTab];
    if (flightState) {
      if (flightState.step === 'origin') {
        setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, origin: content, step: 'destination' } }));
        setTimeout(() => {
             const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Where are they traveling to?', timestamp: '' };
             setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
      }
      if (flightState.step === 'destination') {
        setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, destination: content, step: 'dates' } }));
        setTimeout(() => {
             const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'What are the travel dates? (e.g. May 20, 2026)', timestamp: '' };
             setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
      }
      if (flightState.step === 'dates') {
          // Parse rudimentary date
          setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, departureDate: content, step: 'travelers' } }));
          setTimeout(() => {
               const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'How many travelers? (e.g. 2 adults, 1 child)', timestamp: '' };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 500);
          return;
      }
      if (flightState.step === 'travelers') {
          // Parse travelers
          const adultsMatch = content.match(/(\d+)\s*adults?/i);
          const childrenMatch = content.match(/(\d+)\s*children?/i) || content.match(/(\d+)\s*kids?/i);
          const infantsMatch = content.match(/(\d+)\s*infants?/i) || content.match(/(\d+)\s*babies?/i);

          const adults = adultsMatch ? parseInt(adultsMatch[1]) : (content.match(/(\d+)/) ? parseInt(content.match(/(\d+)/)![1]) : 1);
          const children = childrenMatch ? parseInt(childrenMatch[1]) : 0;
          const infants = infantsMatch ? parseInt(infantsMatch[1]) : 0;
          
          const travelers = { adults, children, infants };

          // Simulate searching
          setTimeout(() => {
                const searchingMsg: Message = { id: (Date.now()).toString(), role: 'assistant', content: 'Searching available flights...', timestamp: '' };
                setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), searchingMsg] }));
          }, 200);

          setTimeout(() => {
               const updatedState = { ...flightState, travelers, results: sampleFlights, step: 'results' as const };
               setFlightSearchFlow(prev => ({ ...prev, [activeTab]: updatedState }));
               
               const resultMsg: Message = {
                   id: (Date.now()+1).toString(),
                   role: 'assistant',
                   content: `I found ${sampleFlights.length} flights for ${flightState.origin} to ${content} (Travelers: ${content}). Top 5 options:`,
                   timestamp: '',
                   flightOptions: sampleFlights
               };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), resultMsg] }));
               if (onShowRightPanel) onShowRightPanel('flight_results', sampleFlights);
          }, 1500);
          return;
      }
      
      if (flightState.step === 'results') {
           const lower = content.toLowerCase();
           let selected: FlightOption | undefined;
           
           // Helper: try to pick by index 1-based
           const pickByIndex = (n: number) => {
               if (n >= 1 && n <= flightState.results.length) return flightState.results[n - 1];
               return null;
           };

           // 1. Try finding by index (digits)
           // Matches: "1", "option 2", "#3"
           // We ignore large numbers (likely flight numbers)
           const numberMatch = lower.match(/(?:option|choice|#)?\s*(\d+)/);
           if (numberMatch) {
               const idx = parseInt(numberMatch[1]);
               if (idx >= 1 && idx <= 10) { // Assume max 10 results shown/selectable by index
                   const match = pickByIndex(idx);
                   if (match) selected = match;
               }
           }

           // 2. Try finding by word (first, one, etc)
           if (!selected) {
               const wordMap: Record<string, number> = {
                   'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
                   'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                   '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5,
                   'last': flightState.results.length
               };
               for (const [word, val] of Object.entries(wordMap)) {
                   if (new RegExp(`\\b${word}\\b`).test(lower)) {
                       const match = pickByIndex(val);
                       if (match) {
                           selected = match;
                           break;
                       }
                   }
               }
           }

           // 3. Try flight number / airline string match
           // Matches: "DL 1539", "Select Delta"
           if (!selected) {
               const cleanQuery = lower.replace(/select|book|flight|option|choose|the/g, '').trim();
               if (cleanQuery.length > 2) {
                   selected = flightState.results.find(f => 
                       f.flightNumber.toLowerCase().includes(cleanQuery) ||
                       f.airline.toLowerCase().includes(cleanQuery)
                   );
               }
           }
           
           if (selected) {
               const totalTravelers = (flightState.travelers?.adults || 1) + (flightState.travelers?.children || 0) + (flightState.travelers?.infants || 0);
               const flightTotal = selected.price * totalTravelers;
               setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, selectedFlight: selected, step: 'details', travelerDetails: [], currentTravelerIndex: 1 } }));
               setTimeout(() => {
                    const msg: Message = {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `You selected **${selected.airline} ${selected.flightNumber}** — **$${selected.price}** per traveler (${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}, flight total **$${flightTotal}**).\n\nPlease provide **Traveler 1** details: **Name**, **Email**, **Phone**. Optional add-ons are shown below.`,
                        timestamp: '',
                        ancillaryOptions: { pnr: 'booking', items: mockAncillaries },
                    };
                    setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
               }, 500);
               return;
           }
      }

      if (flightState.step === 'details') {
           const currentDetails = flightState.travelerDetails || [];
           // parse user input "Name, Email, Phone" or just raw string
           const newDetail = {
               name: content, 
               email: 'tbd',
               phone: 'tbd',
               type: 'Adult' as const 
           };
           
           const updatedDetails = [...currentDetails, newDetail];
           
           const totalTravelers = (flightState.travelers?.adults || 1) + (flightState.travelers?.children || 0) + (flightState.travelers?.infants || 0);

           if (updatedDetails.length < totalTravelers) {
               const nextIndex = updatedDetails.length + 1;
               setFlightSearchFlow(prev => ({
                   ...prev,
                   [activeTab]: { ...flightState, travelerDetails: updatedDetails, currentTravelerIndex: nextIndex }
               }));
               setTimeout(() => {
                    const msg: Message = { 
                        id: Date.now().toString(), 
                        role: 'assistant', 
                        content: `Saved Traveler ${updatedDetails.length}.\n\nPlease provide details for **Traveler ${nextIndex}**.`, 
                        timestamp: '' 
                    };
                    setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
               }, 500);
           } else {
               setFlightSearchFlow(prev => ({
                   ...prev,
                   [activeTab]: { ...flightState, travelerDetails: updatedDetails, step: 'ancillary' }
               }));
               setTimeout(() => {
                    const msg: Message = {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: 'All traveler info saved. Select any **add-ons** below, or click **Continue** to proceed to payment.',
                        timestamp: '',
                        ancillaryOptions: { pnr: 'booking', items: mockAncillaries },
                    };
                    setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
               }, 500);
           }
           return;
      }

      if (flightState.step === 'ancillary') {
           const lower = content.trim().toLowerCase();
           if (/^(skip|continue|done|no|none)$/.test(lower) || /^(no\s+add-ons?|skip\s+ancillar)/i.test(lower)) {
             const selectedAncillaries: { id: string; name: string; price: number }[] = [];
             const totalTravelers = (flightState.travelers?.adults || 1) + (flightState.travelers?.children || 0) + (flightState.travelers?.infants || 0);
             const flightTotal = (flightState.selectedFlight?.price || 0) * totalTravelers;
             const ancTotal = 0;
             const total = flightTotal + ancTotal;
             setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, selectedAncillaries, step: 'confirmation' } }));
             setTimeout(() => {
               const msg: Message = {
                 id: Date.now().toString(),
                 role: 'assistant',
                 content: `**Booking summary**\n\nFlight: **$${flightTotal}** (${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''})\nAdd-ons: $${ancTotal}\n\n**Total: $${total}**\n\nReply **confirm** to proceed to payment.`,
                 timestamp: '',
                 suggestions: [{ command: 'confirm', description: 'Proceed to payment' }, { command: 'cancel', description: 'Cancel booking' }],
               };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
             }, 400);
             return;
           }
           return;
      }

      if (flightState.step === 'payment') {
           const parsed = parseCardDetails(content);
           if (parsed.valid) {
             setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, step: 'processing' } }));
             setTimeout(() => {
               const processingMsg: Message = {
                 id: Date.now().toString(),
                 role: 'assistant',
                 content: '🔄 **Processing payment...**\n\nCharging card ending ' + (parsed.last4 || '****') + '...\n\nIssuing ticket...',
                 timestamp: '',
               };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), processingMsg] }));
             }, 300);
             setTimeout(() => {
               const ticket1 = '176-' + String(Math.floor(1000000000 + Math.random() * 9000000000));
               const ticket2 = flightState.travelerDetails && flightState.travelerDetails.length > 1 ? '176-' + String(Math.floor(1000000000 + Math.random() * 9000000000)) : null;
               const pnr = 'FLT' + Math.floor(Math.random() * 10000);
               setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, step: 'booked' } }));
               const ticketNumbers = ticket2 ? [ticket1, ticket2] : [ticket1];
               const ticketMsg: Message = {
                 id: (Date.now() + 1).toString(),
                 role: 'assistant',
                 content: `✅ **Ticket issued successfully.**\n\nPNR: **${pnr}**\n\n**Ticket number(s):**\n${ticketNumbers.map(t => `· \`${t}\``).join('\n')}\n\nWould you like to send a confirmation email to the customer?`,
                 timestamp: '',
                 ticketNumbers,
                 suggestions: [{ command: 'Send confirmation email', description: 'Email itinerary to customer' }],
               };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), ticketMsg] }));
             }, 2500);
           } else {
             setTimeout(() => {
               const msg: Message = {
                 id: Date.now().toString(),
                 role: 'assistant',
                 content: 'Please enter valid card details: **Card number**, **Expiry (MM/YY)**, **Name**, **CVV**. Example: 4111111111111111, 12/28, John Doe, 123',
                 timestamp: '',
               };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
             }, 400);
           }
           return;
      }

      if (flightState.step === 'confirmation') {
           if (content.toLowerCase().includes('confirm')) {
             setFlightSearchFlow(prev => ({ ...prev, [activeTab]: { ...flightState, step: 'payment' } }));
             setTimeout(() => {
               const totalTravelers = (flightState.travelers?.adults || 1) + (flightState.travelers?.children || 0) + (flightState.travelers?.infants || 0);
               const flightTotal = (flightState.selectedFlight?.price || 0) * totalTravelers;
               const ancTotal = (flightState.selectedAncillaries || []).reduce((s, a) => s + a.price, 0);
               const total = flightTotal + ancTotal;
               const msg: Message = {
                 id: Date.now().toString(),
                 role: 'assistant',
                 content: `Please enter **card details** to pay **$${total}**.\n\nFormat: Card number, Expiry (MM/YY), Cardholder name, CVV.\nExample: 4111111111111111, 12/28, John Doe, 123`,
                 timestamp: '',
               };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
             }, 500);
           } else {
             setFlightSearchFlow(prev => { const next = { ...prev }; delete next[activeTab]; return next; });
             setTimeout(() => {
               const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Booking cancelled.', timestamp: '' };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
             }, 500);
           }
           return;
      }

      if (flightState.step === 'booked') {
           if (/send\s+confirmation\s+email|send\s+email|confirmation\s+email/i.test(content.trim())) {
             setFlightSearchFlow(prev => { const next = { ...prev }; delete next[activeTab]; return next; });
             setTimeout(() => {
               const msg: Message = {
                 id: Date.now().toString(),
                 role: 'assistant',
                 content: '✅ **Email has been sent to the customer.**\n\nConfirmation and itinerary were sent to the traveler\'s email address.',
                 timestamp: '',
               };
               setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
             }, 500);
             return;
           }
      }
    }

    // ----- MerchantPay Terminal flow (in-chat payment) -----
    const flow = merchantPayFlow[activeTab];
    if (flow) {
      if (flow.step === 'card-type') {
        const lower = content.trim().toLowerCase();
        if (lower.includes('vcard') || lower === 'vcard') {
          setMerchantPayFlow(prev => ({ ...prev, [activeTab]: undefined! }));
          setMerchantPayFlow(prev => {
            const next = { ...prev };
            delete next[activeTab];
            return next;
          });
          setTimeout(() => {
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Generating vCard... Applying vCard on PNR **${flow.pnr}**.\n\nCharged **$${flow.amount.toFixed(2)}**.\n\n✅ **Transaction successful.**`,
              timestamp: '',
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 600);
          return;
        }
        if ((lower.includes('customer') && lower.includes('card')) || lower === 'customer card') {
          setMerchantPayFlow(prev => ({ ...prev, [activeTab]: { ...flow, step: 'card-details' } }));
          setTimeout(() => {
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Please enter card details and billing address.\n\nFormat: **Card number**, **Expiry (MM/YY)**, **Cardholder name**, **CVV**.\nThen: **Street**, **City**, **State**, **Zip**, **Country**.\n\nExample: 4111111111111111, 12/28, John Doe, 123, 123 Main St, New York, NY, 10001, US`,
              timestamp: '',
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 500);
          return;
        }
      }
      if (flow.step === 'card-details') {
        const parsed = parseCardDetails(content);
        if (parsed.valid) {
          setMerchantPayFlow(prev => {
            const next = { ...prev };
            delete next[activeTab];
            return next;
          });
          setTimeout(() => {
            const authCode = String(Math.floor(100000 + Math.random() * 900000));
            const msg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Charging **$${flow.amount.toFixed(2)}** to card ending ${parsed.last4}...\n\n✅ **Transaction successful.**\nAuth code: **${authCode}**`,
              timestamp: '',
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
          }, 800);
          return;
        }
        setTimeout(() => {
          const msg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `I couldn't parse all card and address details. Please provide:\n\nCard number, Expiry (MM/YY), Name, CVV — then Street, City, State, Zip, Country.`,
            timestamp: '',
          };
          setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 400);
        return;
      }
    }


    // If a GDS is selected but PCC isn't set, treat the next valid input as PCC.
    if (currentGdsState.selected && !currentGdsState.pcc) {
      const pcc = extractPccCandidate(content);
      if (pcc) {
        const commandToRun = pendingGdsCommand[activeTab];
        handleGDSChange(currentGdsState.selected, pcc);
        if (commandToRun) {
          setPendingGdsCommand(prev => {
            const next = { ...prev };
            delete next[activeTab];
            return next;
          });
          setTimeout(() => {
            const outputMsg: Message = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: `Command executed in **${currentGdsState.selected}** (PCC: ${pcc}).\n\nOutput for \`${commandToRun}\` below:`,
              timestamp: '',
              gdsOutput: getSampleGdsOutput(commandToRun, currentGdsState.selected),
            };
            setMessagesPerTab(prev => ({
              ...prev,
              [activeTab]: [...(prev[activeTab] || []), outputMsg],
            }));
          }, 600);
        }
        return;
      }

      setTimeout(() => {
        const retry: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I still need a valid PCC to connect to **${currentGdsState.selected}**.\n\nPlease send a 3–6 character code (example: \`1S2K\`).`,
          timestamp: '',
        };
        setMessagesPerTab(prev => ({
          ...prev,
          [activeTab]: [...(prev[activeTab] || []), retry],
        }));
      }, 400);
      return;
    }

    // When user asks to change/set PCC (e.g. "Change the PCC to CDREW"), update GDS state so chat bar shows new PCC.
    if (currentGdsState.selected) {
      const newPcc = extractPccFromChangeMessage(content);
      if (newPcc) {
        handleGDSChange(currentGdsState.selected, newPcc);
        return;
      }
    }

    // AI determines GDS from typed command: auto-select that GDS and ask for PCC (no need to click icons).
    const detectedGds = detectGDSFromCommand(content);
    if (detectedGds && !(currentGdsState.selected === detectedGds && currentGdsState.isConnected)) {
      setPendingGdsCommand(prev => ({ ...prev, [activeTab]: content }));
      handleGDSChange(detectedGds, null);
      return;
    }

    // Simulate AI response; when connected to GDS, show command output in a terminal block in chat
    setTimeout(() => {
      const isGdsConnected = currentGdsState.isConnected && currentGdsState.selected;
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isGdsConnected
          ? `Command executed in **${currentGdsState.selected}** (PCC: ${currentGdsState.pcc}).\n\nOutput below:`
          : `Processing your request...\n\nI'm analyzing "${content}" and will provide results shortly.`,
        timestamp: '',
        ...(isGdsConnected && currentGdsState.selected
          ? { gdsOutput: getSampleGdsOutput(content, currentGdsState.selected) }
          : {}),
      };
      setMessagesPerTab(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), aiResponse],
      }));
      // AI-determined tab name for quick-action tabs (conv-*)
      if (activeTab.startsWith('conv-') && onSuggestTabLabel) {
        const suggested = suggestTabNameFromQuery(content);
        if (suggested) onSuggestTabLabel(activeTab, suggested);
      }
    }, 1000);
  };

  const startMerchantPayFlow = () => {
    const { tripId, pnr } = getPnrOrTripIdFromContext();
    const products = [{ name: 'AZDDRO (YXJ-YVR)/MAR 13, 2026', status: 'TICKETED', price: 229.95 }];
    const invoice = {
      invoiceDate: '6 Feb 2026 17:09',
      invoice: '2062603643',
      dkNumber: '8000942843',
      pnr: pnr,
      totalFare: '231.95',
      amountDue: '-2.00',
      creditDue: '0.00',
    };
    const amount = products.reduce((s, p) => s + p.price, 0);
    const flow: MerchantPayFlow = { step: 'card-type', tripId, pnr, amount, products, invoice };
    setMerchantPayFlow(prev => ({ ...prev, [activeTab]: flow }));

    const productSummary = products.map(p => `${p.name} — ${p.status} — $${p.price.toFixed(2)}`).join('\n');
    const responseContent =
      `**MerchantPay Terminal**\n\n` +
      `**Trip ID:** ${tripId} · **PNR:** ${pnr}\n\n` +
      `**Invoice:** ${invoice.invoice} · DK ${invoice.dkNumber} · Total $${invoice.totalFare} · Amount due $${invoice.amountDue} · Credit $${invoice.creditDue}\n\n` +
      `**Products:**\n${productSummary}\n\n` +
      `No recent transactions for this PNR.\n\n` +
      `You want me to charge **customer card** or **vCard**?`;

    const msg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: '',
      suggestions: [
        { command: 'Customer card', description: 'Charge customer card' },
        { command: 'vCard', description: 'Generate vCard and charge' },
      ],
    };
    setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
  };

  const handleSlashCommand = (command: string, currentGdsState: GDSState) => {
    const cmd = command.split(' ')[0].toLowerCase();
    const fullCmd = command.trim().toLowerCase();

    if (cmd === '/merchantpay' || fullCmd.startsWith('/merchantpay')) {
      startMerchantPayFlow();
      return;
    }

    if (cmd === '/add-flight') {
        const initialFlow: FlightSearchState = { step: 'origin', results: [] };
        setFlightSearchFlow(prev => ({ ...prev, [activeTab]: initialFlow }));
        setTimeout(() => {
            const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Starting flight search. What is the **Origin** city or airport code?', timestamp: '' };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
    }

    if (cmd === '/add-hotel' || cmd === '/add-hotels') {
        const initialFlow: HotelSearchState = { step: 'location', results: [] };
        setHotelSearchFlow(prev => ({ ...prev, [activeTab]: initialFlow }));
        setTimeout(() => {
            const msg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Starting hotel search. What is the **hotel name or location**? (e.g. San Francisco Airport, SFO)', timestamp: '' };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
    }

    if (cmd === '/issue-mot' || cmd === '/mot') {
        const pnrRef = getPnrOrTripIdFromContext().pnr;
        const initial: MOTFlowState = { step: 'prices', pnrOrRef: pnrRef, ticketingSteps: [] };
        setMotFlow(prev => ({ ...prev, [activeTab]: initial }));
        setTimeout(() => {
            const msg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Opening **MOT** for ${pnrRef}. Here are the available prices. Select one to proceed with payment and billing.`,
                timestamp: '',
                motPriceOptions: sampleMOTPrices,
            };
            setMessagesPerTab(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), msg] }));
        }, 500);
        return;
    }

    setTimeout(() => {
      let responseContent = '';
      let suggestions: CommandSuggestion[] = [];

      switch (cmd) {
        case '/close-case':
          responseContent = '✅ **Case Closed Successfully**\n\nThe ticket has been finalized and the traveler has been notified via email. Case status updated to RESOLVED.';
          if (onCaseResolved) {
            onCaseResolved(activeTab);
          }
          break;
        case '/searchpnr':
          responseContent = 'Scanning Sabre, Amadeus, and Worldspan for PNR records...\n\nI found **3 matching records** that require attention.';
          setShowResults(true);
          break;
        case '/sync':
          responseContent = '🔄 **Syncing PNR with GDS...**\n\nPNR master record synchronized successfully. All segments confirmed.';
          break;
        case '/rebook':
          responseContent = '✈️ **Rebooking Workflow Initiated**\n\nPlease provide the new travel dates or let me suggest alternatives based on availability.';
          suggestions = [
            { command: '/searchflights', description: 'Search available flights' },
          ];
          break;
        case '/refund':
          responseContent = '💳 **Refund Process Started**\n\nCalculating refund amount based on fare rules and ticket conditions...';
          break;
        default:
          responseContent = `Command \`${cmd}\` recognized. Processing...`;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: '',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
      setMessagesPerTab(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), aiResponse],
      }));
    }, 800);
  };

  const handleProcess = (pnr: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Opening PNR **${pnr}** for processing. Loading passenger details, itinerary, and ticket status...`,
      timestamp: '',
    };
    setMessagesPerTab(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newMessage],
    }));
    setShowResults(false);
  };

  const sampleResults: SearchResult[] = [
    { gds: 'SBR', pnr: 'ZXJ992', passenger: 'SMITH/ALEXANDER', ttl: '14:00', status: 'urgent' },
    { gds: 'AMD', pnr: 'KJH771', passenger: 'CHEN/WEI', ttl: '16:30', status: 'warning' },
    { gds: 'WSP', pnr: 'RTY445', passenger: 'JOHNSON/MARY', ttl: '18:45', status: 'normal' },
  ];

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full min-h-0",
        isDark && "workspace-dark bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950"
      )}
    >
      <WorkspaceTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTabClose={onTabClose}
        isDark={isDark}
      />

      {/* Chat Area – theme-aware */}
      <div
        ref={chatScrollRef}
        className={cn(
          "flex-1 overflow-y-auto p-6 space-y-6 min-h-0",
          isDark ? "bg-gradient-to-b from-slate-900/40 to-transparent" : "workspace-chat-area"
        )}
      >
        {/* Default workspace welcome (global tab, no messages yet) */}
        {activeTab === 'global' && currentMessages.length === 0 && (() => {
          const recentItems = [
            { id: '1', label: 'PNR GHK821', sub: 'Ticketing pending' },
            { id: '2', label: 'PNR ABC123', sub: 'Rebooking confirmed' },
            { id: '3', label: 'PNR ZXJ992', sub: 'Sabre · 2 segments' },
            { id: '4', label: 'Case CS-9821', sub: 'Email: MARCUS.V@AIR.COM' },
            { id: '5', label: 'PNR KJH771', sub: 'Amadeus · Refund requested' },
          ];
          const quickActions = [
            { id: 'ticketing', label: 'Ticketing' },
            { id: 'reissue', label: 'Re-Issue' },
            { id: 'refunds', label: 'Refunds' },
            { id: 'void', label: 'Void' },
          ];
          return (
            <div className={cn("flex flex-col items-center justify-center min-h-[calc(100%-2rem)] py-12 px-4", !isDark && "workspace-welcome-bg")}>
              <div className={cn("w-20 h-20 rounded-full overflow-hidden shadow-xl border-4 mb-6 relative group", isDark ? "border-white/10" : "border-background/50")}>
                <div className={cn("absolute inset-0 transition-colors", isDark ? "bg-violet-500/10 group-hover:bg-transparent" : "bg-primary/10 group-hover:bg-transparent")} />
                <img 
                  src={travelAssistantAvatar} 
                  alt="Travel Assistant" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className={cn("text-2xl font-bold text-center mb-2", isDark ? "text-white" : "text-foreground")}>
                How can I help you today?
              </h2>
              <p className={cn("text-sm text-center max-w-md mb-8", isDark ? "text-slate-400" : "text-muted-foreground")}>
                Select an intake card or start a global search for cases, PNRs, or flights.
              </p>
              <div className="w-full max-w-xl space-y-6">
                <div>
                  <h3 className={cn("text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2", isDark ? "text-slate-400" : "text-muted-foreground")}>
                    <Clock className="h-3.5 w-3.5" />
                    Recent (5)
                  </h3>
                  <div className="space-y-1.5">
                    {recentItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpenRecentItem ? onOpenRecentItem(item) : handleSend(`Open ${item.label}`, gdsState)}
                        className={cn(
                          "w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3 px-4 py-2.5 rounded-xl hover:shadow-soft-lg transition-all text-left",
                          isDark
                            ? "bg-slate-800/95 border border-white/10 hover:bg-slate-700/90"
                            : "glass-bubble"
                        )}
                      >
                        <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-foreground")}>{item.label}</span>
                        <span className={cn("text-xs", isDark ? "text-slate-400" : "text-muted-foreground")}>{item.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className={cn("text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2", isDark ? "text-slate-400" : "text-muted-foreground")}>
                    <Zap className="h-3.5 w-3.5" />
                    Quick actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => onQuickActionClick ? onQuickActionClick(action.label) : handleSend(action.label, gdsState)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl hover:shadow-soft-lg transition-all text-sm font-medium",
                          isDark
                            ? "bg-slate-800/95 border border-white/10 hover:bg-slate-700/90 hover:text-violet-300 text-white"
                            : "glass-bubble hover:text-primary text-foreground"
                        )}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {currentMessages.map((message, messageIndex) => {
          const isPaymentChoiceMessage =
            message.suggestions?.length === 2 &&
            message.suggestions.some(s => s.command === 'Customer card') &&
            message.suggestions.some(s => s.command === 'vCard');
          const chosenPayment =
            isPaymentChoiceMessage
              ? currentMessages.slice(messageIndex + 1).find(m => m.role === 'user' && (m.content === 'vCard' || m.content === 'Customer card'))?.content
              : null;

          return (
            <div key={message.id}>
              <ChatMessage
                message={message}
                onItineraryAddToTrip={message.itineraryData ? handleItineraryAddToTrip : undefined}
                onInvoiceSendEmail={message.invoiceData ? () => handleInvoiceSendEmail(message.invoiceData!) : undefined}
              />
              
              {/* Show PNR Card after AI message – same width as AI bubble, same bg */}
              {message.pnrData && showPNRCard && (
                <div className="pl-14 mt-4 max-w-2xl">
                  <PNRDetailCard
                    data={message.pnrData}
                    onViewReceipt={() => console.log('View receipt')}
                    onSyncPNR={() => handleSlashCommand('/sync', gdsState)}
                  />
                </div>
              )}

              {/* Show Flight Options Card */}
              {message.flightOptions && (
                 <div className="pl-14 mt-4">
                    <FlightChatCard 
                        options={message.flightOptions}
                        onViewAll={() => onShowRightPanel && onShowRightPanel('flight_results', message.flightOptions)}
                        onSelect={(opt) => {
                             // Handle selection in chat
                             handleSend(`Select flight ${opt.flightNumber}`, gdsState);
                        }}
                    />
                 </div>
              )}

              {/* Show Hotel Options Card (top 5 in chat, View all opens right panel) */}
              {message.hotelOptions && (
                <div className="pl-14 mt-4">
                  <HotelChatCard
                    options={message.hotelOptions}
                    onViewAll={() => onShowRightPanel && onShowRightPanel('hotel_results', message.hotelOptions)}
                    onSelect={(opt) => handleSend(opt.name, gdsState)}
                  />
                </div>
              )}

              {/* Show Hotel Room Options */}
              {message.hotelRoomOptions && (
                <div className="pl-14 mt-4 space-y-3">
                  <HotelRoomOptionsCard
                    hotelName={message.hotelNameForRooms || 'Hotel'}
                    options={message.hotelRoomOptions}
                    onSelect={(room) => handleSend(`Select room ${room.id}`, gdsState)}
                  />
                  {message.hotelPolicies && (
                    <HotelPoliciesCard
                      hotelName={message.hotelNameForRooms || 'Hotel'}
                      policies={message.hotelPolicies}
                    />
                  )}
                </div>
              )}

              {/* Show Hotel Booking Confirmation */}
              {message.hotelBookingConfirmation && (
                <div className="pl-14 mt-4">
                  <HotelBookingConfirmationCard confirmation={message.hotelBookingConfirmation} />
                </div>
              )}

              {/* MOT: Price options */}
              {message.motPriceOptions && (
                <div className="pl-14 mt-4">
                  <MOTPriceCard
                    pnrOrRef={getPnrOrTripIdFromContext().pnr}
                    options={message.motPriceOptions}
                    onSelect={(opt) => {
                      const idx = message.motPriceOptions!.findIndex(o => o.id === opt.id);
                      handleSend(idx >= 0 ? String(idx + 1) : opt.label, gdsState);
                    }}
                  />
                </div>
              )}

              {/* MOT: Payment & billing */}
              {message.motPaymentPrompt && (
                <div className="pl-14 mt-4">
                  <MOTPaymentCard
                    pnrOrRef={message.motPaymentPrompt.pnrOrRef}
                    amount={message.motPaymentPrompt.amount}
                    currency={message.motPaymentPrompt.currency}
                    onOrderTicket={() => handleSend('Order ticket', gdsState)}
                  />
                </div>
              )}

              {/* MOT: Ticketing status */}
              {message.motTicketingStatus && (
                <div className="pl-14 mt-4">
                  <MOTTicketingStatusCard pnrOrRef={message.motTicketingStatus.pnrOrRef} steps={message.motTicketingStatus.steps} />
                </div>
              )}

              {/* MOT: Ticket numbers */}
              {message.motTicketNumbers && (
                <div className="pl-14 mt-4">
                  <MOTTicketNumbersCard pnrOrRef={message.motTicketNumbers.pnrOrRef} numbers={message.motTicketNumbers.numbers} />
                </div>
              )}

              {/* MOT: Email compose – Send / Cancel */}
              {message.motEmailCompose && (
                <div className="pl-14 mt-4">
                  <MOTEmailComposeCard
                    email={message.motEmailCompose}
                    onSend={() => handleSend('send', gdsState)}
                    onCancel={() => handleSend('cancel', gdsState)}
                  />
                </div>
              )}

              {/* Show Ancillaries – select one or more, then Add to PNR; or Continue (flight booking) */}
              {message.ancillaryOptions && (
                <div className="pl-14 mt-4">
                  <AncillaryOptionsCard
                    pnr={message.ancillaryOptions.pnr}
                    items={message.ancillaryOptions.items}
                    onAddToPnr={(selectedIds) => {
                      const items = message.ancillaryOptions!.items;
                      const names = items.filter((i) => selectedIds.includes(i.id)).map((i) => i.name);
                      const confirmMsg: Message = {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `✅ **Added to PNR ${message.ancillaryOptions!.pnr}:** ${names.join(', ')}.`,
                        timestamp: '',
                      };
                      setMessagesPerTab((prev) => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), confirmMsg] }));
                    }}
                    continueMode={flightSearchFlow[activeTab]?.step === 'ancillary'}
                    onContinue={flightSearchFlow[activeTab]?.step === 'ancillary' ? handleFlightAncillaryContinue : undefined}
                  />
                </div>
              )}

              {/* Command Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="pl-14 mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion) => {
                    const isChosen = chosenPayment === suggestion.command;
                    const isDisabled = chosenPayment != null && !isChosen;
                    return (
                      <button
                        key={suggestion.command}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && handleSend(suggestion.command, gdsState)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed bg-muted/30 border-border text-muted-foreground'
                            : isChosen
                              ? 'bg-primary/15 border-primary/40 text-primary'
                              : 'bg-secondary/50 border-border hover:border-primary/30 hover:bg-secondary'
                        }`}
                      >
                        <span className={isDisabled ? 'font-mono' : 'text-primary font-mono'}>{suggestion.command}</span>
                        <span className="text-muted-foreground text-xs">{suggestion.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {showResults && (
          <div className="pl-14">
            <SearchResultsTable
              title="Search Results: Pending Cancellations"
              results={sampleResults}
              onProcess={handleProcess}
            />
          </div>
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        gdsState={gdsState}
        onGDSChange={handleGDSChange}
        dark={isDark}
      />
    </div>
  );
}
