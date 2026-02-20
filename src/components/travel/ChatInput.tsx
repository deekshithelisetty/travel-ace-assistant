import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, ChevronRight } from 'lucide-react';
import { GDSType, GDSState } from '@/types/crm';
import { cn } from '@/lib/utils';
import { ShortcutsPopover, slashCommands, atMentions, hashTags } from './ShortcutsPopover';
import type { CommandSuggestion } from '@/types/crm';

interface ChatInputProps {
  onSend: (message: string, gdsState: GDSState) => void;
  gdsState: GDSState;
  onGDSChange: (gds: GDSType | null, pcc: string | null) => void;
  /** When true, use dark theme to match workspace/left panel */
  dark?: boolean;
}

const gdsOptions: { id: GDSType; label: string }[] = [
  { id: 'SBR', label: 'SABRE' },
  { id: 'AMD', label: 'AMD' },
  { id: 'WSP', label: 'WSP' },
];

export function ChatInput({ onSend, gdsState, onGDSChange, dark }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showShortcuts, setShowShortcuts] = useState<'/' | '@' | '#' | null>(null);
  const [shortcutSelectedIndex, setShortcutSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allLists: Record<string, CommandSuggestion[]> = { '/': slashCommands, '@': atMentions, '#': hashTags };
  const words = message.split(/\s+/);
  const prefix = (words[words.length - 1] || '').trim();
  const currentList = showShortcuts ? allLists[showShortcuts] ?? [] : [];
  const filteredItems =
    showShortcuts && prefix.length > 0
      ? currentList.filter((c) => c.command.toLowerCase().startsWith(prefix.toLowerCase()))
      : currentList;
  const displayItems = filteredItems.length > 0 ? filteredItems : currentList;
  const safeSelectedIndex = Math.min(shortcutSelectedIndex, Math.max(0, displayItems.length - 1));

  const handleGDSClick = (gds: GDSType) => {
    // If already selected, deselect
    if (gdsState.selected === gds) {
      onGDSChange(null, null);
      return;
    }
    // Otherwise select GDS and let AI ask for PCC in-chat
    onGDSChange(gds, null);
    // Bring focus back to chat so user can type PCC immediately
    setTimeout(() => inputRef.current?.focus(), 0);
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
      setShortcutSelectedIndex(0);
    } else if (lastWord === '@') {
      setShowShortcuts('@');
      setShortcutSelectedIndex(0);
    } else if (lastWord === '#') {
      setShowShortcuts('#');
      setShortcutSelectedIndex(0);
    } else if (lastWord.startsWith('/') || lastWord.startsWith('@') || lastWord.startsWith('#')) {
      setShortcutSelectedIndex(0);
    } else {
      setShowShortcuts(null);
    }
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showShortcuts || displayItems.length === 0) return;
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const command = displayItems[safeSelectedIndex]?.command;
      if (command) {
        const words = message.split(/\s+/);
        words[words.length - 1] = command + ' ';
        setMessage(words.join(' '));
        setShowShortcuts(null);
        setShortcutSelectedIndex(0);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShortcutSelectedIndex((i) => Math.min(i + 1, displayItems.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShortcutSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Escape') {
      setShowShortcuts(null);
    }
  };

  const handleShortcutSelect = (command: string) => {
    const words = message.split(/\s+/);
    words[words.length - 1] = command + ' ';
    setMessage(words.join(' '));
    setShowShortcuts(null);
    setShortcutSelectedIndex(0);
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
      <form
        id="chat-input-form"
        onSubmit={handleSubmit}
        className={cn(
          "p-4 relative backdrop-blur-sm",
          dark ? "border-t border-white/10 bg-slate-900/60" : "border-t border-border/80 bg-background/40"
        )}
      >
        {/* Shortcuts Popover */}
        {showShortcuts && (
          <ShortcutsPopover
            type={showShortcuts}
            items={displayItems}
            selectedIndex={safeSelectedIndex}
            onSelect={handleShortcutSelect}
            visible={true}
          />
        )}

        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3",
            dark ? "bg-slate-800/95 border border-white/10 rounded-xl shadow-lg" : "glass-input"
          )}
        >
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
                      : dark
                        ? "bg-white/10 text-slate-400 border border-white/10"
                        : "bg-muted/30 text-muted-foreground/50 border border-transparent opacity-50"
                  )}
                >
                  {gds.label}
                </button>
              );
            })}
          </div>

          {gdsState.selected && gdsState.pcc && (
            <span className={cn("text-xs font-mono", dark ? "text-violet-300" : "text-primary")}>
              PCC: {gdsState.pcc}
            </span>
          )}

          <ChevronRight className={cn("h-4 w-4 mx-1", dark ? "text-slate-400" : "text-muted-foreground")} />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleShortcutKeyDown}
            placeholder={
              gdsState.selected
                ? gdsState.pcc
                  ? `Query ${gdsState.selected}...`
                  : `Enter PCC to connect to ${gdsState.selected}...`
                : "Use AI to analyze PNR, draft a response, or check availability."
            }
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              dark ? "text-white placeholder:text-slate-500" : "text-foreground placeholder:text-muted-foreground"
            )}
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn("p-2 rounded-lg transition-colors", dark ? "hover:bg-white/10 text-slate-400" : "hover:bg-muted text-muted-foreground")}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn("p-2 rounded-lg transition-colors", dark ? "hover:bg-white/10 text-slate-400" : "hover:bg-muted text-muted-foreground")}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                message.trim()
                  ? dark ? "bg-violet-500 text-white shadow-soft hover:bg-violet-600" : "bg-primary text-primary-foreground shadow-soft"
                  : dark
                    ? "bg-slate-600 text-slate-400"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
