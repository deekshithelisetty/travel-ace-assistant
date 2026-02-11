import { MOTEmailCompose } from '@/types/crm';
import { Mail, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MOTEmailComposeCardProps {
  email: MOTEmailCompose;
  onSend: () => void;
  onCancel: () => void;
}

export function MOTEmailComposeCard({ email, onSend, onCancel }: MOTEmailComposeCardProps) {
  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-2">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Email confirmation</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="text-xs">
          <span className="text-muted-foreground">To: </span>
          <span className="font-medium">{email.to}</span>
        </div>
        {email.cc && (
          <div className="text-xs">
            <span className="text-muted-foreground">Cc: </span>
            <span className="font-medium">{email.cc}</span>
          </div>
        )}
        <div className="text-xs">
          <span className="text-muted-foreground">Subject: </span>
          <span className="font-medium">{email.subject}</span>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
          {email.body}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="flex-1">
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={onSend} className="flex-1 bg-primary">
            <Send className="h-4 w-4 mr-1" /> Send
          </Button>
        </div>
      </div>
    </div>
  );
}
