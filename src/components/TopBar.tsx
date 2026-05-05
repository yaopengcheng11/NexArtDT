import { ReactNode } from 'react';
import { RefreshCw, Share2, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface TopBarProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  showUpdatePill?: boolean; // Kept for backward compatibility but ignored in UI
  stackedUpdate?: boolean; // Kept for backward compatibility but ignored in UI
  updateTime?: string;
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onShare?: () => void;
  onOpenSettings?: () => void;
}

export function TopBar({ title, subtitle, icon, updateTime, className, onRefresh, isRefreshing, onShare, onOpenSettings }: TopBarProps) {
  // Extract just the time part (e.g. "22:16:56" from "2026/3/30 22:16:56")
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : timeStr;
  };

  return (
    <header className={cn("fixed top-0 w-full z-50 px-4 py-3 border-b border-white/5 glass-effect", className)}>
      <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[90vw] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          {icon && (
            <div className="flex-shrink-0 scale-110">
              {icon}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="font-headline font-bold text-base text-white tracking-tight leading-tight truncate">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {subtitle && (
                <p className="text-[10px] text-on-surface-variant font-medium tracking-wide opacity-80 uppercase truncate">
                  {subtitle}
                </p>
              )}
              {subtitle && updateTime && (
                <span className="text-[10px] text-on-surface-variant/50 flex-shrink-0">•</span>
              )}
              {updateTime && (
                <p className="text-[10px] text-secondary font-medium tracking-wide flex-shrink-0">
                  {formatTime(updateTime)} 更新
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {onShare && (
            <button 
              onClick={onShare}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-white/70 hover:text-white hover:bg-surface-bright transition-colors border border-white/5 shadow-inner active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-white/70 hover:text-white hover:bg-surface-bright transition-colors border border-white/5 shadow-inner active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
          {onOpenSettings && (
            <button 
              onClick={onOpenSettings}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-high text-white/70 hover:text-white hover:bg-surface-bright transition-colors border border-white/5 shadow-inner active:scale-95 ml-0.5"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
