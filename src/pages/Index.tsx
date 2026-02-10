import { useState } from 'react';
import { ActivityPanel } from '@/components/travel/ActivityPanel';
import { Workspace } from '@/components/travel/Workspace';
import { CaseIntelligencePanel } from '@/components/travel/CaseIntelligencePanel';
import { FlightResultsPanel } from '@/components/travel/FlightResultsPanel';
import { HotelResultsPanel } from '@/components/travel/HotelResultsPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ActivityItem, Tab, CaseIntelligence, WorkedCase, CCVInfo, PNRActivityEvent, FlightOption, HotelOption } from '@/types/crm';

// Sample CCV-rejected PNR for flow demo
const sampleCCVInfo: CCVInfo = {
  pnr: 'MXCHSI',
  status: 'DECLINED',
  highRisk: true,
  proceedFulfillment: false,
  riskScore: 0,
  identityCheckScore: 313,
  identityNetworkScore: 0,
  customer: {
    name: 'Amanatullah Amanatullah',
    phone: 'xxxxxxxx92',
    email: 'xxxxxxxx@ziyarahinternationaltravels.com',
    ipAddress: '183.82.107.184',
    billingAddress: '951 Mariners Boulevard Suite 130, San Mateo, CA, US, 94404',
  },
  validations: {
    phone: { valid: true, value: '7133473792', match: false },
    email: { valid: true, value: 'info@ziyarahinternationaltravels.com', match: false },
    address: { valid: false, match: false },
  },
  journey: {
    route: 'DEL–BOM–DXB',
    date: '15 Feb 2026',
    segments: ['6E 2341', '6E 512'],
  },
};

const sampleCCVActivity: PNRActivityEvent[] = [
  { id: 'a1', type: 'CCV', title: 'MXCHSI - CCV', subtitle: 'Amanatullah Amanatullah - CCV', timestamp: '02/06/2026 4:13 p', status: 'FAILURE' },
  { id: 'a2', type: 'CASE', title: 'MXCHSI - Case: CV1001511838', subtitle: 'Amanatullah Amanatullah ccv', timestamp: '02/06/2026 4:13 p', status: 'PENDING' },
  { id: 'a3', type: 'TICKET_ORDER', title: 'MXCHSI - TICKET_ORDER', subtitle: 'Amanatullah Amanatullah - MOT', timestamp: '02/06/2026 4:13 p', status: 'PENDING' },
  { id: 'a4', type: 'TICKETING_QC', title: 'MXCHSI - TICKETING_QC', subtitle: 'Auto User - QC', timestamp: '02/06/2026 4:12 p', status: 'PENDING' },
  { id: 'a5', type: 'BOOKING', title: 'MXCHSI - BOOKING', subtitle: 'Amanatullah Amanatullah - MANUAL_BOOKING', timestamp: '02/06/2026 4:12 p', status: 'SUCCESS' },
];

