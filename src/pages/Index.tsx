import { useState } from 'react';
import { ActivityPanel } from '@/components/travel/ActivityPanel';
import { Workspace } from '@/components/travel/Workspace';
import { RightSidebar } from '@/components/travel/RightSidebar';
import { ActivityItem, Tab } from '@/types/crm';

// Sample activity data
const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'pnr',
    title: 'Cancellation Request Pending',
    subtitle: 'BA285 LHR-SFO',
    timestamp: 'JUST NOW',
    badge: 'PNR:ZXJ992',
    isNew: true,
  },
  {
    id: '2',
    type: 'email',
    title: 'Refund Inquiry: Case #2901-A',
    subtitle: 'MARCUS.V8AIR.COM',
    timestamp: '12M AGO',
    badge: 'EMAIL',
  },
  {
    id: '3',
    type: 'pnr',
    title: 'Schedule Change Acknowledged',
    subtitle: '',
    timestamp: '45M AGO',
    badge: 'PNR: GHK821',
  },
  {
    id: '4',
    type: 'queue',
    title: 'Waitlist Clearance: Qantas',
    subtitle: '',
    timestamp: '1H AGO',
    badge: 'QUEUE7',
  },
];

const TravelCRM = () => {
  const [activities] = useState<ActivityItem[]>(sampleActivities);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'global', type: 'global', label: 'GLOBAL' },
    { id: 'pnr-zxj992', type: 'pnr', label: 'PNR: ZXJ992', pnr: 'ZXJ992' },
  ]);
  const [activeTab, setActiveTab] = useState('global');

  const handleActivityClick = (item: ActivityItem) => {
    const existingTab = tabs.find(
      tab => (tab.type === 'pnr' && tab.pnr === item.badge.replace('PNR:', '').trim()) ||
             (tab.type === 'email' && item.type === 'email')
    );

    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      const newTab: Tab = {
        id: `${item.type}-${item.id}`,
        type: item.type === 'email' ? 'email' : 'pnr',
        label: item.type === 'pnr' ? item.badge : `Email: ${item.subtitle}`,
        pnr: item.type === 'pnr' ? item.badge.replace('PNR:', '').trim() : undefined,
        email: item.type === 'email' ? item.subtitle : undefined,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
    }
  };

  const handleTabClose = (tabId: string) => {
    if (tabId === 'global') return;
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab('global');
    }
  };

  const handleNewTask = () => {
    // Could open a modal or navigate to new task creation
    console.log('New task clicked');
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <ActivityPanel
        items={activities}
        onItemClick={handleActivityClick}
        onNewTask={handleNewTask}
      />
      <Workspace
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onTabClose={handleTabClose}
        onAddTab={handleActivityClick}
      />
      <RightSidebar userInitials="HB" />
    </div>
  );
};

export default TravelCRM;
