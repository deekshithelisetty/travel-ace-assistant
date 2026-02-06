import { Image, BarChart3, Layers, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  userInitials: string;
}

const sidebarItems = [
  { icon: Image, label: 'Attachments' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Layers, label: 'Logs' },
  { icon: Settings, label: 'Settings' },
];

export function RightSidebar({ userInitials }: RightSidebarProps) {
  return (
    <aside className="w-16 h-full flex flex-col items-center py-4 bg-card border-l border-border">
      <div className="flex-1 flex flex-col items-center gap-4 pt-2">
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </div>
      
      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {userInitials}
        </div>
      </div>
    </aside>
  );
}
