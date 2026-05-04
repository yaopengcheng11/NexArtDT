import { Activity, Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn("relative flex items-center justify-center flex-shrink-0", sizeClasses[size], className)}>
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md animate-pulse"></div>
      
      {/* Base Shape */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg border border-white/20 transform rotate-3 hover:rotate-6 transition-transform duration-300"></div>
      
      {/* Inner Shape */}
      <div className="absolute inset-0.5 bg-surface-container-highest rounded-[10px] flex items-center justify-center overflow-hidden">
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
        
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <Hexagon className={cn("absolute text-primary/20", iconSizes[size])} strokeWidth={1.5} />
          <Activity className={cn("text-primary", iconSizes[size])} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
