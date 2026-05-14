import { useState, useRef } from 'react';
import {
  Gavel, Eye, Edit, Plus, X, Check, Upload, FileText, Loader2,
  Ban, BarChart, TrendingUp,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { DailyReviewData } from '../context/DataContext';
import { getStockColor, getOpinionColor, getOpinionBgColor, cn } from '../lib/utils';
import { analyzeAnnouncementPDF } from '../lib/gemini';
import { announcementAnalysisSchema } from '../lib/schemas';

export function InvestmentOverview() {
  const { dailyReview, futureForecast, customStocks, setCustomStocks, updateData } = useData();

  /* ---------- 复盘部分 ---------- */
  const marketOverview: DailyReviewData['marketOverview'] = dailyReview?.marketOverview || {
    indexValue: '', indexChange: '', summary: '', volume: '', mainFlow: '',
  };
  const stocks: DailyReviewData['stocks'] = dailyReview?.stocks || [];
  const announcements: DailyReviewData['announcements'] = dailyReview?.announcements || [];

  const [isEditingStocks, setIsEditingStocks] = useState(false);
  const [newStock, setNewStock] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddStock = () => {
    if (newStock.trim() && !customStocks.includes(newStock.trim())) {
      setCustomStocks([...customStocks, newStock.trim()]);
      setNewStock('');
    }
  };
  const handleRemoveStock = (stockToRemove: string) => {
    setCustomStocks(customStocks.filter(stock => stock !== stockToRemove));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('请上传 PDF 格式的公告文件。'); return; }
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const result = await analyzeAnnouncementPDF(base64String, file.type, announcementAnalysisSchema);
          updateData('dailyReview', { ...dailyReview, announcements: [result, ...announcements] });
        } catch { alert('公告解读失败，请稍后重试。');
        } finally { setIsAnalyzing(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
      };
      reader.readAsDataURL(file);
    } catch { setIsAnalyzing(false); }
  };

  /* ---------- 预判部分 ---------- */
  const themes = Array.isArray(futureForecast?.themes) ? futureForecast.themes : [];
  const avoidSectors = futureForecast?.avoidSectors ?? { tags: [], reason: '' };
  const events = Array.isArray(futureForecast?.events) ? futureForecast.events : [];
  const strategy = futureForecast?.strategy ?? { position: '', positionDesc: '', attack: '', defense: '', view: '' };

  return (
    <div className="space-y-5 xl:space-y-6 max-w-5xl xl:max-w-7xl 2xl:max-w-[90vw] mx-auto pt-16 pb-20 px-4 sm:px-6 2xl:px-8">

      {/* ======== 区域一：大盘概况 ======== */}
      <section className="relative overflow-hidden rounded-xl p-5 bg-surface-container-lowest border-l-2 border-secondary">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="w-full lg:w-auto">
              <h2 className="text-on-primary-container text-[10px] font-label font-bold tracking-widest mb-2">MARKET OVERVIEW</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl 2xl:text-3xl font-headline font-extrabold text-on-surface">{marketOverview.indexValue || '--'}</span>
                <span className={cn("font-bold text-sm px-2 py-0.5 rounded-md bg-surface-container-high", getStockColor(marketOverview.indexChange || ''))}>{marketOverview.indexChange || '--'}</span>
              </div>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none bg-surface-container p-3 px-6 rounded-xl text-center lg:text-left">
                <span className="text-[10px] text-on-primary-container block mb-1 font-medium tracking-wide">成交额</span>
                <span className="text-base 2xl:text-lg font-headline font-bold text-on-surface">{marketOverview.volume || '--'}</span>
              </div>
              <div className="flex-1 lg:flex-none bg-surface-container p-3 px-6 rounded-xl text-center lg:text-left">
                <span className="text-[10px] text-on-primary-container block mb-1 font-medium tracking-wide">主力流向</span>
                <span className={cn("text-base 2xl:text-lg font-headline font-bold", getStockColor(marketOverview.mainFlow || ''))}>{marketOverview.mainFlow || '--'}</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-high/40 rounded-lg p-3 border border-outline-variant/10">
            <p className="text-on-surface-variant text-[12px] 2xl:text-sm leading-relaxed md:leading-loose">{marketOverview.summary || '暂无大盘摘要数据...'}</p>
          </div>
        </div>
      </section>

      {/* ======== 区域二：自选股复盘 ======== */}
      <div className="flex justify-between items-end">
        <h3 className="text-base font-headline font-bold text-primary">自选股复盘</h3>
        <button onClick={() => setIsEditingStocks(!isEditingStocks)} className="text-xs font-medium text-secondary hover:text-white transition-colors flex items-center gap-1">
          {isEditingStocks ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
          {isEditingStocks ? '完成' : '管理自选股'}
        </button>
      </div>

      {isEditingStocks && (
        <div className="bg-surface-container rounded-xl p-4 border border-secondary/20">
          <div className="flex gap-2 mb-4">
            <input type="text" value={newStock} onChange={(e) => setNewStock(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
              placeholder="输入股票代码或名称，如：AAPL 或 苹果"
              className="flex-1 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary transition-colors" />
            <button onClick={handleAddStock} className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-secondary/90 transition-colors">
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customStocks.map(stock => (
              <div key={stock} className="bg-surface-container-high border border-outline-variant/30 rounded-full px-3 py-1 text-sm flex items-center gap-2">
                <span>{stock}</span>
                <button onClick={() => handleRemoveStock(stock)} className="text-on-surface-variant hover:text-error transition-colors"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {customStocks.length === 0 && <span className="text-sm text-on-surface-variant italic">暂无自选股，请添加。</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(380px,100%),1fr))] gap-4">
        {stocks.map((stock, index) => {
          const opinion = stock?.opinion || '观望';
          const change = stock?.change || '';
          return (
            <div key={index} className="bg-surface-container rounded-xl overflow-hidden group hover:ring-1 hover:ring-primary/30 transition-all duration-300">
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">{stock?.name || '--'}</h4>
                    <span className="text-[10px] text-on-primary-container font-medium tracking-wider bg-surface-container-high px-1.5 py-0.5 rounded">{stock?.code || '--'}</span>
                  </div>
                  <div className="text-right flex items-baseline gap-1.5">
                    <span className={cn("text-base font-headline font-bold", getStockColor(change))}>{stock?.price || '--'}</span>
                    <span className={cn("text-[11px] font-bold", getStockColor(change))}>{change}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3 text-[11px]">
                  <span className="text-on-surface-variant">换手率 <span className="font-bold">{stock?.turnover || '--'}</span></span>
                  <span className="text-on-surface-variant">成交量 <span className="font-bold">{stock?.volume || '--'}</span></span>
                </div>
                <div className={cn("bg-surface-container-highest/50 rounded-lg p-3 border-l-4", getOpinionColor(opinion).replace('text-', 'border-'))}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {opinion.includes('买入') || opinion.includes('推荐') ? <Gavel className={cn("w-3.5 h-3.5", getOpinionColor(opinion))} /> : <Eye className={cn("w-3.5 h-3.5", getOpinionColor(opinion))} />}
                      <span className={cn("font-bold text-[11px] tracking-wide", getOpinionColor(opinion))}>观点</span>
                    </div>
                    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border", getOpinionBgColor(opinion))}>{opinion}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <div><span className="text-[9px] text-on-surface-variant uppercase tracking-wider">止盈位</span><span className="text-[11px] font-bold text-red-500 font-headline block">{stock?.takeProfit || '--'}</span></div>
                    <div><span className="text-[9px] text-on-surface-variant uppercase tracking-wider">止损位</span><span className="text-[11px] font-bold text-green-500 font-headline block">{stock?.stopLoss || '--'}</span></div>
                  </div>
                  <p className="text-[9px] mt-2 text-on-surface-variant/80 leading-relaxed italic border-t border-white/5 pt-2">{stock?.reason || '暂无分析理由'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======== 🟢 华丽分隔线 ======== */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
        <div className="relative flex justify-center">
          <span className="bg-surface text-on-surface-variant text-[10px] px-4 tracking-widest font-bold flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> 前瞻预判 <TrendingUp className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* ======== 区域四：题材预判 ======== */}
      <section className="relative overflow-hidden rounded-xl p-3 bg-surface-container border-l-4 border-secondary">
        <div className="flex items-center gap-2">
          <h2 className="font-headline font-bold text-xs text-primary">前瞻视界 | 周期：{(() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day} 至 ${y}-${m}-${String(d.getDate()+3).padStart(2,'0')}`; })()}</h2>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h3 className="font-headline font-extrabold text-base tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-5 bg-secondary rounded-full" />
          热点题材
        </h3>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4 xl:gap-5">
        {themes.map((theme, index) => (
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
                  <span className="text-[9px] font-bold text-red-500">
                    推荐个股: <span className="text-on-surface">{theme.stockName || theme.stock}</span>
                    {theme.stock && theme.stockName && <span className="text-on-surface-variant font-normal"> ({theme.stock})</span>}
                  </span>
                  <span className="text-[8px] text-on-surface-variant">持股: {theme.holdDays}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-surface-container-low p-1.5 rounded-md">
                    <p className="text-[8px] text-on-primary-container">买入区间</p>
                    <p className="text-[9px] font-bold text-on-surface">{theme.buyRange}</p>
                  </div>
                  <div className="bg-surface-container-low p-1.5 rounded-md">
                    <p className="text-[8px] text-on-primary-container">止盈目标</p>
                    <p className="text-[9px] font-bold text-red-500">{theme.target}</p>
                  </div>
                </div>
                {theme.reason && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 mb-2">
                    <p className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1">推荐理由</p>
                    <p className="text-[9px] text-on-surface leading-relaxed">{theme.reason}</p>
                  </div>
                )}
                {(theme.upstream || theme.downstream) && (
                  <div className="grid grid-cols-2 gap-2">
                    {theme.upstream && (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2">
                        <p className="text-[7px] font-bold text-yellow-500 uppercase tracking-wider mb-0.5">⬆ 上游产业链</p>
                        <p className="text-[8px] text-on-surface-variant leading-snug">{theme.upstream}</p>
                      </div>
                    )}
                    {theme.downstream && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2">
                        <p className="text-[7px] font-bold text-green-500 uppercase tracking-wider mb-0.5">⬇ 下游产业链</p>
                        <p className="text-[8px] text-on-surface-variant leading-snug">{theme.downstream}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 预判：风险+事件 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-4 xl:gap-5">
        <div className="bg-green-500/10 rounded-xl p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-3">
            <Ban className="w-4 h-4 text-green-500" />
            <h3 className="font-headline font-bold text-sm text-green-500">回避板块</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Array.isArray(avoidSectors.tags) ? avoidSectors.tags : []).map((sector, i) => (
              <span key={i} className="bg-green-500/20 px-2 py-1 rounded-md text-green-500 text-[11px] font-semibold border border-green-500/20">{sector}</span>
            ))}
          </div>
          <p className="mt-3 text-[9px] text-on-surface-variant leading-relaxed">{avoidSectors.reason}</p>
        </div>
        <div className="bg-surface-container rounded-xl p-4 border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="font-headline font-bold text-sm text-primary">重点事件观察</h3>
          </div>
          <ul className="space-y-2">
            {events.map((event, i) => (
              <li key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-on-surface">{event.name}</span>
                <span className="text-[9px] bg-primary-container px-1.5 py-0.5 rounded text-primary">{event.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 预判：核心策略 */}
      <section className="bg-surface-container-high/50 backdrop-blur-md border border-outline-variant/15 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10"><BarChart className="w-24 h-24" /></div>
        <h3 className="font-headline font-extrabold text-base mb-4 text-primary">核心策略概览</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-6 mb-5">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container">总体仓位</p>
            <div className="flex items-end gap-1.5">
              <span className="text-xl font-black text-red-500">{strategy.position}</span>
              <span className="text-[9px] mb-0.5 text-on-surface-variant">{strategy.positionDesc}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container">进攻组合</p>
            <p className="text-on-surface text-xs font-semibold">{strategy.attack}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container">防守组合</p>
            <p className="text-on-surface text-xs font-semibold">{strategy.defense}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
          <p className="text-[9px] uppercase font-bold tracking-widest text-on-primary-container mb-2">核心观点</p>
          <p className="text-on-surface leading-loose text-[11px] italic">“{strategy.view}”</p>
        </div>
      </section>

      {/* ======== 区域五：公告智能解读（放在最底） ======== */}
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-base font-headline font-bold text-primary flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          公告智能解读
        </h3>
        <div>
          <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}
            className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isAnalyzing ? '正在解读...' : '上传公告 PDF'}
          </button>
        </div>
      </div>

      {announcements.length === 0 && !isAnalyzing && (
        <div className="bg-surface-container-low rounded-xl p-6 text-center border border-dashed border-outline-variant/30">
          <FileText className="w-8 h-8 text-on-surface-variant/50 mx-auto mb-2" />
          <p className="text-on-surface-variant text-[11px]">上传上市公司公告 PDF，AI 将为您自动提取核心内容并判断利空利好。</p>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((ann, index) => {
          const conclusion = ann?.conclusion || '中性';
          return (
            <div key={index} className="bg-surface-container rounded-xl p-4 border border-white/5 relative overflow-hidden">
              <div className={cn("absolute top-0 left-0 w-1 h-full", conclusion.includes('利好') ? "bg-green-500" : conclusion.includes('利空') ? "bg-red-500" : "bg-yellow-500")} />
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">核心归纳</h4>
                <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border", getOpinionBgColor(conclusion))}>{conclusion}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">{ann?.summary || '--'}</p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-surface-container-high rounded-lg p-3">
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">AI 观点</span>
                  <p className="text-[11px] font-medium text-white">{ann?.opinion || '--'}</p>
                </div>
                <div className="bg-surface-container-high rounded-lg p-3">
                  <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block mb-1">核心理由</span>
                  <p className="text-[11px] font-medium text-white">{ann?.reason || '--'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
