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

  const handleActivityClick = (item: ActivityItem) => {
    // Check if tab already exists
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
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);

      // Remove from activity stream and add to worked cases
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

      // Show case intelligence for PNR tabs
      if (item.type === 'pnr') {
        setCaseIntelligence(sampleIntelligence);
      }
    }
  };

  const handleTabClose = (tabId: string) => {
    if (tabId === 'global') return;
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab('global');
    }
    
    // Clear intelligence if closing a PNR tab
    const closingTab = tabs.find(t => t.id === tabId);
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
    // Switch to global tab for new queries
    setActiveTab('global');
  };

  const handleWorkedCaseClick = (workedCase: WorkedCase) => {
    // Find or create tab for this case
    const existingTab = tabs.find(tab => tab.pnr === workedCase.pnr);
    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      const newTab: Tab = {
        id: `pnr-${workedCase.id}`,
        type: 'pnr',
        label: `Case #${workedCase.pnr}`,
        pnr: workedCase.pnr,
        status: workedCase.status,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
      setCaseIntelligence(sampleIntelligence);
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
        onChatClick={handleChatClick}
        onWorkedCaseClick={handleWorkedCaseClick}
      />
      <Workspace
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onTabClose={handleTabClose}
        onAddTab={handleActivityClick}
        onCaseResolved={handleCaseResolved}
      />
      <CaseIntelligencePanel
        intelligence={caseIntelligence}
        userInitials="HB"
        userName="H. Bennett"
      />
    </div>
  );
};

export default TravelCRM;
