import { useState } from 'react';
import { ActivityPanel } from '@/components/travel/ActivityPanel';
import { Workspace } from '@/components/travel/Workspace';
import { CaseIntelligencePanel } from '@/components/travel/CaseIntelligencePanel';
import { ActivityItem, Tab, CaseIntelligence, WorkedCase } from '@/types/crm';

// Sample activity data
const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'pnr',
    title: 'Ticketing Request Pending',
    subtitle: 'BA285 LHR-SFO',
    timestamp: 'JUST NOW',
    badge: 'PNR:GHK821',
    isNew: true,
    status: 'new',
  },
  {
    id: '2',
    type: 'pnr',
    title: 'Rebooking Confirmed',
    subtitle: 'Lufthansa FRA-JFK Seg 01 updated.',
    timestamp: '5M AGO',
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
  const [pendingQuickAction, setPendingQuickAction] = useState<{ tabId: string; message: string } | null>(null);

  const openCaseForItem = (item: ActivityItem) => {
    const existingTab = tabs.find(
      tab => (tab.type === 'pnr' && tab.pnr === item.badge.replace('PNR:', '').trim()) ||
             (tab.type === 'email' && item.type === 'email' && tab.label.includes(item.subtitle || ''))
    );

    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      const pnr = item.badge.replace('PNR:', '').trim();
      const newTab: Tab = {
        id: `${item.type}-${item.id}`,
        type: item.type === 'email' ? 'email' : 'pnr',
        label: item.type === 'pnr' ? `Case #${pnr}` : `Email: ${item.subtitle}`,
        pnr: item.type === 'pnr' ? pnr : undefined,
        email: item.type === 'email' ? item.subtitle : undefined,
        status: 'working',
        accepted: true,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);

      setActivities(prev => prev.filter(a => a.id !== item.id));
      setWorkedCases(prev => [
        ...prev,
        {
          id: item.id,
          pnr: pnr,
          title: item.title,
          status: 'working',
          lastWorked: 'Just now',
        },
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

  const handleChatClick = () => {
    const hasGlobal = tabs.some((t) => t.id === 'global');
    if (!hasGlobal) {
      setTabs((prev) => [{ id: 'global', type: 'global', label: 'GLOBAL' }, ...prev]);
    }
    setActiveTab('global');
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

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <ActivityPanel
        items={activities}
        workedCases={workedCases}
        onItemClick={handleActivityClick}
        onAccept={handleAccept}
        onReject={handleReject}
        onChatClick={handleChatClick}
        onWorkedCaseClick={handleWorkedCaseClick}
        collapsed={!leftPanelOpen}
        onToggle={() => setLeftPanelOpen((prev) => !prev)}
      />
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
      />
      <CaseIntelligencePanel
        intelligence={caseIntelligence}
        userInitials="HB"
        userName="H. Bennett"
        collapsed={!rightPanelOpen}
        onToggle={() => setRightPanelOpen((prev) => !prev)}
      />
    </div>
  );
};

export default TravelCRM;