// Sample activity data – different cards for CCV, CCD, Ticketing, Ancillary, ReIssue, Refund
const sampleActivities: ActivityItem[] = [
  {
    id: 'ccv1',
    type: 'ccv_rejected',
    title: 'CCV Rejected – Review required',
    subtitle: 'Address validation failed, high risk',
    timestamp: 'JUST NOW',
    badge: 'PNR:MXCHSI',
    isNew: true,
    status: 'new',
    caseId: 'CV1001511838',
    ccvInfo: sampleCCVInfo,
    pnrActivity: sampleCCVActivity,
    flowSteps: [
      { key: 'booking', label: 'Booking', status: 'completed' },
      { key: 'ccv', label: 'Credit card verification', status: 'failed' },
      { key: 'ticketing', label: 'Ticketing', status: 'pending' },
      { key: 'ancillary', label: 'Ancillaries', status: 'pending' },
    ],
  },
  {
    id: 'ccd1',
    type: 'ccd',
    title: 'Credit card denied – No funds',
    subtitle: 'Ticketing failed due to card decline. Customer to update payment.',
    timestamp: 'JUST NOW',
    badge: 'PNR:AB12CD',
    isNew: true,
    status: 'new',
    flowSteps: [
      { key: 'booking', label: 'Booking', status: 'completed' },
      { key: 'ccv', label: 'Credit card verification', status: 'completed' },
      { key: 'ticketing', label: 'Ticketing', status: 'failed' },
      { key: 'ancillary', label: 'Ancillaries', status: 'pending' },
    ],
  },
  {
    id: 'tick1',
    type: 'ticketing_failed',
    title: 'Ticketing failed – Pax / fare issue',
    subtitle: 'Pax information missing or fare mismatch. Classes not available.',
    timestamp: '2M AGO',
    badge: 'PNR:EF34GH',
    isNew: true,
    status: 'new',
    flowSteps: [
      { key: 'booking', label: 'Booking', status: 'completed' },
      { key: 'ccv', label: 'Credit card verification', status: 'completed' },
      { key: 'ticketing', label: 'Ticketing', status: 'failed' },
      { key: 'ancillary', label: 'Ancillaries', status: 'pending' },
    ],
  },
  {
    id: 'anc1',
    type: 'ancillary_failed',
    title: 'Ancillary failed – Seats/meals',
    subtitle: 'Seats, meals or insurance request failed. Manual review needed.',
    timestamp: '5M AGO',
    badge: 'PNR:IJ56KL',
    isNew: true,
    status: 'new',
    flowSteps: [
      { key: 'booking', label: 'Booking', status: 'completed' },
      { key: 'ccv', label: 'Credit card verification', status: 'completed' },
      { key: 'ticketing', label: 'Ticketing', status: 'completed' },
      { key: 'ancillary', label: 'Ancillaries', status: 'failed' },
    ],
  },
  {
    id: 'reissue1',
    type: 'reissue_failed',
    title: 'Reissue failed – Manual review',
    subtitle: 'AI reissue processing failed. Agent action required.',
    timestamp: '8M AGO',
    badge: 'PNR:MN78OP',
    isNew: true,
    status: 'new',
    flowSteps: [
      { key: 'booking', label: 'Booking', status: 'completed' },
      { key: 'reissue', label: 'Reissue', status: 'failed' },
    ],
  },
  {
    id: 'refund1',
    type: 'refund_failed',
    title: 'Refund failed – Manual review',
    subtitle: 'AI refund processing failed. Agent action required.',
    timestamp: '12M AGO',
    badge: 'PNR:QR90ST',
    isNew: true,
    status: 'new',
    flowSteps: [
      { key: 'booking', label: 'Booking', status: 'completed' },
      { key: 'refund', label: 'Refund', status: 'failed' },
    ],
  },
  {
    id: '1',
    type: 'pnr',
    title: 'Ticketing Request Pending',
    subtitle: 'BA285 LHR-SFO',
    timestamp: '15M AGO',
    badge: 'PNR:GHK821',
    isNew: true,
    status: 'new',
  },
  {
    id: '2',
    type: 'pnr',
    title: 'Rebooking Confirmed',
    subtitle: 'Lufthansa FRA-JFK Seg 01 updated.',
    timestamp: '20M AGO',
    badge: 'PNR:GHK821',
    status: 'resolved',
    caseId: 'CS-9821',
  },
  {
    id: '3',
    type: 'email',
    title: 'Upgrade request - Corporate',
    subtitle: 'MARCUS.V@AIR.COM',
    timestamp: '14M AGO',
    badge: 'EMAIL',
    status: 'new',
  },
  {
    id: '4',
    type: 'queue',
    title: 'Queue: ADTK Alert',
    subtitle: '',
    timestamp: '1H AGO',
    badge: 'QUEUE7',
    status: 'new',
  },
];

const sampleIntelligence: CaseIntelligence = {
  complexityScore: 2.4,
  maxScore: 10.0,
  timeline: [
    {
      id: '1',
      icon: 'received',
      title: 'Received',
      description: 'System auto-triaged via Email API',
      timestamp: '09:42:15',
    },
    {
      id: '2',
      icon: 'assignment',
      title: 'Assignment',
      description: 'Routed to H. Bennett (Senior Agent)',
      timestamp: '09:43:02',
    },
    {
      id: '3',
      icon: 'gds',
      title: 'GDS Action',
      description: 'Sabre PNR Sync Initiated',
      timestamp: '09:44:29',
    },
    {
      id: '4',
      icon: 'resolution',
      title: 'Final Resolution',
      description: 'Case pending closure',
      timestamp: 'JUST NOW',
    },
  ],
  slaPercentage: 92,
  efficiencyData: [45, 65, 55, 80, 70, 85, 75, 90],
};

