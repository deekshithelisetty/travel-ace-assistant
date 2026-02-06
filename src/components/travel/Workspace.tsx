import { useState, useEffect } from 'react';
import { WorkspaceTabs } from './WorkspaceTabs';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SearchResultsTable } from './SearchResultsTable';
import { PNRDetailCard } from './PNRDetailCard';
import { Tab, Message, SearchResult, GDSState, ActivityItem, PNRData, CommandSuggestion } from '@/types/crm';

interface WorkspaceProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onAddTab: (item: ActivityItem) => void;
  onCaseResolved?: (tabId: string) => void;
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

export function Workspace({ tabs, activeTab, onTabChange, onTabClose, onCaseResolved }: WorkspaceProps) {
  const [messagesPerTab, setMessagesPerTab] = useState<Record<string, Message[]>>({
    global: [
      {
        id: '1',
        role: 'assistant',
        content: "Ready to assist. Select a GDS to connect, or use `/` commands to search across all systems. What are you looking for today?",
        timestamp: '',
        suggestions: [
          { command: '/searchpnr', description: 'Search for a PNR' },
          { command: '/rebook', description: 'Initiate rebooking' },
        ],
      },
    ],
  });
  const [showResults, setShowResults] = useState(false);
  const [showPNRCard, setShowPNRCard] = useState<PNRData | null>(null);
  const [gdsState, setGDSState] = useState<GDSState>({
    selected: null,
    pcc: null,
    isConnected: false,
  });

  const currentMessages = messagesPerTab[activeTab] || [];
  const currentTab = tabs.find(t => t.id === activeTab);

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

  const handleGDSChange = (gds: string | null, pcc: string | null) => {
    setGDSState({
      selected: gds as any,
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
    }
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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: currentGdsState.isConnected
          ? `Processing in **${currentGdsState.selected}** (PCC: ${currentGdsState.pcc})...\n\nAnalyzing "${content}" and executing GDS commands...`
          : `Processing your request...\n\nI'm analyzing "${content}" and will provide results shortly.`,
        timestamp: '',
      };
      setMessagesPerTab(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), aiResponse],
      }));
    }, 1000);
  };

  const handleSlashCommand = (command: string, currentGdsState: GDSState) => {
    const cmd = command.split(' ')[0].toLowerCase();
    
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {currentMessages.map((message) => (
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
                {message.suggestions.map((suggestion) => (
                  <button
                    key={suggestion.command}
                    onClick={() => handleSend(suggestion.command, gdsState)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 hover:bg-secondary transition-all text-sm"
                  >
                    <span className="text-primary font-mono">{suggestion.command}</span>
                    <span className="text-muted-foreground text-xs">{suggestion.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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

      <ChatInput 
        onSend={handleSend} 
        gdsState={gdsState}
        onGDSChange={handleGDSChange}
      />
    </div>
  );
}
