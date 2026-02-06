import { Globe, Plane, X } from 'lucide-react';
import { Tab } from '@/types/crm';
import { cn } from '@/lib/utils';

interface WorkspaceTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function WorkspaceTabs({ tabs, activeTab, onTabChange, onTabClose }: WorkspaceTabsProps) {
  return (
    <div className="flex items-center gap-1 px-4 pt-4 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all duration-200",
            "group",
            activeTab === tab.id
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          {tab.type === 'global' ? (
            <Globe className="h-4 w-4 text-primary" />
          ) : (
            <Plane className="h-4 w-4" />
          )}
          <span className="font-medium text-sm">{tab.label}</span>
          
          {tab.id !== 'global' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              aria-label={`Close ${tab.label}`}
              className="ml-1 p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
