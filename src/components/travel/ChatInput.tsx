import { useState } from 'react';
import { Send, Paperclip, Mic, ChevronRight } from 'lucide-react';
import { GDSType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, selectedGds: GDSType[]) => void;
}

const gdsOptions: { id: GDSType; label: string }[] = [
  { id: 'SBR', label: 'SBR' },
  { id: 'AMD', label: 'AMD' },
  { id: 'WSP', label: 'WSP' },
];

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedGds, setSelectedGds] = useState<GDSType[]>(['SBR', 'AMD', 'WSP']);

  const toggleGds = (gds: GDSType) => {
    setSelectedGds(prev => 
      prev.includes(gds) 
        ? prev.filter(g => g !== gds)
        : [...prev, gds]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message, selectedGds);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border">
      <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-2xl px-4 py-3">
        {/* GDS Toggles */}
        <div className="flex items-center gap-1">
          {gdsOptions.map((gds) => (
            <button
              key={gds.id}
              type="button"
              onClick={() => toggleGds(gds.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                selectedGds.includes(gds.id)
                  ? gds.id === 'SBR' 
                    ? "bg-gds-sabre/20 text-gds-sabre border border-gds-sabre/30"
                    : gds.id === 'AMD'
                    ? "bg-gds-amadeus/20 text-gds-amadeus border border-gds-amadeus/30"
                    : "bg-gds-worldspan/20 text-gds-worldspan border border-gds-worldspan/30"
                  : "bg-muted/50 text-muted-foreground border border-transparent"
              )}
            >
              {gds.label}
            </button>
          ))}
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />

        {/* Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Find all pending cancellations..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Mic className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="submit"
            disabled={!message.trim()}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
              message.trim()
                ? "bg-primary text-primary-foreground glow-cyan-subtle"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
