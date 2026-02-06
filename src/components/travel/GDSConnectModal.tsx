import { useState } from 'react';
import { X, Terminal } from 'lucide-react';
import { GDSType } from '@/types/crm';
import { cn } from '@/lib/utils';

interface GDSConnectModalProps {
  gds: GDSType;
  onConnect: (pcc: string) => void;
  onCancel: () => void;
}

const gdsNames: Record<GDSType, string> = {
  SBR: 'Sabre',
  AMD: 'Amadeus',
  WSP: 'Worldspan',
};

const gdsColors: Record<GDSType, string> = {
  SBR: 'text-gds-sabre border-gds-sabre/30 bg-gds-sabre/10',
  AMD: 'text-gds-amadeus border-gds-amadeus/30 bg-gds-amadeus/10',
  WSP: 'text-gds-worldspan border-gds-worldspan/30 bg-gds-worldspan/10',
};

export function GDSConnectModal({ gds, onConnect, onCancel }: GDSConnectModalProps) {
  const [pcc, setPcc] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pcc.trim()) {
      setError('Please enter a valid PCC');
      return;
    }
    if (pcc.length < 3 || pcc.length > 6) {
      setError('PCC should be 3-6 characters');
      return;
    }
    onConnect(pcc.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", gdsColors[gds])}>
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Connect to {gdsNames[gds]}</h2>
              <p className="text-xs text-muted-foreground">Enter your PCC to establish connection</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-muted-foreground mb-2">
              Pseudo City Code (PCC)
            </label>
            <input
              type="text"
              value={pcc}
              onChange={(e) => {
                setPcc(e.target.value);
                setError('');
              }}
              placeholder="Enter PCC (e.g., 1S2K)"
              className={cn(
                "w-full px-4 py-3 rounded-xl bg-secondary border border-border",
                "text-foreground placeholder:text-muted-foreground font-mono",
                "focus:outline-none focus:border-primary transition-colors",
                error && "border-destructive"
              )}
              autoFocus
              maxLength={6}
            />
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "flex-1 py-3 rounded-xl font-semibold transition-all",
                "bg-primary text-primary-foreground hover:glow-cyan"
              )}
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
