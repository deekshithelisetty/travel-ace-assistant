import { Sparkles, User } from 'lucide-react';
import { Message } from '@/types/crm';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

import travelAssistantAvatar from '@/assets/travel-assistant-avatar.png';
import {
  ItineraryCard,
  InvoiceCard,
  CCVStatusCard,
  PayomoSummaryCard,
  TravelersCard,
  TicketInfoCard,
  ActivitiesCard,
  CancelPnrResultCard,
} from './TripInfoCards';

interface ChatMessageProps {
  message: Message;
  onItineraryAddToTrip?: () => void;
}

export function ChatMessage({ message, onItineraryAddToTrip }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex gap-4 animate-fade-in",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {isAssistant && (
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-soft border border-border/50">
          <img 
            src={travelAssistantAvatar} 
            alt="Travel Assistant" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className={cn(
        "max-w-2xl px-5 py-4 glass-bubble",
        isAssistant ? "rounded-2xl" : "rounded-2xl"
      )}>
        {isAssistant && (
          <div className="text-primary font-semibold text-sm mb-2 tracking-wide">
            TRAVELAI ASSISTANT
          </div>
        )}
        {!isAssistant && message.sender && (
          <div className="text-primary font-semibold text-sm mb-2 text-right tracking-wide">
            {message.sender}
          </div>
        )}
        <div className="prose prose-sm max-w-none prose-p:text-foreground prose-strong:text-foreground prose-headings:text-foreground">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {message.gdsOutput && (
          <div className="mt-4 rounded-lg overflow-hidden border border-primary/30 bg-[#0f1729] shadow-inner">
            <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 text-xs text-white/90">
              <span className="font-semibold">GDS Output</span>
            </div>
            <pre className="p-4 text-xs text-white font-mono whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto leading-relaxed">
              {message.gdsOutput}
            </pre>
          </div>
        )}
        {message.ticketNumbers && message.ticketNumbers.length > 0 && (
          <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Ticket numbers</div>
            <ul className="font-mono text-sm space-y-1">
              {message.ticketNumbers.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {message.itineraryData && (
          <ItineraryCard
            pnr={message.itineraryData.pnr}
            bookingRef={message.itineraryData.ref}
            segments={message.itineraryData.segments}
            onAddToTrip={onItineraryAddToTrip}
          />
        )}
        {message.invoiceData && <InvoiceCard data={message.invoiceData} />}
        {message.ccvStatusData && <CCVStatusCard status={message.ccvStatusData.status} highRisk={message.ccvStatusData.highRisk} proceedFulfillment={message.ccvStatusData.proceedFulfillment} identityCheckScore={message.ccvStatusData.identityCheckScore} validations={message.ccvStatusData.validations} />}
        {message.ccvSummaryData && <PayomoSummaryCard data={message.ccvSummaryData} />}
        {message.travelersData && message.travelersData.length > 0 && <TravelersCard travelers={message.travelersData} />}
        {message.ticketInfoData && message.ticketInfoData.length > 0 && <TicketInfoCard tickets={message.ticketInfoData} />}
        {message.activitiesData && message.activitiesData.length > 0 && <ActivitiesCard events={message.activitiesData} title="Activity" />}
        {message.lifecycleData && message.lifecycleData.length > 0 && <ActivitiesCard events={message.lifecycleData} title="Life Cycle" />}
        {message.cancelPnrResult && <CancelPnrResultCard pnr={message.cancelPnrResult.pnr} cancelled={message.cancelPnrResult.cancelled} message={message.cancelPnrResult.message} />}
        <div className={cn(
          "text-xs text-muted-foreground mt-2",
          !isAssistant && "text-right"
        )}>
          {message.timestamp}
        </div>
      </div>

      {!isAssistant && (
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-semibold text-sm">
          {message.sender?.split(' ').map(n => n[0]).join('') || 'U'}
        </div>
      )}
    </div>
  );
}
