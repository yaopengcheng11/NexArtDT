import { MoreHorizontal, Bookmark, TrendingUp, BarChart2, Sparkles, ExternalLink, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn, isValidUrl } from '../lib/utils';

export function FinanceNews() {
  const { financeNews } = useData();
  const newsList = Array.isArray(financeNews?.news) ? financeNews.news : [];

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(420px,100%),1fr))] gap-4 xl:gap-5 max-w-5xl xl:max-w-7xl 2xl:max-w-[90vw] mx-auto pt-16 pb-20 px-4 sm:px-6 2xl:px-8">
      {newsList.map((news, index) => (
        <article key={index} className="bg-surface-container rounded-xl overflow-hidden shadow-sm relative">
          {index === 1 && <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-primary rounded-full"></div>}
          <div className="p-4">
            {/* Source Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center border border-outline-variant/15 overflow-hidden text-primary font-bold text-[10px]">
                  {news.source.substring(0, 2)}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-on-surface">{news.source}</p>
                  <p className="text-[9px] text-on-surface-variant">{news.time}</p>
                </div>
                {news.link && isValidUrl(news.link) ? (
                  <a
                    href={news.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[10px] text-secondary hover:text-secondary/80 flex items-center gap-0.5 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> 原文
                  </a>
                ) : news.link ? (
                  <span className="ml-auto text-[10px] text-on-surface-variant/50 flex items-center gap-0.5 cursor-not-allowed" title="链接地址无效或已失效">
                    <AlertTriangle className="w-3 h-3" /> 原文不可用
                  </span>
                ) : null}
              </div>
            </div>

            {/* Headline */}
            <h3 className="font-headline text-sm font-bold leading-snug text-on-surface mb-2">
              {news.title}
            </h3>

            {/* Description */}
            <div className="flex gap-2 mb-4">
              <span className="text-base leading-none shrink-0">📝</span>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                {news.desc}
              </p>
            </div>

            {/* Beneficiary Sections */}
            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 shrink-0">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-500 text-[10px] font-bold">利好板块</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span className="text-on-surface text-[11px]">{news.goodSectors}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 shrink-0">
                  <BarChart2 className="w-3 h-3 text-green-500" />
                  <span className="text-green-500 text-[10px] font-bold">利好个股</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span className="text-on-surface text-[11px]">{news.goodStocks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-surface-container-lowest/50 backdrop-blur-sm px-4 py-3 flex gap-2 border-t border-outline-variant/5">
            <span className="text-base leading-none shrink-0">💬</span>
            <div>
              <p className="text-[10px] font-bold text-green-500 mb-0.5 flex items-center gap-1">
                理由 <Sparkles className="w-2.5 h-2.5 fill-current" />
              </p>
              <p className="text-[9px] text-on-surface/80 leading-relaxed italic">
                {news.reason}
              </p>
            </div>
          </div>
        </article>
      ))}

      {newsList.length === 0 && (
        <div className="bg-surface-container rounded-xl p-6 text-center text-sm text-on-surface-variant">
          暂无财经要闻数据，点击顶部刷新后会重新拉取内容。
        </div>
      )}
    </div>
  );
}
