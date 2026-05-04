import { BarChart2, TrendingUp, Newspaper, ShieldAlert, Radar } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'review', label: '复盘', icon: BarChart2 },
    { id: 'hot', label: '热搜', icon: TrendingUp },
    { id: 'finance', label: '财经', icon: Newspaper },
    { id: 'conflict', label: '战事', icon: ShieldAlert },
    { id: 'forecast', label: '预判', icon: Radar },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe glass-effect border-t border-outline-variant/15 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] rounded-t-2xl">
      <div className="flex justify-around items-center h-16 px-4 max-w-5xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-200 active:scale-90",
                isActive 
                  ? "text-secondary bg-surface-container rounded-lg px-3 py-1 scale-105" 
                  : "text-on-surface/50 hover:text-primary px-2 py-1"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5px]")} />
              <span className="font-body text-[9px] font-semibold tracking-wide">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
