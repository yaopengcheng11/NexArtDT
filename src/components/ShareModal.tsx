import { useState, useRef, useEffect } from 'react';
import { X, Download, Share2, CheckSquare, Square } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../context/DataContext';
import { Logo } from './Logo';
import { cn } from '../lib/utils';

export function ShareModal({ isOpen, onClose, activeTab }: { isOpen: boolean, onClose: () => void, activeTab: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { hotSearch, dailyReview, financeNews, globalConflict, futureForecast } = useData();

  // State for selected items to share
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Initialize selected items based on active tab
  useEffect(() => {
    if (isOpen) {
      let initialItems: any[] = [];
      switch (activeTab) {
        case 'hot':
          initialItems = hotSearch?.sites?.flatMap(site => site.items.map(item => ({ ...item, siteName: site.siteName, selected: true }))) || [];
          break;
        case 'review':
          initialItems = [
            { type: 'market', title: '市场概览', content: dailyReview?.marketOverview?.summary, selected: true },
            ...(dailyReview?.stocks?.map(stock => ({ type: 'stock', title: stock.name, content: stock.reason, selected: true })) || []),
            ...(dailyReview?.announcements?.map(ann => ({ type: 'announcement', title: '公告解读', content: ann.summary, selected: true })) || [])
          ];
          break;
        case 'finance':
          initialItems = financeNews?.news?.map(news => ({ ...news, selected: true })) || [];
          break;
        case 'conflict':
          initialItems = globalConflict?.conflicts?.map(conflict => ({ ...conflict, selected: true })) || [];
          break;
        case 'forecast':
          initialItems = futureForecast?.themes?.map(theme => ({ ...theme, selected: true })) || [];
          break;
      }
      setSelectedItems(initialItems);
    }
  }, [isOpen, activeTab, hotSearch, dailyReview, financeNews, globalConflict, futureForecast]);

  if (!isOpen) return null;

  const toggleSelection = (index: number) => {
    const newItems = [...selectedItems];
    newItems[index].selected = !newItems[index].selected;
    setSelectedItems(newItems);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#141414', // Match background
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI金融助手-${activeTab}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('生成图片失败，请稍后再试');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render content based on active tab and selection
  const renderContentPreview = () => {
    const selected = selectedItems.filter(item => item.selected);
    if (selected.length === 0) return <p className="text-xs text-white/50 italic text-center py-4">请选择要分享的内容</p>;

    switch (activeTab) {
      case 'hot':
        return (
          <div className="space-y-3">
            {selected.slice(0, 5).map((item, idx) => (
              <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
                <span className="text-secondary font-bold mr-2">[{item.siteName}]</span>
                {item.title}
              </div>
            ))}
            {selected.length > 5 && <div className="text-[11px] text-white/50 text-center pt-2">...等 {selected.length} 条热搜</div>}
          </div>
        );
      case 'review':
        return (
          <div className="space-y-3">
            {selected.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
                <div className="font-bold text-primary mb-1">{item.title}</div>
                <div className="text-[11px] text-white/70 line-clamp-3">{item.content}</div>
              </div>
            ))}
            {selected.length > 3 && <div className="text-[11px] text-white/50 text-center pt-2">...等 {selected.length} 项复盘内容</div>}
          </div>
        );
      case 'finance':
        return (
          <div className="space-y-3">
            {selected.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
                <div className="font-bold text-secondary mb-1">{item.title}</div>
                <div className="text-[11px] text-white/70 line-clamp-2">{item.desc}</div>
              </div>
            ))}
            {selected.length > 3 && <div className="text-[11px] text-white/50 text-center pt-2">...等 {selected.length} 条要闻</div>}
          </div>
        );
      case 'conflict':
        return (
          <div className="space-y-3">
            {selected.slice(0, 2).map((item, idx) => (
              <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
                <div className="font-bold text-error mb-1">{item.region}</div>
                <div className="text-[11px] text-white/70 line-clamp-3">{item.desc}</div>
              </div>
            ))}
            {selected.length > 2 && <div className="text-[11px] text-white/50 text-center pt-2">...等 {selected.length} 项冲突动态</div>}
          </div>
        );
      case 'forecast':
        return (
          <div className="space-y-3">
            {selected.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-xs text-white/90 leading-relaxed border-b border-white/10 pb-2 last:border-0">
                <div className="font-bold text-tertiary mb-1">{item.name}</div>
                <div className="text-[11px] text-white/70 line-clamp-2">催化：{item.event}</div>
              </div>
            ))}
            {selected.length > 3 && <div className="text-[11px] text-white/50 text-center pt-2">...等 {selected.length} 个题材预测</div>}
          </div>
        );
      default:
        return <p className="text-sm text-white/90">AI金融助手为您提供最新资讯</p>;
    }
  };

  const renderSelectionList = () => {
    return (
      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        <h4 className="text-xs font-bold text-white/80 mb-3 sticky top-0 bg-surface-container py-1 z-10">选择要包含的内容：</h4>
        {selectedItems.map((item, index) => (
          <div 
            key={index} 
            onClick={() => toggleSelection(index)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
              item.selected ? "bg-primary/10 border-primary/30" : "bg-surface-container-high border-transparent hover:bg-surface-container-highest"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {item.selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-on-surface-variant" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">
                {activeTab === 'hot' && `[${item.siteName}] ${item.title}`}
                {activeTab === 'review' && item.title}
                {activeTab === 'finance' && item.title}
                {activeTab === 'conflict' && item.region}
                {activeTab === 'forecast' && item.name}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate mt-1">
                {activeTab === 'review' && item.content}
                {activeTab === 'finance' && item.desc}
                {activeTab === 'conflict' && item.desc}
                {activeTab === 'forecast' && item.event}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] md:flex-row">
        
        {/* Left Side: Selection Panel */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              定制分享内容
            </h3>
            <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {renderSelectionList()}
          </div>
        </div>

        {/* Right Side: Preview & Action */}
        <div className="flex-1 flex flex-col bg-background relative">
          <button onClick={onClose} className="hidden md:block absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
            {/* The Card to be captured */}
            <div 
              ref={cardRef} 
              className="w-full bg-surface-container-low rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden"
              style={{ width: '340px', minHeight: '400px' }} // Fixed width for consistent image generation
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              {/* Logo and Header */}
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <Logo size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">AI 金融助手</h2>
                  <p className="text-[11px] text-on-surface-variant">您的智能投资智囊</p>
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-surface-container-high/50 rounded-xl p-4 mb-6 relative z-10 border border-white/5 backdrop-blur-sm">
                <div className="text-[11px] text-secondary font-medium mb-3 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  今日洞察
                </div>
                {renderContentPreview()}
              </div>

              {/* Footer with QR Code */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10 mt-auto">
                <div>
                  <p className="text-xs font-bold text-white">长按识别二维码</p>
                  <p className="text-[11px] text-on-surface-variant mt-1">获取最新金融资讯</p>
                </div>
                <div className="w-16 h-16 bg-white p-1 rounded-lg">
                  <QRCodeSVG 
                    value={window.location.href} 
                    size={56}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/10 bg-surface-container">
            <button
              onClick={handleDownload}
              disabled={isGenerating || selectedItems.filter(i => i.selected).length === 0}
              className="w-full py-3 rounded-xl bg-primary text-on-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {isGenerating ? '生成中...' : '保存分享图片'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
