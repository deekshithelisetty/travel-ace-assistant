import { useState, useEffect } from 'react';
import { MOTEmailCompose } from '@/types/crm';
import { Mail, Send, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MOTEmailComposeCardProps {
  email: MOTEmailCompose;
  onSend: (edited?: MOTEmailCompose) => void;
  onCancel: () => void;
}

export function MOTEmailComposeCard({ email, onSend, onCancel }: MOTEmailComposeCardProps) {
  const [to, setTo] = useState(email.to);
  const [cc, setCc] = useState(email.cc ?? '');
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);

  useEffect(() => {
    setTo(email.to);
    setCc(email.cc ?? '');
    setSubject(email.subject);
    setBody(email.body);
  }, [email.to, email.cc, email.subject, email.body]);

  const handleSend = () => {
    onSend({ to, cc: cc || undefined, subject, body });
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Email confirmation</h3>
        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
          <Pencil className="h-3 w-3" /> Editable
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipient email"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Cc (optional)</label>
          <Input
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="Cc email"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body"
            rows={5}
            className={cn(
              'w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              'resize-y min-h-24 max-h-48 overflow-y-auto'
            )}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSend} className="flex-1 bg-primary">
            <Send className="h-4 w-4 mr-1" /> Send
          </Button>
        </div>
      </div>
    </div>
  );
}
