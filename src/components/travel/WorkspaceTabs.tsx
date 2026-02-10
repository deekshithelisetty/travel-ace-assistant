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
    <div className="flex items-center gap-1 px-3 pt-3 pb-0 border-b border-border bg-muted/40 backdrop-blur-sm">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2.5 px-4 py-3 rounded-t-xl transition-all duration-200",
              "group border border-transparent border-b-0 -mb-px",
              isActive
                ? "bg-card text-foreground shadow-sm border-border border-b-transparent"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {tab.type === 'global' ? (
              <Globe className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            ) : (
              <Plane className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            )}
            <span className={cn("font-medium text-sm", isActive && "text-foreground")}>{tab.label}</span>

            {tab.id !== 'global' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                aria-label={`Close ${tab.label}`}
                className="ml-0.5 p-1 rounded-md hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
