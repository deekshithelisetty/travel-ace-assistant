import { useState } from 'react';
import { WorkspaceTabs } from './WorkspaceTabs';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SearchResultsTable } from './SearchResultsTable';
import { Tab, Message, SearchResult, GDSType, ActivityItem } from '@/types/crm';

interface WorkspaceProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: (item: ActivityItem) => void;
}

// Sample data
const sampleMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Ready to assist. I can search across all GDS systems (Sabre, Amadeus, Worldspan) and internal databases. What are you looking for today?",
    timestamp: '',
  },
  {
    id: '2',
    role: 'user',
    content: "Find all pending cancellations.",
    timestamp: '15:42:10',
    sender: 'H. BENNETT',
  },
  {
    id: '3',
    role: 'assistant',
    content: "Scanning Sabre, Amadeus, and Worldspan for 'Pending Cancellation' status...\n\nI found **3 active cases** that require immediate attention.",
    timestamp: '',
  },
];

const sampleResults: SearchResult[] = [
  { gds: 'SBR', pnr: 'ZXJ992', passenger: 'SMITH/ALEXANDER', ttl: '14:00', status: 'urgent' },
  { gds: 'AMD', pnr: 'KJH771', passenger: 'CHEN/WEI', ttl: '16:30', status: 'warning' },
  { gds: 'WSP', pnr: 'RTY445', passenger: 'JOHNSON/MARY', ttl: '18:45', status: 'normal' },
];

export function Workspace({ tabs, activeTab, onTabChange, onTabClose }: WorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [showResults, setShowResults] = useState(true);

  const handleSend = (content: string, selectedGds: GDSType[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      sender: 'H. BENNETT',
    };
    setMessages(prev => [...prev, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Processing your request across ${selectedGds.join(', ')}...\n\nI'm analyzing "${content}" and will provide results shortly.`,
        timestamp: '',
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleProcess = (pnr: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Opening PNR **${pnr}** for processing. Loading passenger details, itinerary, and ticket status...`,
      timestamp: '',
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <WorkspaceTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTabClose={onTabClose}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
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

      <ChatInput onSend={handleSend} />
    </div>
  );
}
