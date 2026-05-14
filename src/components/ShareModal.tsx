import { useState, useRef, useEffect } from 'react';
import { X, Download, Share2, CheckSquare, Square, ArrowLeft, FileText, Image, MessageSquare, Type, Check } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../context/DataContext';
import { Logo } from './Logo';
import { cn } from '../lib/utils';

type ShareStep = 'select' | 'format';

export function ShareModal({ isOpen, onClose, activeTab }: { isOpen: boolean, onClose: () => void, activeTab: string }) {
  const [step, setStep] = useState<ShareStep>('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { hotSearch, dailyReview, globalConflict, futureForecast } = useData();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      let initialItems: any[] = [];
      switch (activeTab) {
        case 'hot':
          initialItems = hotSearch?.sites?.flatMap(site => site.items.map(item => ({ ...item, siteName: site.siteName, selected: true }))) || [];
          break;
        case 'review':
        case 'investment': {
          const market = dailyReview?.marketOverview;
          const marketItem = market ? [{
            type: 'market',
            indexValue: market.indexValue,
            indexChange: market.indexChange,
            summary: market.summary,
            volume: market.volume,
            mainFlow: market.mainFlow,
            selected: true,
          }] : [];
          const stockItems = (dailyReview?.stocks || []).map(stock => ({
            type: 'stock',
            name: stock.name,
            code: stock.code,
            price: stock.price,
            change: stock.change,
            turnover: stock.turnover,
            volume: stock.volume,
            opinion: stock.opinion,
            takeProfit: stock.takeProfit,
            stopLoss: stock.stopLoss,
            reason: stock.reason,
            selected: true,
          }));
          const annItems = (dailyReview?.announcements || []).map(ann => ({
            type: 'announcement',
            summary: ann.summary,
            opinion: ann.opinion,
            reason: ann.reason,
            conclusion: ann.conclusion,
            selected: true,
          }));
          initialItems = [...marketItem, ...stockItems, ...annItems];
          break;
        }
        case 'finance':
        case 'conflict':
          initialItems = globalConflict?.conflicts?.map(conflict => ({ type: 'conflict', ...conflict, selected: true })) || [];
          break;
        case 'forecast':
          initialItems = futureForecast?.themes?.map(theme => ({ type: 'forecast', ...theme, selected: true })) || [];
          break;
      }
      setSelectedItems(initialItems);
    }
  }, [isOpen, activeTab, hotSearch, dailyReview, globalConflict, futureForecast]);

  if (!isOpen) return null;

  const toggleSelection = (index: number) => {
    const newItems = [...selectedItems];
    newItems[index].selected = !newItems[index].selected;
    setSelectedItems(newItems);
  };

  const toggleSelectAll = () => {
    const allSelected = selectedItems.every(i => i.selected);
    setSelectedItems(selectedItems.map(i => ({ ...i, selected: !allSelected })));
  };

  const selectedCount = selectedItems.filter(i => i.selected).length;

  const handleDownloadImage = async () => {
    const el = cardRef.current;
    const wrapper = el?.parentElement;
    if (!el || !wrapper) return;
    setIsGenerating(true);
    try {
      // Save original styles
      const origElOverflow = el.style.overflow;
      const origElMaxH = el.style.maxHeight;
      const origWLeft = wrapper.style.left;
      const origWTop = wrapper.style.top;
      const origWPos = wrapper.style.position;

      // Move card into viewport (left:0 keeps it renderable for html-to-image),
      // but keep it invisible to user via original -left-[9999px] wrapper approach
      wrapper.style.position = 'fixed';
      wrapper.style.left = '0';
      wrapper.style.top = '0';
      wrapper.style.zIndex = '-1';
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';

      const dataUrl = await htmlToImage.toPng(el, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#141414',
      });

      // Restore original styles
      el.style.overflow = origElOverflow;
      el.style.maxHeight = origElMaxH;
      wrapper.style.position = origWPos || '';
      wrapper.style.left = origWLeft || '';
      wrapper.style.top = origWTop || '';
      wrapper.style.zIndex = '';

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `AI金融助手-${activeTab}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('生成图片失败，请稍后再试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareText = () => {
    const selected = selectedItems.filter(item => item.selected);
    if (selected.length === 0) {
      alert('请先选择要分享的内容');
      return;
    }

    let textContent = `【AI 金融助手 · ${getModuleTitle(activeTab)}】\n━━━━━━━━━━━━━━━━━━\n\n`;

    switch (activeTab) {
      case 'review': {
        const marketItem = selected.find(i => i.type === 'market');
        if (marketItem) {
          textContent += `📊 市场概览\n`;
          textContent += `  指数点位: ${marketItem.indexValue || '--'}\n`;
          textContent += `  涨跌幅: ${marketItem.indexChange || '--'}\n`;
          textContent += `  成交额: ${marketItem.volume || '--'}\n`;
          textContent += `  主力流向: ${marketItem.mainFlow || '--'}\n`;
          textContent += `  概述: ${marketItem.summary || '--'}\n\n`;
        }
        const stockItems = selected.filter(i => i.type === 'stock');
        stockItems.forEach(item => {
          textContent += `📈 ${item.name} (${item.code || '--'})\n`;
          textContent += `  最新价: ${item.price || '--'}  |  涨跌幅: ${item.change || '--'}\n`;
          textContent += `  换手率: ${item.turnover || '--'}  |  成交量: ${item.volume || '--'}\n`;
          textContent += `  观点: ${item.opinion || '观望'}\n`;
          textContent += `  止盈位: ${item.takeProfit || '--'}  |  止损位: ${item.stopLoss || '--'}\n`;
          if (item.reason) textContent += `  理由: ${item.reason}\n`;
          textContent += '\n';
        });
        const annItems = selected.filter(i => i.type === 'announcement');
        annItems.forEach(item => {
          textContent += `📄 公告解读\n`;
          textContent += `  结论: ${item.conclusion || '中性'}\n`;
          if (item.summary) textContent += `  核心归纳: ${item.summary}\n`;
          if (item.opinion) textContent += `  AI观点: ${item.opinion}\n`;
          if (item.reason) textContent += `  核心理由: ${item.reason}\n`;
          textContent += '\n';
        });
        break;
      }
      case 'hot':
        selected.forEach(item => {
          textContent += `🔥 [${item.siteName}] ${item.title}\n`;
          textContent += `  热度: ${item.hotness || '--'}\n`;
          if (item.desc) textContent += `  简介: ${item.desc}\n`;
          if (item.perspectives && item.perspectives.length > 0) {
            item.perspectives.forEach((p: any) => {
              textContent += `  【${p.role}】${p.view}\n`;
            });
          }
          textContent += '\n';
        });
        break;
      case 'finance':
        selected.forEach(item => {
          textContent += `📰 ${item.title}\n`;
          textContent += `  来源: ${item.source || '--'}  |  时间: ${item.time || '--'}\n`;
          if (item.desc) textContent += `  摘要: ${item.desc}\n`;
          if (item.goodSectors) textContent += `  利好板块: ${item.goodSectors}\n`;
          if (item.goodStocks) textContent += `  利好个股: ${item.goodStocks}\n`;
          if (item.reason) textContent += `  理由: ${item.reason}\n`;
          textContent += '\n';
        });
        break;
      case 'conflict':
        selected.forEach(item => {
          textContent += `⚔️ ${item.region}\n`;
          textContent += `  持续时间: ${item.duration || '--'}\n`;
          if (item.desc) textContent += `  概述: ${item.desc}\n`;
          if (item.sideA) {
            textContent += `  🔴 ${item.sideA.name || '甲方'}立场: ${item.sideA.opinion || ''}\n`;
            if (item.sideA.reason) textContent += `    理由: ${item.sideA.reason}\n`;
          }
          if (item.sideB) {
            textContent += `  🔵 ${item.sideB.name || '乙方'}立场: ${item.sideB.opinion || ''}\n`;
            if (item.sideB.reason) textContent += `    理由: ${item.sideB.reason}\n`;
          }
          if (item.analysis) textContent += `  客观分析: ${item.analysis}\n`;
          if (item.impacts && item.impacts.length > 0) {
            textContent += `  市场影响:\n`;
            item.impacts.forEach((imp: any) => {
              textContent += `    - ${imp.name}: ${imp.change || '--'}\n`;
            });
          }
          if (item.source) textContent += `  来源: ${item.source}\n`;
          textContent += '\n';
        });
        break;
      case 'forecast':
        if (selected.length > 0) {
          textContent += `📅 预判周期: ${futureForecast?.period || '--'}\n\n`;
        }
        selected.forEach(item => {
          textContent += `🎯 ${item.name}\n`;
          if (item.tag) textContent += `  标签: ${item.tag}\n`;
          if (item.event) textContent += `  催化事件: ${item.event}\n`;
          if (item.judgment) textContent += `  板块判断: ${item.judgment}\n`;
          const stockLabel = item.stockName || item.stock || '';
          if (stockLabel) {
            textContent += `  推荐个股: ${item.stockName || ''}${item.stock && item.stockName ? ` (${item.stock})` : item.stock || ''}`;
            if (item.holdDays) textContent += `  |  持股天数: ${item.holdDays}`;
            textContent += '\n';
          }
          if (item.buyRange) textContent += `  买入区间: ${item.buyRange}\n`;
          if (item.target) textContent += `  止盈目标: ${item.target}\n`;
          if (item.reason) textContent += `  推荐理由: ${item.reason}\n`;
          if (item.upstream) textContent += `  上游产业链: ${item.upstream}\n`;
          if (item.downstream) textContent += `  下游产业链: ${item.downstream}\n`;
          textContent += '\n';
        });
        break;
    }

    textContent += `━━━━━━━━━━━━━━━━━━\n由 AI 金融助手生成`;

    // Copy to clipboard
    navigator.clipboard.writeText(textContent).then(() => {
      alert('文字内容已复制到剪贴板，可用于数字人播报');
    }).catch(() => {
      // Fallback: show in a textarea for manual copy
      const textarea = document.createElement('textarea');
      textarea.value = textContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('文字内容已复制到剪贴板');
    });
  };

  // ─── Step 1: Selection ───────────────────────────────────────
  const renderStepSelect = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          选择要分享的内容
        </h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Select All Toggle */}
      <div className="px-4 md:px-6 pt-3 pb-1 flex items-center justify-between">
        <button
          onClick={toggleSelectAll}
          className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
        >
          {selectedItems.every(i => i.selected) ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          全选 / 取消全选
        </button>
        <span className="text-xs text-on-surface-variant">已选 {selectedCount} 项</span>
      </div>

      {/* Scrollable Selection List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 space-y-2">
        {selectedItems.map((item, index) => (
          <div
            key={index}
            onClick={() => toggleSelection(index)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border",
              item.selected
                ? "bg-primary/10 border-primary/30 shadow-sm"
                : "bg-surface-container-high border-transparent hover:bg-surface-container-highest"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {item.selected ? (
                <CheckSquare className="w-5 h-5 text-primary" />
              ) : (
                <Square className="w-5 h-5 text-on-surface-variant" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {activeTab === 'hot' && `[${item.siteName}] ${item.title}`}
                {item.type === 'market' && '📊 市场概览'}
                {item.type === 'stock' && `📈 ${item.name} (${item.code || ''})`}
                {item.type === 'announcement' && `📄 公告解读`}
                {item.type === 'news' && item.title}
                {item.type === 'conflict' && item.region}
                {item.type === 'forecast' && item.name}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate mt-1">
                {item.type === 'market' && item.summary}
                {item.type === 'stock' && `${item.price || ''} ${item.change || ''} | ${item.opinion || ''}`}
                {item.type === 'announcement' && `${item.conclusion || ''}: ${item.summary || ''}`}
                {item.type === 'news' && item.desc}
                {item.type === 'conflict' && item.desc}
                {item.type === 'forecast' && item.event}
              </p>
            </div>
          </div>
        ))}
        {selectedItems.length === 0 && (
          <div className="text-center py-8 text-sm text-on-surface-variant">
            暂无可选内容
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="p-4 md:p-6 border-t border-white/10 bg-surface-container">
        <button
          onClick={() => setStep('format')}
          disabled={selectedCount === 0}
          className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          下一步：选择分享方式
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </>
  );

  // ─── Step 2: Format Selection ─────────────────────────────────
  const renderStepFormat = () => (
    <>
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('select')}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold text-white">选择分享方式</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
        {/* Selected items summary */}
        <div className="bg-surface-container-high rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">已选内容</span>
            <span className="text-xs font-bold text-white">{selectedCount} 项</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedItems.filter(i => i.selected).slice(0, 5).map((item, idx) => (
              <span key={idx} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full truncate max-w-[120px]">
                {item.name || item.region || item.siteName || (item.type === 'market' && '市场概览') || (item.type === 'stock' && item.name) || (item.type === 'announcement' && '公告解读') || item.title}
              </span>
            ))}
            {selectedCount > 5 && (
              <span className="text-[10px] text-on-surface-variant">+{selectedCount - 5} 项</span>
            )}
          </div>
        </div>

        {/* Text Format Card */}
        <button
          onClick={handleShareText}
          className="flex items-start gap-4 p-5 rounded-2xl bg-surface-container-high border border-primary/20 hover:bg-primary/10 transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
            <Type className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              文字形式
              <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">数字人播报</span>
            </h4>
            <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
              生成结构化文字内容，复制到剪贴板。适用于数字人播报场景。
            </p>
          </div>
        </button>

        {/* Image Format Card */}
        <button
          onClick={handleDownloadImage}
          disabled={isGenerating}
          className="flex items-start gap-4 p-5 rounded-2xl bg-surface-container-high border border-secondary/20 hover:bg-secondary/10 transition-all group text-left disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 group-hover:bg-secondary/30 transition-colors">
            <Image className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              图片形式
              <span className="text-[9px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-medium">分享长图</span>
            </h4>
            <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
              生成长图保存到相册，方便分享给朋友或社交媒体。
            </p>
            {isGenerating && (
              <span className="text-xs text-secondary mt-2 block">正在生成图片...</span>
            )}
          </div>
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col md:items-center md:justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Mobile: full screen panel, Desktop: centered card */}
      <div className={cn(
        "bg-surface-container flex flex-col flex-1 md:flex-none",
        step === 'select'
          ? "md:rounded-3xl md:w-full md:max-w-lg md:max-h-[85dvh] md:min-h-[500px]"
          : "md:rounded-3xl md:w-full md:max-w-md md:max-h-[85dvh]"
      )}>
        {step === 'select' ? renderStepSelect() : renderStepFormat()}
      </div>

      {/* Hidden card for image generation */}
      <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
        <div
          ref={cardRef}
          className="w-[340px] bg-surface-container-low rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden"
          style={{ minHeight: '400px' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Logo size="lg" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">AI 金融助手</h2>
              <p className="text-[11px] text-on-surface-variant">您的智能投资智囊</p>
            </div>
          </div>

          <div className="bg-surface-container-high/50 rounded-xl p-4 mb-6 relative z-10 border border-white/5 backdrop-blur-sm">
            <div className="text-[11px] text-secondary font-medium mb-3 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              今日洞察
            </div>
            <HiddenContentPreview items={selectedItems} activeTab={activeTab} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
            <div>
              <p className="text-xs font-bold text-white">长按识别二维码</p>
              <p className="text-[11px] text-on-surface-variant mt-1">获取最新金融资讯</p>
            </div>
            <div className="w-16 h-16 bg-white p-1 rounded-lg">
              <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : ''} size={56} bgColor="#ffffff" fgColor="#000000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component for the hidden card preview (same logic as before)
function HiddenContentPreview({ items, activeTab }: { items: any[], activeTab: string }) {
  const selected = items.filter(item => item.selected);
  if (selected.length === 0) return <p className="text-xs text-white/50 italic text-center py-4">请选择要分享的内容</p>;

  switch (activeTab) {
    case 'review': {
      const marketItem = selected.find((i: any) => i.type === 'market');
      const stockItems = selected.filter((i: any) => i.type === 'stock');
      const annItems = selected.filter((i: any) => i.type === 'announcement');
      return (
        <div className="space-y-3">
          {marketItem && (
            <div className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2">
              <div className="font-bold text-primary mb-1">📊 市场概览</div>
              <div className="text-[11px] text-white/70">
                指数: {marketItem.indexValue || '--'} | 涨跌幅: {marketItem.indexChange || '--'}
              </div>
              <div className="text-[11px] text-white/70">
                成交额: {marketItem.volume || '--'} | 主力流向: {marketItem.mainFlow || '--'}
              </div>
              {marketItem.summary && <div className="text-[10px] text-white/50 mt-1">{marketItem.summary}</div>}
            </div>
          )}
          {stockItems.map((item: any, idx: number) => (
            <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
              <div className="font-bold text-primary mb-1">📈 {item.name} ({item.code || '--'})</div>
              <div className="text-[11px] text-white/70">
                最新价: {item.price || '--'} | 涨跌幅: {item.change || '--'}
              </div>
              <div className="text-[11px] text-white/70">
                换手率: {item.turnover || '--'} | 成交量: {item.volume || '--'}
              </div>
              <div className="text-[10px] mt-1">
                <span className={item.opinion?.includes('买入') ? 'text-green-500' : item.opinion?.includes('卖出') ? 'text-red-500' : 'text-yellow-500'}>
                  观点: {item.opinion || '观望'}
                </span>
                <span className="text-white/50"> | 止盈: {item.takeProfit || '--'} | 止损: {item.stopLoss || '--'}</span>
              </div>
              {item.reason && <div className="text-[10px] text-white/50 mt-1 italic">{item.reason}</div>}
            </div>
          ))}
          {annItems.map((item: any, idx: number) => (
            <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
              <div className="font-bold text-primary mb-1">📄 公告解读</div>
              <div className="text-[10px]">
                <span className={item.conclusion?.includes('利好') ? 'text-green-500' : item.conclusion?.includes('利空') ? 'text-red-500' : 'text-yellow-500'}>
                  结论: {item.conclusion || '中性'}
                </span>
              </div>
              {item.summary && <div className="text-[11px] text-white/70 mt-1">{item.summary}</div>}
              {item.opinion && <div className="text-[10px] text-white/50 mt-1">AI观点: {item.opinion}</div>}
              {item.reason && <div className="text-[10px] text-white/50 italic">理由: {item.reason}</div>}
            </div>
          ))}
        </div>
      );
    }
    case 'hot':
      return (
        <div className="space-y-3">
          {selected.map((item: any, idx: number) => (
            <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
              <div className="font-bold text-secondary mb-1">[{item.siteName}] {item.title}</div>
              <div className="text-[11px] text-white/70 mb-1">
                {item.desc || ''}{item.hotness ? ` 热度: ${item.hotness}` : ''}
              </div>
              {item.perspectives?.map((p: any, pi: number) => (
                <div key={pi} className="text-[9px] text-white/50 mt-0.5">【{p.role}】{p.view}</div>
              ))}
            </div>
          ))}
        </div>
      );
    case 'finance':
      return (
        <div className="space-y-3">
          {selected.map((item: any, idx: number) => (
            <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
              <div className="font-bold text-secondary mb-1">{item.title}</div>
              <div className="text-[10px] text-white/50 mb-1">{item.source || ''} | {item.time || ''}</div>
              {item.desc && <div className="text-[11px] text-white/70 mb-1">{item.desc}</div>}
              {item.goodSectors && <div className="text-[10px] text-green-500">利好板块: {item.goodSectors}</div>}
              {item.goodStocks && <div className="text-[10px] text-green-500">利好个股: {item.goodStocks}</div>}
              {item.reason && <div className="text-[10px] text-white/50 mt-1 italic">{item.reason}</div>}
            </div>
          ))}
        </div>
      );
    case 'conflict':
      return (
        <div className="space-y-3">
          {selected.map((item: any, idx: number) => (
            <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
              <div className="font-bold text-error mb-1">⚔️ {item.region}</div>
              {item.duration && <div className="text-[10px] text-white/50 mb-1">持续: {item.duration}</div>}
              {item.desc && <div className="text-[11px] text-white/70 mb-1">{item.desc}</div>}
              <div className="grid grid-cols-2 gap-1">
                {item.sideA && (
                  <div className="text-[9px] text-red-500">
                    🔴 {item.sideA.name}: {item.sideA.opinion}
                  </div>
                )}
                {item.sideB && (
                  <div className="text-[9px] text-blue-500">
                    🔵 {item.sideB.name}: {item.sideB.opinion}
                  </div>
                )}
              </div>
              {item.analysis && <div className="text-[9px] text-white/50 mt-1 italic">{item.analysis}</div>}
              {item.impacts?.length > 0 && (
                <div className="text-[9px] text-white/50 mt-1">
                  影响: {item.impacts.map((i: any) => `${i.name} ${i.change || ''}`).join(' | ')}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    case 'forecast':
      return (
        <div className="space-y-3">
          {selected.map((item: any, idx: number) => (
            <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
              <div className="font-bold text-tertiary mb-1">🎯 {item.name}</div>
              {item.event && <div className="text-[11px] text-white/70 mb-1">催化: {item.event}</div>}
              {item.judgment && <div className="text-[11px] text-white/70 mb-1">判断: {item.judgment}</div>}
              {(item.stockName || item.stock) && (
                <div className="text-[10px] text-red-500">
                  推荐: {item.stockName || item.stock}{item.stock && item.stockName ? ` (${item.stock})` : ''}
                  {item.holdDays ? ` | 持股: ${item.holdDays}` : ''}
                </div>
              )}
              {item.buyRange && <div className="text-[10px] text-white/50">买入区间: {item.buyRange}</div>}
              {item.target && <div className="text-[10px] text-white/50">止盈目标: {item.target}</div>}
              {item.reason && <div className="text-[10px] text-white/50 mt-1 italic">{item.reason}</div>}
              {(item.upstream || item.downstream) && (
                <div className="text-[9px] text-white/40 mt-1">
                  {item.upstream ? `⬆ 上游: ${item.upstream}` : ''}{item.upstream && item.downstream ? ' | ' : ''}{item.downstream ? `⬇ 下游: ${item.downstream}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    default:
      return <p className="text-sm text-white/90">AI金融助手为您提供最新资讯</p>;
  }
}

function getModuleTitle(tab: string): string {
  switch (tab) {
    case 'hot': return '热搜早知道';
    case 'review':
    case 'investment': return '投资总览';
    case 'finance':
    case 'conflict': return '全球冲突进程';
    case 'forecast': return '未来预判';
    default: return '';
  }
}
