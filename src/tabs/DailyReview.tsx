import { useState, useRef } from 'react';
import { Gavel, Eye, Edit, Plus, X, Check, Upload, FileText, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { DailyReviewData } from '../context/DataContext';
import { getStockColor, getOpinionColor, getOpinionBgColor, cn } from '../lib/utils';
import { analyzeAnnouncementPDF } from '../lib/gemini';
import { announcementAnalysisSchema } from '../lib/schemas';

export function DailyReview() {
  const { dailyReview, customStocks, setCustomStocks, updateData } = useData();

  // 💥 核心修复：添加默认空对象和数组，防止缓存数据异常导致读取 undefined
  const marketOverview: DailyReviewData['marketOverview'] = dailyReview?.marketOverview || {
    indexValue: '',
    indexChange: '',
    summary: '',
    volume: '',
    mainFlow: '',
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

    if (file.type !== 'application/pdf') {
      alert('请上传 PDF 格式的公告文件。');
      return;
    }

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];

        try {
          const result = await analyzeAnnouncementPDF(base64String, file.type, announcementAnalysisSchema);
          const newAnnouncements = [result, ...announcements];
          updateData('dailyReview', { ...dailyReview, announcements: newAnnouncements });
        } catch (error) {
          console.error("Analysis failed:", error);
          alert('公告解读失败，请稍后重试。');
        } finally {
          setIsAnalyzing(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading failed:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pt-16 pb-20 px-4">
      {/* Market Summary Hero */}
      <section className="relative overflow-hidden rounded-xl p-4 bg-surface-container-lowest border-l-2 border-secondary">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-on-primary-container text-[10px] font-label font-bold tracking-widest mb-1">MARKET OVERVIEW</h2>
            <div className="flex items-baseline gap-2">
              {/* 💥 安全读取：添加 || '--' */}
              <span className="text-xl font-headline font-extrabold text-on-surface">{marketOverview.indexValue || '--'}</span>
              <span className={cn("font-bold text-sm", getStockColor(marketOverview.indexChange || ''))}>{marketOverview.indexChange || '--'}</span>
            </div>
            <p className="text-on-surface-variant text-[11px] mt-1.5 leading-relaxed">{marketOverview.summary || '暂无大盘摘要数据...'}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-surface-container p-3 rounded-xl">
              <span className="text-[9px] text-on-primary-container block mb-0.5">成交额</span>
              <span className="text-base font-headline font-bold">{marketOverview.volume || '--'}</span>
            </div>
            <div className="bg-surface-container p-3 rounded-xl">
              <span className="text-[9px] text-on-primary-container block mb-0.5">主力流向</span>
              <span className={cn("text-base font-headline font-bold", getStockColor(marketOverview.mainFlow || ''))}>{marketOverview.mainFlow || '--'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Title */}
      <div className="flex justify-between items-end">
        <h3 className="text-base font-headline font-bold text-primary">自选股复盘</h3>
        <button
          onClick={() => setIsEditingStocks(!isEditingStocks)}
          className="text-xs font-medium text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          {isEditingStocks ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
          {isEditingStocks ? '完成' : '管理自选股'}
        </button>
      </div>

      {/* Stock Management UI */}
      {isEditingStocks && (
        <div className="bg-surface-container rounded-xl p-4 border border-secondary/20">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStock()}
              placeholder="输入股票代码或名称，如：AAPL 或 苹果"
              className="flex-1 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
            />
            <button
              onClick={handleAddStock}
              className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-secondary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customStocks.map(stock => (
              <div key={stock} className="bg-surface-container-high border border-outline-variant/30 rounded-full px-3 py-1 text-sm flex items-center gap-2">
                <span>{stock}</span>
                <button onClick={() => handleRemoveStock(stock)} className="text-on-surface-variant hover:text-error transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {customStocks.length === 0 && (
              <span className="text-sm text-on-surface-variant italic">暂无自选股，请添加。</span>
            )}
          </div>
        </div>
      )}

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 gap-3 mb-8">
        {stocks.map((stock, index) => {
          // 💥 安全处理个股属性，防止 .includes() 报错
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
                  <div className="flex items-center gap-3">
                    <div className="text-right flex items-baseline gap-1.5">
                      <span className={cn("text-base font-headline font-bold", getStockColor(change))}>{stock?.price || '--'}</span>
                      <span className={cn("text-[11px] font-bold", getStockColor(change))}>{change}</span>
                    </div>
                  </div>
                </div>

                {/* Market Data Row */}
                <div className="flex items-center gap-4 mb-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-on-surface-variant">换手率</span>
                    <span className="font-bold">{stock?.turnover || '--'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-on-surface-variant">成交量</span>
                    <span className="font-bold">{stock?.volume || '--'}</span>
                  </div>
                </div>

                {/* Analysis Section */}
                <div className={cn("bg-surface-container-highest/50 rounded-lg p-3 border-l-4", getOpinionColor(opinion).replace('text-', 'border-'))}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {opinion.includes('买入') || opinion.includes('推荐') ? <Gavel className={cn("w-3.5 h-3.5", getOpinionColor(opinion))} /> : <Eye className={cn("w-3.5 h-3.5", getOpinionColor(opinion))} />}
                      <span className={cn("font-bold text-[11px] tracking-wide", getOpinionColor(opinion))}>观点</span>
                    </div>
                    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded-full border", getOpinionBgColor(opinion))}>{opinion}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">止盈位</span>
                      <span className="text-[11px] font-bold text-red-500 font-headline">{stock?.takeProfit || '--'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">止损位</span>
                      <span className="text-[11px] font-bold text-green-500 font-headline">{stock?.stopLoss || '--'}</span>
                    </div>
                  </div>
                  <p className="text-[9px] mt-2 text-on-surface-variant/80 leading-relaxed italic border-t border-white/5 pt-2">
                    {stock?.reason || '暂无分析理由'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Announcement Analysis Section */}
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-base font-headline font-bold text-primary flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          公告智能解读
        </h3>
        <div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
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
              <div className={cn(
                "absolute top-0 left-0 w-1 h-full",
                conclusion.includes('利好') || conclusion.toUpperCase() === 'BULLISH' ? "bg-green-500" :
                  conclusion.includes('利空') || conclusion.toUpperCase() === 'BEARISH' ? "bg-red-500" :
                    "bg-yellow-500"
              )}></div>

              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  核心归纳
                </h4>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-full border",
                    getOpinionBgColor(conclusion)
                  )}>
                    {conclusion}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                {ann?.summary || '--'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
