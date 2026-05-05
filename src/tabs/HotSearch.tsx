import { useState } from 'react';
import { Eye, MessageSquare, Lightbulb, PlayCircle, HelpCircle, TrendingUp, Edit, Check, Plus, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';

const AVAILABLE_SITES = ['bilibili', '知乎', '新浪微博', '抖音', '小红书', '百度', '头条'];

export function HotSearch() {
  const { hotSearch, customSites, setCustomSites, customTopics, setCustomTopics } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const sites = Array.isArray(hotSearch?.sites) ? hotSearch.sites : [];

  const toggleSite = (site: string) => {
    if (customSites.includes(site)) {
      if (customSites.length > 1) { // Prevent removing all sites
        setCustomSites(customSites.filter(s => s !== site));
      }
    } else {
      setCustomSites([...customSites, site]);
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !customTopics.includes(newTopic.trim())) {
      setCustomTopics([...customTopics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setCustomTopics(customTopics.filter(topic => topic !== topicToRemove));
  };

  const getSiteColor = (siteName: string) => {
    if (siteName.toLowerCase().includes('bilibili')) return 'bg-[#ff6699]';
    if (siteName.includes('知乎')) return 'bg-[#0066ff]';
    if (siteName.includes('微博')) return 'bg-[#e6162d]';
    if (siteName.includes('抖音')) return 'bg-[#000000]';
    if (siteName.includes('小红书')) return 'bg-[#ff2442]';
    return 'bg-secondary';
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pt-16 pb-20 px-4">
      {/* Customization Header */}
      <div className="flex justify-between items-end">
        <h2 className="text-base font-headline font-bold text-primary">热搜聚合</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-medium text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
          {isEditing ? '完成' : '自定义热搜'}
        </button>
      </div>

      {/* Customization UI */}
      {isEditing && (
        <div className="bg-surface-container rounded-xl p-4 border border-secondary/20 space-y-4">
          {/* Sites Selection */}
          <div>
            <h3 className="text-xs font-bold text-on-surface mb-2">选择关注的平台</h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SITES.map(site => (
                <button
                  key={site}
                  onClick={() => toggleSite(site)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                    customSites.includes(site) 
                      ? "bg-secondary/20 text-secondary border-secondary/50" 
                      : "bg-surface-container-high text-on-surface-variant border-outline-variant/30 hover:bg-surface-bright"
                  )}
                >
                  {site}
                </button>
              ))}
            </div>
          </div>

          {/* Topics Input */}
          <div>
            <h3 className="text-xs font-bold text-on-surface mb-2">添加特别关注的话题</h3>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                placeholder="输入话题，如：人工智能、新能源"
                className="flex-1 bg-surface-container-high border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-secondary transition-colors"
              />
              <button 
                onClick={handleAddTopic}
                className="bg-secondary text-on-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-secondary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> 添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {customTopics.map(topic => (
                <div key={topic} className="bg-surface-container-high border border-outline-variant/30 rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                  <span>{topic}</span>
                  <button onClick={() => handleRemoveTopic(topic)} className="text-on-surface-variant hover:text-error transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {customTopics.length === 0 && (
                <span className="text-xs text-on-surface-variant italic">暂无特别关注的话题。</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Sites Rendering */}
      {sites.map((site, siteIndex) => (
        <section key={siteIndex} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-1 h-5 rounded-full", getSiteColor(site.siteName))}></div>
              <h2 className="text-sm font-headline font-extrabold tracking-tight">{site.siteName} 实时热点</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {(Array.isArray(site?.items) ? site.items : []).map((item, itemIndex) => (
              <div key={itemIndex} className="bg-surface-container rounded-xl overflow-hidden relative group transition-all duration-300 hover:bg-surface-container-high border-l-2 border-outline-variant/20 hover:border-primary">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-headline font-black text-xs">{itemIndex + 1}</div>
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-bold leading-tight text-on-surface">{item.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> 热度: {item.hotness}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
                  <div className="bg-surface-container-low p-3 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-1.5 text-secondary text-[10px] font-bold uppercase tracking-wider">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>分析与观点</span>
                    </div>
                    <p className="text-[11px] font-medium text-on-surface leading-snug italic">{item.analysis}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {sites.length === 0 && (
        <div className="bg-surface-container rounded-xl p-6 text-center text-sm text-on-surface-variant">
          暂无热搜数据，点击顶部刷新后会重新拉取内容。
        </div>
      )}
    </div>
  );
}
