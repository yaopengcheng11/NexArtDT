import { Ban, Eye, BarChart } from 'lucide-react';
import { useData } from '../context/DataContext';

export function FutureForecast() {
  const { futureForecast } = useData();

  return (
    <div className="pt-16 pb-20 px-4 space-y-4 max-w-5xl mx-auto">
      {/* Forecast Period Card */}
      <section className="relative overflow-hidden rounded-xl p-3 bg-surface-container border-l-4 border-secondary">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-bold text-xs text-primary">前瞻视界 | 周期：{futureForecast.period}</h2>
          </div>
        </div>
      </section>

      {/* Trending Themes Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-headline font-extrabold text-base tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-5 bg-secondary rounded-full"></span>
          热点题材
        </h3>
      </div>

      {/* Trending Themes Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {futureForecast.themes.map((theme, index) => (
          <div key={index} className="bg-surface-container rounded-xl overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-secondary/5 transition-all duration-300">
            <div className="p-4 space-y-3 flex-grow">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-on-surface">{theme.name}</h4>
                  <span className="text-red-500 font-bold text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded">{theme.tag}</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-on-primary-container font-bold uppercase tracking-widest mb-0.5">催化事件</p>
                <p className="text-[11px] text-primary leading-snug">{theme.event}</p>
              </div>
              <div>
                <p className="text-[9px] text-on-primary-container font-bold uppercase tracking-widest mb-0.5">板块判断</p>
                <p className="text-[11px] text-on-surface">{theme.judgment}</p>
              </div>
              <div className="pt-3 border-t border-outline-variant/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-red-500">推荐个股: {theme.stock}</span>
                  <span className="text-[8px] text-on-surface-variant">持股: {theme.holdDays}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-container-low p-1.5 rounded-md">
                    <p className="text-[8px] text-on-primary-container">买入区间</p>
                    <p className="text-[9px] font-bold text-on-surface">{theme.buyRange}</p>
                  </div>
                  <div className="bg-surface-container-low p-1.5 rounded-md">
                    <p className="text-[8px] text-on-primary-container">止盈目标</p>
                    <p className="text-[9px] font-bold text-red-500">{theme.target}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Warning & Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sectors to Avoid */}
        <div className="bg-green-500/10 rounded-xl p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4 text-green-500" />
            <h3 className="font-headline font-bold text-sm text-green-500">回避板块</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {futureForecast.avoidSectors.tags.map((sector, index) => (
              <span key={index} className="bg-green-500/20 px-2 py-1 rounded-md text-green-500 text-[11px] font-semibold border border-green-500/20">{sector}</span>
            ))}
          </div>
          <p className="mt-3 text-[9px] text-on-surface-variant leading-relaxed">
            {futureForecast.avoidSectors.reason}
          </p>
        </div>

        {/* Events to Watch */}
        <div className="bg-surface-container rounded-xl p-4 border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="font-headline font-bold text-sm text-primary">重点事件观察</h3>
          </div>
          <ul className="space-y-2">
            {futureForecast.events.map((event, index) => (
              <li key={index} className="flex items-center justify-between text-[11px]">
                <span className="text-on-surface">{event.name}</span>
                <span className="text-[9px] bg-primary-container px-1.5 py-0.5 rounded text-primary">{event.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Core Strategy Summary */}
      <section className="bg-surface-container-high/50 backdrop-blur-md border border-outline-variant/15 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <BarChart className="w-24 h-24" />
        </div>
        <h3 className="font-headline font-extrabold text-base mb-4 text-primary">核心策略概览</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container">总体仓位</p>
            <div className="flex items-end gap-1.5">
              <span className="text-xl font-black text-red-500">{futureForecast.strategy.position}</span>
              <span className="text-[9px] mb-0.5 text-on-surface-variant">{futureForecast.strategy.positionDesc}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container">进攻组合</p>
            <p className="text-on-surface text-xs font-semibold">{futureForecast.strategy.attack}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container">防守组合</p>
            <p className="text-on-surface text-xs font-semibold">{futureForecast.strategy.defense}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
          <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container mb-2">核心观点</p>
          <p className="text-on-surface leading-loose text-[11px] italic">
            “{futureForecast.strategy.view}”
          </p>
        </div>
      </section>
    </div>
  );
}