const TravelCRM = () => {
  const [activities, setActivities] = useState<ActivityItem[]>(sampleActivities);
  const [workedCases, setWorkedCases] = useState<WorkedCase[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'global', type: 'global', label: 'GLOBAL' },
  ]);
  const [activeTab, setActiveTab] = useState('global');
  const [caseIntelligence, setCaseIntelligence] = useState<CaseIntelligence | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'intelligence' | 'flight_results' | 'hotel_results'>('intelligence');
  const [flightResults, setFlightResults] = useState<FlightOption[]>([]);
  const [flightSearchTabId, setFlightSearchTabId] = useState<string | null>(null);
  const [hotelResults, setHotelResults] = useState<HotelOption[]>([]);
  const [hotelSearchTabId, setHotelSearchTabId] = useState<string | null>(null);
  const [pendingQuickAction, setPendingQuickAction] = useState<{ tabId: string; message: string } | null>(null);

  const openCaseForItem = (item: ActivityItem) => {
    const pnr = item.badge.replace('PNR:', '').trim();
    const existingTab = tabs.find(
      tab =>
        (tab.type === 'ccv' && tab.pnr === pnr) ||
        (tab.type === 'pnr' && tab.pnr === pnr) ||
        (tab.type === 'email' && item.type === 'email' && tab.label.includes(item.subtitle || ''))
    );

    if (existingTab) {
      setActiveTab(existingTab.id);
    } else if (item.type === 'ccv_rejected' && item.ccvInfo) {
      const newTab: Tab = {
        id: `ccv-${item.id}`,
        type: 'ccv',
        label: `CCV #${pnr}`,
        pnr,
        status: 'working',
        accepted: true,
        ccvInfo: item.ccvInfo,
        pnrActivity: item.pnrActivity ?? [],
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
      setActivities(prev => prev.filter(a => a.id !== item.id));
      setWorkedCases(prev => [
        ...prev,
        { id: newTab.id, pnr, title: `CCV ${pnr}`, status: 'working', lastWorked: 'Just now' },
      ]);
    } else {
      const isManualIntervention = ['ccd', 'ticketing_failed', 'ancillary_failed', 'reissue_failed', 'refund_failed'].includes(item.type);
      const newTab: Tab = {
        id: `${item.type}-${item.id}`,
        type: item.type === 'email' ? 'email' : 'pnr',
        label: item.type === 'email' ? `Email: ${item.subtitle}` : isManualIntervention ? item.badge : `Case #${pnr}`,
        pnr: item.type === 'email' ? undefined : pnr,
        email: item.type === 'email' ? item.subtitle : undefined,
        status: 'working',
        accepted: true,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
      setActivities(prev => prev.filter(a => a.id !== item.id));
      setWorkedCases(prev => [
        ...prev,
        { id: item.id, pnr, title: item.title, status: 'working', lastWorked: 'Just now' },
      ]);
      if (item.type === 'pnr') {
        setCaseIntelligence(sampleIntelligence);
      }
    }
  };

  const handleActivityClick = (item: ActivityItem) => {
    openCaseForItem(item);
  };

  const handleAccept = (item: ActivityItem) => {
    openCaseForItem(item);
  };

  const handleReject = (item: ActivityItem) => {
    setActivities(prev => prev.filter(a => a.id !== item.id));
  };

  const handleTabClose = (tabId: string) => {
    const closingTab = tabs.find((t) => t.id === tabId);
    const isClosingGlobal = tabId === 'global';
    const remainingTabs = tabs.filter((t) => t.id !== tabId);

    setTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== tabId);
      if (isClosingGlobal && next.length === 0) return [{ id: 'global', type: 'global', label: 'GLOBAL' }];
      return next;
    });

    if (!isClosingGlobal && !closingTab?.accepted) {
      setWorkedCases((prev) =>
        prev.filter((c) => {
          if (closingTab?.type === 'pnr' && closingTab.pnr) return c.pnr !== closingTab.pnr;
          return c.id !== tabId;
        })
      );
    }

    if (activeTab === tabId) {
      if (isClosingGlobal) setActiveTab(remainingTabs[0]?.id ?? 'global');
      else setActiveTab('global');
    }
    if (closingTab?.type === 'pnr') {
      setCaseIntelligence(null);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.type === 'pnr') {
      setCaseIntelligence(sampleIntelligence);
    } else {
      setCaseIntelligence(null);
    }
  };

  const activeTabData = tabs.find(t => t.id === activeTab);
  const pnrActivityForPanel = activeTabData?.pnrActivity ?? null;

  const handleChatClick = () => {
    const hasGlobal = tabs.some((t) => t.id === 'global');
    if (!hasGlobal) {
      setTabs((prev) => [{ id: 'global', type: 'global', label: 'GLOBAL' }, ...prev]);
    }
    setActiveTab('global');
  };

  /** Send message from left-panel Chat tab into main chat (global tab) and get AI response */
  const handleSendFromSidebar = (text: string) => {
    const hasGlobal = tabs.some((t) => t.id === 'global');
    if (!hasGlobal) {
      setTabs((prev) => [{ id: 'global', type: 'global', label: 'GLOBAL' }, ...prev]);
    }
    setActiveTab('global');
    setPendingQuickAction({ tabId: 'global', message: text.trim() });
  };

  /** Quick action: open a new conversation tab and send the action as first message; AI will suggest tab name */
  const handleQuickActionClick = (actionLabel: string) => {
    const tabId = `conv-${Date.now()}`;
    const newTab: Tab = {
      id: tabId,
      type: 'global',
      label: actionLabel,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(tabId);
    setPendingQuickAction({ tabId, message: actionLabel });
    setWorkedCases((prev) => [
      ...prev,
      { id: tabId, title: actionLabel, status: 'working', lastWorked: 'Just now' },
    ]);
  };

  const handleClearPendingQuickAction = () => setPendingQuickAction(null);

  const handleSuggestTabLabel = (tabId: string, suggestedLabel: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, label: suggestedLabel } : t)));
    setWorkedCases((prev) =>
      prev.map((c) => (c.id === tabId ? { ...c, title: suggestedLabel } : c))
    );
  };

  /** Open a recent PNR/case in its own tab (or switch to existing tab) */
  const handleOpenRecentItem = (item: { id: string; label: string; sub: string }) => {
    const isPnr = item.label.startsWith('PNR ');
    const isCase = item.label.startsWith('Case ');
    const pnrCode = isPnr ? item.label.replace('PNR ', '').trim() : null;
    const caseId = isCase ? item.label.replace('Case ', '').trim() : null;

    const existingTab = tabs.find((t) => {
      if (t.id === 'global') return false;
      if (pnrCode && t.type === 'pnr' && t.pnr === pnrCode) return true;
      if (caseId && (t.label === item.label || t.id === `case-${caseId}`)) return true;
      return false;
    });

    if (existingTab) {
      setActiveTab(existingTab.id);
      if (existingTab.type === 'pnr') {
        setCaseIntelligence(sampleIntelligence);
      }
      return;
    }

    if (pnrCode) {
      const newTab: Tab = {
        id: `pnr-${pnrCode}`,
        type: 'pnr',
        label: `Case #${pnrCode}`,
        pnr: pnrCode,
        status: 'working',
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(newTab.id);
      setCaseIntelligence(sampleIntelligence);
      setWorkedCases((prev) =>
        prev.some((c) => c.pnr === pnrCode)
          ? prev
          : [...prev, { id: item.id, pnr: pnrCode, title: item.sub, status: 'working', lastWorked: 'Just now' }]
      );
    } else if (caseId) {
      const newTab: Tab = {
        id: `case-${caseId}`,
        type: 'email',
        label: item.label,
        status: 'working',
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(newTab.id);
      setWorkedCases((prev) =>
        prev.some((c) => c.id === newTab.id)
          ? prev
          : [...prev, { id: newTab.id, title: item.label, status: 'working', lastWorked: 'Just now' }]
      );
    }
  };

  const handleWorkedCaseClick = (workedCase: WorkedCase) => {
    const existingTab = tabs.find(
      (tab) => tab.id === workedCase.id || (workedCase.pnr && tab.pnr === workedCase.pnr)
    );
    if (existingTab) {
      setActiveTab(existingTab.id);
      if (existingTab.type === 'pnr') setCaseIntelligence(sampleIntelligence);
    } else if (workedCase.pnr) {
      const newTab: Tab = {
        id: `pnr-${workedCase.id}`,
        type: 'pnr',
        label: `Case #${workedCase.pnr}`,
        pnr: workedCase.pnr,
        status: workedCase.status,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(newTab.id);
      setCaseIntelligence(sampleIntelligence);
    } else {
      const newTab: Tab = {
        id: workedCase.id,
        type: 'global',
        label: workedCase.title,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTab(newTab.id);
    }
  };

  const handleCaseResolved = (tabId: string) => {
    // Update worked case status
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.pnr) {
      setWorkedCases(prev => 
        prev.map(c => 
          c.pnr === tab.pnr 
            ? { ...c, status: 'resolved' as const, lastWorked: 'Just now' }
            : c
        )
      );
      // Update tab status
      setTabs(prev =>
        prev.map(t =>
          t.id === tabId
            ? { ...t, status: 'resolved' as const, label: `${t.label} - Resolved` }
            : t
        )
      );
    }
  };

  const handleShowRightPanel = (content: 'intelligence' | 'flight_results' | 'hotel_results', data?: any) => {
    setRightPanelMode(content);
    if (content === 'flight_results') {
      setFlightResults(data ?? []);
      setFlightSearchTabId(activeTab);
    }
    if (content === 'hotel_results') {
      setHotelResults(data ?? []);
      setHotelSearchTabId(activeTab);
    }
    setRightPanelOpen(true);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden relative bg-background text-foreground">
      {leftPanelOpen ? (
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          <ResizablePanel defaultSize={22} minSize={16} maxSize={50} className="min-w-0">
            <ActivityPanel
              items={activities}
              workedCases={workedCases}
              onItemClick={handleActivityClick}
              onAccept={handleAccept}
              onReject={handleReject}
              onChatClick={handleChatClick}
              onSendMessage={handleSendFromSidebar}
              onWorkedCaseClick={handleWorkedCaseClick}
              collapsed={false}
              onToggle={() => setLeftPanelOpen(false)}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={78} minSize={30} className="min-w-0">
            <div className="flex h-full w-full min-w-0">
              <div className="flex-1 min-w-0 flex flex-col">
                <Workspace
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onTabClose={handleTabClose}
                onAddTab={handleActivityClick}
                onOpenRecentItem={handleOpenRecentItem}
                onQuickActionClick={handleQuickActionClick}
                pendingQuickAction={pendingQuickAction}
                onClearPendingQuickAction={handleClearPendingQuickAction}
                onSuggestTabLabel={handleSuggestTabLabel}
                onCaseResolved={handleCaseResolved}
                onShowRightPanel={handleShowRightPanel}
              />
              </div>
              {rightPanelMode === 'intelligence' ? (
                <CaseIntelligencePanel
                  intelligence={caseIntelligence}
                  pnrActivity={pnrActivityForPanel}
                  userInitials="HB"
                  userName="H. Bennett"
                  collapsed={!rightPanelOpen}
                  onToggle={() => setRightPanelOpen((prev) => !prev)}
                />
              ) : (
                <FlightResultsPanel
                  options={flightResults}
                  onSelect={(opt) => {
                    if (flightSearchTabId) {
                      setPendingQuickAction({ tabId: flightSearchTabId, message: `Select flight ${opt.flightNumber}` });
                      setActiveTab(flightSearchTabId);
                    }
                  }}
                  collapsed={!rightPanelOpen}
                  onToggle={() => {
                    setRightPanelOpen((prev) => !prev);
                    if (rightPanelOpen) setTimeout(() => setRightPanelMode('intelligence'), 300);
                  }}
                />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-1 h-full min-w-0 relative">
          <button
            type="button"
            onClick={() => setLeftPanelOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-14 rounded-r-lg bg-card border border-l-0 border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary shadow-md"
            aria-label="Expand left panel"
          >
            →
          </button>
          <div className="flex flex-1 h-full min-w-0">
            <div className="flex-1 min-w-0 flex flex-col">
              <Workspace
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
            onAddTab={handleActivityClick}
            onOpenRecentItem={handleOpenRecentItem}
            onQuickActionClick={handleQuickActionClick}
            pendingQuickAction={pendingQuickAction}
            onClearPendingQuickAction={handleClearPendingQuickAction}
            onSuggestTabLabel={handleSuggestTabLabel}
            onCaseResolved={handleCaseResolved}
            onShowRightPanel={handleShowRightPanel}
          />
            </div>
            {rightPanelMode === 'intelligence' ? (
              <CaseIntelligencePanel
              intelligence={caseIntelligence}
              pnrActivity={pnrActivityForPanel}
              userInitials="HB"
              userName="H. Bennett"
              collapsed={!rightPanelOpen}
              onToggle={() => setRightPanelOpen((prev) => !prev)}
            />
            ) : rightPanelMode === 'hotel_results' ? (
              <HotelResultsPanel
                options={hotelResults}
                onSelect={(opt) => {
                  if (hotelSearchTabId) {
                    setPendingQuickAction({ tabId: hotelSearchTabId, message: opt.name });
                    setActiveTab(hotelSearchTabId);
                  }
                }}
                collapsed={!rightPanelOpen}
                onToggle={() => {
                  setRightPanelOpen((prev) => !prev);
                  if (rightPanelOpen) setTimeout(() => setRightPanelMode('intelligence'), 300);
                }}
              />
            ) : (
              <FlightResultsPanel
                options={flightResults}
                onSelect={(opt) => {
                  if (flightSearchTabId) {
                    setPendingQuickAction({ tabId: flightSearchTabId, message: `Select flight ${opt.flightNumber}` });
                    setActiveTab(flightSearchTabId);
                  }
                }}
                collapsed={!rightPanelOpen}
                onToggle={() => {
                  setRightPanelOpen((prev) => !prev);
                  if (rightPanelOpen) setTimeout(() => setRightPanelMode('intelligence'), 300);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelCRM;
