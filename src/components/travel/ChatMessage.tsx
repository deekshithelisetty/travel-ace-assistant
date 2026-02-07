import { Sparkles, User } from 'lucide-react';
import { Message } from '@/types/crm';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex gap-4 animate-fade-in",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
      )}
      
      <div className={cn(
        "max-w-2xl rounded-2xl px-5 py-4",
        isAssistant 
          ? "bg-secondary border border-border" 
          : "bg-surface-overlay border border-primary/20"
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
        <div className="prose prose-invert prose-sm max-w-none">
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
