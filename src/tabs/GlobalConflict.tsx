import { Brain, TrendingUp, Shield, Activity, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getStockColor } from '../lib/utils';

export function GlobalConflict() {
  const { globalConflict } = useData();

  return (
    <div className="pt-16 pb-20 px-4 space-y-4 max-w-2xl mx-auto">
      {globalConflict.conflicts.map((conflict, index) => (
        <section key={index} className="bg-surface-container rounded-xl overflow-hidden shadow-2xl relative">
          {index === 0 && <div className="h-1 bg-gradient-to-r from-secondary to-transparent w-full"></div>}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 bg-surface-container-high rounded flex items-center justify-center overflow-hidden">
                  <Shield className="w-4 h-4 text-on-primary-container" />
                </div>
                <div>
                  <h2 className="text-on-surface font-headline font-bold text-sm leading-tight">{conflict.region}</h2>
                  <p className="text-on-primary-container text-[9px] font-medium">{conflict.duration}</p>
                </div>
              </div>
            </div>

            <div className={`bg-surface-container-low rounded-lg p-3 text-[11px] leading-relaxed text-on-surface/90 border-l-2 ${index === 0 ? 'border-secondary/30' : index === 1 ? 'border-primary/30' : 'border-outline/30'}`}>
              {conflict.desc}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container-high p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {index === 0 ? <Brain className="w-3.5 h-3.5 text-secondary" /> : <Shield className="w-3.5 h-3.5 text-secondary" />}
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">分析</span>
                </div>
                <p className="text-[9px] text-on-surface-variant leading-snug">
                  {conflict.analysis}
                </p>
              </div>
              <div className="bg-surface-container-high p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {index === 0 ? <TrendingUp className="w-3.5 h-3.5 text-tertiary" /> : <Activity className="w-3.5 h-3.5 text-tertiary" />}
                  <span className="text-[9px] font-bold text-tertiary uppercase tracking-wider">影响</span>
                </div>
                <div className="space-y-0.5">
                  {conflict.impacts.map((impact, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[9px] text-on-surface-variant">{impact.name}</span>
                      <span className={`text-[9px] font-bold ${getStockColor(impact.change)}`}>{impact.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${index === 0 ? 'bg-secondary/5 border-secondary/20' : index === 1 ? 'bg-primary/5 border-primary/20' : 'bg-surface-variant/20 border-outline-variant/30'} border rounded-lg p-2.5`}>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 border rounded ${index === 0 ? 'text-secondary border-secondary/40' : index === 1 ? 'text-primary border-primary/40' : 'text-on-surface border-outline-variant/40'}`}>观点</span>
                  <p className="text-[10px] text-on-surface italic leading-relaxed">“{conflict.opinion}”</p>
                </div>
                <div className={`pt-1.5 border-t ${index === 0 ? 'border-secondary/10' : index === 1 ? 'border-primary/10' : 'border-outline-variant/20'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-tighter mb-0.5 ${index === 0 ? 'text-secondary/80' : index === 1 ? 'text-primary/80' : 'text-on-surface/60'}`}>理由</p>
                  <p className="text-[10px] text-on-surface-variant italic">{conflict.reason}</p>
                </div>
                {index === 0 && (
                  <div className={`flex items-center gap-1.5 mt-1.5 pt-1.5 border-t ${index === 0 ? 'border-secondary/10' : 'border-primary/10'}`}>
                    <Calendar className="w-3 h-3 text-secondary" />
                    <p className="text-[9px] text-on-surface-variant font-medium">重点观察本周四的联合国安理会闭门会议。</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <span className="text-[9px] text-on-primary-container/60 italic font-mono">Source: {conflict.source}</span>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
