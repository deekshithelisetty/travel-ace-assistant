import { useState, useEffect, useRef } from 'react';
import { Sparkles, Clock, Zap } from 'lucide-react';
import { WorkspaceTabs } from './WorkspaceTabs';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SearchResultsTable } from './SearchResultsTable';
import { PNRDetailCard } from './PNRDetailCard';
import { Tab, Message, SearchResult, GDSState, ActivityItem, PNRData, CommandSuggestion, GDSType } from '@/types/crm';

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
}: WorkspaceProps) {
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
  /** When user types a GDS command before PCC is set, we ask for PCC and store the command to run after they connect. */
  const [pendingGdsCommand, setPendingGdsCommand] = useState<Record<string, string>>({});

  const currentMessages = messagesPerTab[activeTab] || [];
  const currentTab = tabs.find(t => t.id === activeTab);
  const sentQuickActionForRef = useRef<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  // When a quick-action tab is opened, send the pending message in that tab (once)
  useEffect(() => {
    if (!pendingQuickAction || activeTab !== pendingQuickAction.tabId) return;
    if (sentQuickActionForRef.current === pendingQuickAction.tabId) return;
    sentQuickActionForRef.current = pendingQuickAction.tabId;
    handleSend(pendingQuickAction.message, gdsState);
    onClearPendingQuickAction?.();
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

    // Handle slash commands
    if (content.startsWith('/')) {
      handleSlashCommand(content, currentGdsState);
      return;
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
    <div className="flex-1 flex flex-col h-full bg-background">
      <WorkspaceTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTabClose={onTabClose}
      />

      {/* Chat Area */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
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
            <div
              className="flex flex-col items-center justify-center min-h-[calc(100%-2rem)] py-12 px-4"
              style={{
                background: 'radial-gradient(ellipse 80% 70% at 50% 40%, hsl(var(--primary) / 0.08) 0%, transparent 55%), hsl(var(--background))',
              }}
            >
              <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center mb-6 shadow-sm">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
                Select an intake card or start a global search for cases, PNRs, or flights.
              </p>
              <div className="w-full max-w-xl space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Recent (5)
                  </h3>
                  <div className="space-y-1.5">
                    {recentItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpenRecentItem ? onOpenRecentItem(item) : handleSend(`Open ${item.label}`, gdsState)}
                        className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/20 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" />
                    Quick actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => onQuickActionClick ? onQuickActionClick(action.label) : handleSend(action.label, gdsState)}
                        className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/20 hover:text-primary transition-colors text-sm font-medium text-foreground"
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
              <ChatMessage message={message} />
              
              {/* Show PNR Card after AI message with PNR data */}
              {message.pnrData && showPNRCard && (
                <div className="pl-14 mt-4">
                  <PNRDetailCard
                    data={message.pnrData}
                    onViewReceipt={() => console.log('View receipt')}
                    onSyncPNR={() => handleSlashCommand('/sync', gdsState)}
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
      />
    </div>
  );
}
