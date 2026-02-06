import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, ChevronRight } from 'lucide-react';
import { GDSType, GDSState } from '@/types/crm';
import { cn } from '@/lib/utils';
import { ShortcutsPopover } from './ShortcutsPopover';
import { GDSConnectModal } from './GDSConnectModal';

interface ChatInputProps {
  onSend: (message: string, gdsState: GDSState) => void;
  gdsState: GDSState;
  onGDSChange: (gds: GDSType | null, pcc: string | null) => void;
}

const gdsOptions: { id: GDSType; label: string }[] = [
  { id: 'SBR', label: 'SABRE' },
  { id: 'AMD', label: 'AMD' },
  { id: 'WSP', label: 'WSP' },
];

export function ChatInput({ onSend, gdsState, onGDSChange }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showShortcuts, setShowShortcuts] = useState<'/' | '@' | '#' | null>(null);
  const [showGDSModal, setShowGDSModal] = useState<GDSType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGDSClick = (gds: GDSType) => {
    // If already selected, deselect
    if (gdsState.selected === gds) {
      onGDSChange(null, null);
      return;
    }
    // Otherwise show PCC modal
    setShowGDSModal(gds);
  };

  const handleGDSConnect = (pcc: string) => {
    if (showGDSModal) {
      onGDSChange(showGDSModal, pcc);
      setShowGDSModal(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check for shortcuts
    const lastChar = value.slice(-1);
    const words = value.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord === '/') {
      setShowShortcuts('/');
    } else if (lastWord === '@') {
      setShowShortcuts('@');
    } else if (lastWord === '#') {
      setShowShortcuts('#');
    } else if (lastWord.startsWith('/') || lastWord.startsWith('@') || lastWord.startsWith('#')) {
      // Keep showing if typing continues
    } else {
      setShowShortcuts(null);
    }
  };

  const handleShortcutSelect = (command: string) => {
    const words = message.split(' ');
    words[words.length - 1] = command + ' ';
    setMessage(words.join(' '));
    setShowShortcuts(null);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message, gdsState);
      setMessage('');
      setShowShortcuts(null);
    }
  };

  // Close shortcuts on click outside
  useEffect(() => {
    const handleClickOutside = () => setShowShortcuts(null);
    if (showShortcuts) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showShortcuts]);

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 border-t border-border relative">
        {/* Shortcuts Popover */}
        {showShortcuts && (
          <ShortcutsPopover
            type={showShortcuts}
            onSelect={handleShortcutSelect}
            visible={true}
          />
        )}

        <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-2xl px-4 py-3">
          {/* GDS Toggles */}
          <div className="flex items-center gap-1">
            {gdsOptions.map((gds) => {
              const isSelected = gdsState.selected === gds.id;
              return (
                <button
                  key={gds.id}
                  type="button"
                  onClick={() => handleGDSClick(gds.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                    isSelected
                      ? gds.id === 'SBR' 
                        ? "bg-gds-sabre/20 text-gds-sabre border border-gds-sabre/30"
                        : gds.id === 'AMD'
                        ? "bg-gds-amadeus/20 text-gds-amadeus border border-gds-amadeus/30"
                        : "bg-gds-worldspan/20 text-gds-worldspan border border-gds-worldspan/30"
                      : "bg-muted/30 text-muted-foreground/50 border border-transparent opacity-50"
                  )}
                >
                  {gds.label}
                </button>
              );
            })}
          </div>

          {gdsState.selected && gdsState.pcc && (
            <span className="text-xs text-primary font-mono">
              PCC: {gdsState.pcc}
            </span>
          )}

          <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder={gdsState.selected ? `Query ${gdsState.selected}...` : "Type / for commands, @ to assign, # for teams..."}
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

      {/* GDS Connect Modal */}
      {showGDSModal && (
        <GDSConnectModal
          gds={showGDSModal}
          onConnect={handleGDSConnect}
          onCancel={() => setShowGDSModal(null)}
        />
      )}
    </>
  );
}
