import { Brain, TrendingUp, Shield, Activity, Calendar, Sword, Ban, Scale } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getStockColor } from '../lib/utils';

export function GlobalConflict() {
  const { globalConflict } = useData();
  const conflicts = Array.isArray(globalConflict?.conflicts) ? globalConflict.conflicts : [];

  return (
    <div className="pt-16 pb-20 px-4 sm:px-6 2xl:px-8 space-y-5 xl:space-y-6 max-w-5xl xl:max-w-7xl 2xl:max-w-[90vw] mx-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(480px,100%),1fr))] gap-4 xl:gap-5">
      {conflicts.map((conflict, index) => (
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
                  <Scale className="w-3.5 h-3.5 text-secondary" />
                  <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">客观分析</span>
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
                  {(Array.isArray(conflict?.impacts) ? conflict.impacts : []).map((impact, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[9px] text-on-surface-variant">{impact.name}</span>
                      <span className={`text-[9px] font-bold ${getStockColor(impact.change)}`}>{impact.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 双方立场对比 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sword className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">{conflict.sideA?.name || '甲方'} 立场</span>
                </div>
                <p className="text-[10px] text-on-surface italic leading-relaxed mb-1.5">"{conflict.sideA?.opinion}"</p>
                <div className="pt-1.5 border-t border-red-500/10">
                  <p className="text-[8px] font-bold text-red-500/80 uppercase tracking-tighter mb-0.5">理由</p>
                  <p className="text-[9px] text-on-surface-variant leading-snug">{conflict.sideA?.reason}</p>
                </div>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Ban className="w-3 h-3 text-blue-500" />
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider">{conflict.sideB?.name || '乙方'} 立场</span>
                </div>
                <p className="text-[10px] text-on-surface italic leading-relaxed mb-1.5">"{conflict.sideB?.opinion}"</p>
                <div className="pt-1.5 border-t border-blue-500/10">
                  <p className="text-[8px] font-bold text-blue-500/80 uppercase tracking-tighter mb-0.5">理由</p>
                  <p className="text-[9px] text-on-surface-variant leading-snug">{conflict.sideB?.reason}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <span className="text-[9px] text-on-primary-container/60 italic font-mono">Source: {conflict.source}</span>
            </div>
          </div>
        </section>
      ))}
      </div>

      {conflicts.length === 0 && (
        <div className="bg-surface-container rounded-xl p-6 text-center text-sm text-on-surface-variant">
          暂无全球冲突数据，点击顶部刷新后会重新拉取内容。
        </div>
      )}
    </div>
  );
}
