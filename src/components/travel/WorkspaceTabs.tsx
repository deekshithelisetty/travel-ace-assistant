import { Globe, Plane, X } from 'lucide-react';
import { Tab } from '@/types/crm';
import { cn } from '@/lib/utils';

interface WorkspaceTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  isDark?: boolean;
}

export function WorkspaceTabs({ tabs, activeTab, onTabChange, onTabClose, isDark }: WorkspaceTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-3 pt-3 pb-0 border-b backdrop-blur-sm",
        isDark ? "border-white/10 bg-slate-900/80" : "border-border bg-muted/40"
      )}
    >
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
                ? isDark
                  ? "bg-slate-800/95 text-white shadow-sm border-white/10 border-b-transparent"
                  : "bg-card text-foreground shadow-sm border-border border-b-transparent"
                : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {tab.type === 'global' ? (
              <Globe className={cn("h-4 w-4 shrink-0", isActive ? (isDark ? "text-violet-400" : "text-primary") : (isDark ? "text-slate-400 group-hover:text-white" : "text-muted-foreground group-hover:text-foreground"))} />
            ) : (
              <Plane className={cn("h-4 w-4 shrink-0", isActive ? (isDark ? "text-violet-400" : "text-primary") : (isDark ? "text-slate-400 group-hover:text-white" : "text-muted-foreground group-hover:text-foreground"))} />
            )}
            <span className={cn("font-medium text-sm", isActive && (isDark ? "text-white" : "text-foreground"))}>{tab.label}</span>

            {tab.id !== 'global' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                aria-label={`Close ${tab.label}`}
                className={cn("ml-0.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100", isDark ? "hover:bg-white/10 hover:text-white text-slate-400" : "hover:bg-muted hover:text-foreground")}
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {isActive && (
              <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full", isDark ? "bg-violet-400" : "bg-primary")} />
            )}
          </button>
        );
      })}
    </div>
  );
}
