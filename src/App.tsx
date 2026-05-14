/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BarChart2, Hexagon, Pentagon, ShieldAlert, ShieldCheck } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { ChatCopilot } from './components/ChatCopilot';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { ShareModal } from './components/ShareModal';
import { SettingsModal } from './components/SettingsModal';
import { HotSearch } from './tabs/HotSearch';
import { InvestmentOverview } from './tabs/InvestmentOverview';
import { GlobalConflict } from './tabs/GlobalConflict';
import { fetchLatestData } from './lib/gemini';
import { fetchRealHotSearch } from './lib/api';
import {
  hotSearchSchema,
  dailyReviewSchema,
  globalConflictSchema,
  futureForecastSchema,
} from './lib/schemas';

function MainApp() {
  const [activeTab, setActiveTab] = useState('investment');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const {
    updateData,
    isRefreshing,
    setIsRefreshing,
    lastUpdated,
    customStocks,
    customSites,
    customTopics,
    globalModel,
  } = useData();
  const { user, role, loading } = useAuth();

  // 控制加载动画的显示与淡出
  const [showLoader, setShowLoader] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 当真实数据（认证状态）加载完毕时，开始执行淡出动画
    if (!loading) {
      setIsFadingOut(true);
      // 等待 400 毫秒（动画播完）后，彻底把加载层从页面上删掉
      const timer = setTimeout(() => setShowLoader(false), 400);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // ⏱ 强制兜底：最多等 3 秒，不管 auth 有没有加载完都进页面
  useEffect(() => {
    const forceTimer = setTimeout(() => {
      if (showLoader) {
        setIsFadingOut(true);
        setTimeout(() => setShowLoader(false), 400);
      }
    }, 3000);
    return () => clearTimeout(forceTimer);
  }, []);

  const refreshConfigs = [
    {
      moduleName: '热搜早知道',
      contextKey: 'hotSearch',
      schema: hotSearchSchema,
      getExtraPrompt: () => {
        const hasTopics = customTopics.length > 0;
        const topicsPart = hasTopics
          ? `\n\n【特别关注话题】用户特别关注以下话题：${customTopics.join('、')}。请在这些话题中优先选择与热点相关的内容。`
          : '\n\n【重要】用户没有添加特别关注的话题，因此你的所有内容必须从上面提供的 100% 实时数据中生成，不得自行编造。';
        return `【你的任务】基于上面提供的 100% 真实热搜列表，对每条内容进行以下补充：
1. desc（描述）：用一两句话简要说明该话题在讨论什么
2. hotness（热度值）：使用上面提供的热度数据
3. link（链接）：使用搜索URL格式
4. perspectives（三种视角）：黑粉视角、狂热粉丝视角、客观官方视角

【数据来源】只基于上面提供的实时数据生成，如果数据不全可用 googleSearch 补搜个别条目。
${topicsPart}

【绝对禁止】
- 禁止凭空编造热搜话题
- 禁止替换/新增不在上面列表中的条目
- 每条内容的标题、热度必须与上面提供的实时数据一致

【链接格式】bilibili: https://search.bilibili.com/all?keyword=关键词 | 微博: https://s.weibo.com/weibo?q=关键词 | 知乎: https://www.zhihu.com/search?type=content&q=关键词`;
      },
    },
    {
      moduleName: '每日复盘',
      contextKey: 'dailyReview',
      schema: dailyReviewSchema,
      getExtraPrompt: () => `【实时数据要求】你必须使用 googleSearch 工具搜索今天的实时大盘行情数据、自选股行情和相关新闻。请关注以下自选股：${customStocks.join(', ')}。

【重要】所有数据必须是今天的实时数据。marketOverview中的指数点位、涨跌幅、成交额、主力流向必须来自实时搜索。stocks中的价格、涨跌幅、换手率、成交量必须来自实时搜索。

【年度统一】年份必须是2026年（今年）。如果搜索结果中的年份不对，请修正为2026年。

使用 googleSearch 搜索：
1. 今日A股大盘指数实时行情
2. 今日A股成交额
3. 各自选股今日行情和走势
4. 今日重要财经新闻
5. 今日主力资金流向`,
    },
    {
      moduleName: '全球冲突进程',
      contextKey: 'globalConflict',
      schema: globalConflictSchema,
      getExtraPrompt: () => '【实时数据要求】你必须使用 googleSearch 工具搜索当前正在发生的全球地缘冲突/军事冲突/政治危机的最新进展和新闻。搜索国际主流媒体报道。每条冲突的 source 字段必须填写具体的新闻来源（如：BBC、Reuters、央视新闻、环球网等）。数据必须是最新的。',
    },
    {
      moduleName: '未来预判',
      contextKey: 'futureForecast',
      schema: futureForecastSchema,
      getExtraPrompt: () => `【实时数据要求】你必须使用 googleSearch 工具搜索当前最新的宏观经济数据和政策动态。

必须搜索以下内容：
1. 搜索 "2026年5月最新经济数据" 获取当前最新的宏观数据
2. 搜索 "2026年5月 最新政策 产业政策 A股" 获取当前最新的政策导向
3. 搜索 "2026年5月 热点题材 A股" 获取当前市场关注的热点
4. 搜索 "2026年5月 重大事件 经济数据公布 日历" 获取未来一周的重要经济数据发布日程

【核心要求】
- period（周期）：使用今天的真实日期，格式为"2026-05-14 至 2026-05-17"
- themes 中的推荐个股必须基于当前真实的市场热点
- events（重点事件观察）：必须来自实时搜索，列出未来一周内真实的经济数据公布、央行决议、重要会议等
- riskWarning、strategy 基于当前市场真实情况分析
- 禁止使用过时的知识库数据
- 年份都必须是2026年`,
    },
  ] as const;

  const handleRefresh = async () => {
    refreshConfigs.forEach(({ contextKey }) => setIsRefreshing(contextKey, true));
    try {
      // 💥 先拉取实时热搜数据（后端直连平台 API）
      const realHotData = await fetchRealHotSearch(customSites);

      const results = await Promise.allSettled(
        refreshConfigs.map(async ({ moduleName, contextKey, schema, getExtraPrompt }) => {
          let extraPrompt = getExtraPrompt();
          // 热搜模块：把实时数据注入 prompt，让 AI 只做补充而非编造
          if (contextKey === 'hotSearch' && Object.keys(realHotData).length > 0) {
            const realDataStr = Object.entries(realHotData)
              .map(([site, items]) => {
                return `【${site}】实时热搜 TOP${Math.min(items.length, 8)}:\n${items.slice(0, 8).map((item: any, i: number) => `${i + 1}. ${item.title}（热度: ${item.heat || '未显示'}）`).join('\n')}`;
              })
              .join('\n\n');
            extraPrompt = `【重要 - 以下是后端直连抓取的实时热搜数据，是 100% 真实的】\n\n${realDataStr}\n\n${extraPrompt}\n\n⚠️ 你必须基于上面提供的真实热搜数据进行填充和完善。如果某些平台搜索引擎没能获取到完整内容，可以补搜。禁止凭空编造不在上面列表中的热点。`;
          }
          const newData = await fetchLatestData(moduleName, schema, extraPrompt, globalModel, customStocks);
          updateData(contextKey, newData);
          return contextKey;
        })
      );

      const failedModules = results
        .map((result, index) => ({ result, config: refreshConfigs[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ config }) => config.moduleName);

      if (failedModules.length > 0) {
        alert(`以下模块更新失败：${failedModules.join('、')}。其余模块已尽量更新。`);
      }
    } catch (error) {
      console.error('Refresh failed', error);
      alert('更新失败，请稍后再试');
    } finally {
      refreshConfigs.forEach(({ contextKey }) => setIsRefreshing(contextKey, false));
    }
  };

  const renderContent = () => {
    if (activeTab === 'admin' && role === 'admin') {
      return <AdminPanel />;
    }

    switch (activeTab) {
      case 'hot':
        return <HotSearch />;
      case 'investment':
        return <InvestmentOverview />;
      case 'conflict':
        return <GlobalConflict />;
      default:
        return <InvestmentOverview />;
    }
  };

  const getTopBarProps = () => {
    if (activeTab === 'admin') {
      return {
        title: '管理员控制台',
        subtitle: '审批注册请求',
        icon: (
          <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10">
            <ShieldCheck className="w-3 h-3 text-secondary" />
          </div>
        ),
      };
    }

    const contextKey =
      activeTab === 'hot'
        ? 'hotSearch'
        : activeTab === 'investment'
          ? 'dailyReview'
          : 'globalConflict';

    const baseProps = {
      onRefresh: handleRefresh,
      isRefreshing: isRefreshing[contextKey],
      updateTime: lastUpdated[contextKey],
      onShare: () => setIsShareOpen(true),
      onOpenSettings: () => setIsSettingsOpen(true),
    };

    switch (activeTab) {
      case 'hot':
        return {
          ...baseProps,
          title: '热搜早知道',
          subtitle: '全网热点 · 实时追踪',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10">
              <BarChart2 className="w-3 h-3 text-secondary" />
            </div>
          ),
        };
      case 'investment':
        return {
          ...baseProps,
          title: '投资总览',
          subtitle: '市场复盘 · 题材预判',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10">
              <Hexagon className="w-3 h-3 text-secondary" />
            </div>
          ),
        };
      case 'conflict':
        return {
          ...baseProps,
          title: '全球冲突进程',
          subtitle: '地缘政治 · 宏观影响',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10">
              <ShieldAlert className="w-3 h-3 text-secondary" />
            </div>
          ),
        };
      default:
        return {
          ...baseProps,
          title: '投资总览',
        };
    }
  };

  return (
    <>
      {/* 第一层：悬浮在最顶部的全屏加载动画，控制缓慢消失 */}
      {showLoader && (
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-[800ms] ease-in-out ${
            isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <style>{`
            .loader-logo {
              font-size: 1.5rem;
              font-weight: 900;
              color: #42d392;
              letter-spacing: 2px;
              display: flex;
            }
            .loader-logo span {
              opacity: 0;
              display: inline-block;
              animation: wetaReveal 2.5s ease-out forwards;
            }
            .loader-logo span.dt {
              font-weight: 300;
              color: #2a8b58;
            }
            .loader-logo span.dt:first-of-type {
              margin-left: 6px;
            }
            @keyframes wetaReveal {
              0% { opacity: 0; filter: blur(4px); transform: translateX(-2px); }
              20%, 70% { opacity: 1; filter: blur(0); transform: translateX(0); text-shadow: 0 0 10px rgba(66, 211, 146, 0.4); }
              100% { opacity: 1; filter: blur(0); transform: translateX(0); }
            }
          `}</style>
          <div className="loader-logo">
            <span style={{ animationDelay: '0.0s' }}>N</span>
            <span style={{ animationDelay: '0.1s' }}>e</span>
            <span style={{ animationDelay: '0.2s' }}>x</span>
            <span style={{ animationDelay: '0.3s' }}>A</span>
            <span style={{ animationDelay: '0.4s' }}>r</span>
            <span style={{ animationDelay: '0.5s' }}>t</span>
            <span className="dt" style={{ animationDelay: '0.6s' }}>D</span>
            <span className="dt" style={{ animationDelay: '0.7s' }}>T</span>
          </div>
        </div>
      )}

      {/* 第二层：真实的页面内容，只有在 loading 结束后才开始在底层渲染 */}
      {!loading && (
        !user ? (
          <AuthScreen />
        ) : (
          <div className="min-h-screen bg-background text-on-surface font-body selection:bg-secondary/30">
            <TopBar {...getTopBarProps()} />

            <main className="w-full">{renderContent()}</main>

            <BottomNav activeTab={activeTab} onChange={setActiveTab} />

            {role === 'admin' && activeTab !== 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className="fixed bottom-24 left-6 px-4 py-2 rounded-full bg-surface-container-high text-white text-xs font-medium border border-white/10 shadow-lg z-40"
              >
                管理员入口
              </button>
            )}

            {activeTab === 'admin' && (
              <button
                onClick={() => setActiveTab('investment')}
                className="fixed bottom-24 left-6 px-4 py-2 rounded-full bg-surface-container-high text-white text-xs font-medium border border-white/10 shadow-lg z-40"
              >
                返回应用
              </button>
            )}

            <ChatCopilot />
            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} activeTab={activeTab} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          </div>
        )
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
