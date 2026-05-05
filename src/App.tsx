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
import { DailyReview } from './tabs/DailyReview';
import { FinanceNews } from './tabs/FinanceNews';
import { GlobalConflict } from './tabs/GlobalConflict';
import { FutureForecast } from './tabs/FutureForecast';
import { fetchLatestData } from './lib/gemini';
import {
  hotSearchSchema,
  dailyReviewSchema,
  financeNewsSchema,
  globalConflictSchema,
  futureForecastSchema,
} from './lib/schemas';

function MainApp() {
  const [activeTab, setActiveTab] = useState('review');
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
      // 等待 800 毫秒（动画播完）后，彻底把加载层从页面上删掉
      const timer = setTimeout(() => setShowLoader(false), 800); 
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const refreshConfigs = [
    {
      moduleName: '热搜早知道',
      contextKey: 'hotSearch',
      schema: hotSearchSchema,
      getExtraPrompt: () => {
        const hasTopics = customTopics.length > 0;
        const topicsPart = hasTopics
          ? `\n\n【特别关注话题】用户特别关注以下话题：${customTopics.join('、')}。请在这些话题中优先选择与热点相关的内容。`
          : '\n\n【重要】用户没有添加特别关注的话题，因此你的所有内容必须严格从上述平台的实时热搜/热门榜单中获取，不得自行编造或混入其他非热搜内容。';
        return `【核心指令 - 必须严格遵守】你是热搜数据聚合器，不是内容生成器。

【数据来源】请获取以下平台的实时热搜/热门榜单数据：${customSites.join(', ')}。每个平台至少提供 5 条当前热搜内容。${topicsPart}

【绝对禁止】
- 禁止编造任何热搜话题或热度数据
- 禁止使用大模型知识库中的过时内容替代实时热搜
- 禁止混入非热搜榜单的内容
- 每条内容的标题、热度数值、描述必须真实反映该平台的实时热搜情况

【链接要求 (重要)】link字段必须使用 搜索URL 格式（非详情页URL），确保网址可访问且不失效。
格式示例：
- 微博: https://s.weibo.com/weibo?q=关键词
- bilibili: https://search.bilibili.com/all?keyword=关键词
- 知乎: https://www.zhihu.com/search?type=content&q=关键词
- 百度: https://www.baidu.com/s?wd=关键词

【重要格式要求】每条热点必须提供perspectives数组，包含三种不同视角的观点分析：
1. 黑粉视角：以批评、质疑、挑刺的角度分析该热点，指出其问题或风险
2. 狂热粉丝视角：以拥护、追捧的角度分析该热点，强调其价值和积极面
3. 客观官方视角：以中立、理性、官方立场分析该热点，给出平衡的评估
每个视角都需要有 role（角色名称）和 view（具体观点）两个字段。`;
      },
    },
    {
      moduleName: '每日复盘',
      contextKey: 'dailyReview',
      schema: dailyReviewSchema,
      getExtraPrompt: () => `请重点复盘以下自选股：${customStocks.join(', ')}。`,
    },
    {
      moduleName: '财经要闻',
      contextKey: 'financeNews',
      schema: financeNewsSchema,
      getExtraPrompt: () => '每条财经新闻务必提供原始链接URL（link字段），确保链接可访问。请使用搜索URL格式，如：https://so.eastmoney.com/news/s?keyword=标题关键词 或 https://search.sina.com.cn/?q=标题关键词。不要使用文章详情页URL（文章页URL极易失效）。',
    },
    {
      moduleName: '全球冲突进程',
      contextKey: 'globalConflict',
      schema: globalConflictSchema,
      getExtraPrompt: () => '',
    },
    {
      moduleName: '未来预判',
      contextKey: 'futureForecast',
      schema: futureForecastSchema,
      getExtraPrompt: () => '【重要说明】推荐个股（stock字段）不限于用户的自选股，你可以从A股全市场范围中精选最符合该题材逻辑的个股。\n\n每条推荐必须包含：\n1. reason（推荐理由）：详细说明为什么推荐该个股，包括基本面、技术面、题材契合度等\n2. upstream（上游产业链）：列出该个股的上游核心供应商/原材料公司\n3. downstream（下游产业链）：列出该个股的下游核心客户/渠道/应用领域公司',
    },
  ] as const;

  const handleRefresh = async () => {
    refreshConfigs.forEach(({ contextKey }) => setIsRefreshing(contextKey, true));
    try {
      const results = await Promise.allSettled(
        refreshConfigs.map(async ({ moduleName, contextKey, schema, getExtraPrompt }) => {
          const newData = await fetchLatestData(moduleName, schema, getExtraPrompt(), globalModel, customStocks);
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
      case 'review':
        return <DailyReview />;
      case 'finance':
        return <FinanceNews />;
      case 'conflict':
        return <GlobalConflict />;
      case 'forecast':
        return <FutureForecast />;
      default:
        return <DailyReview />;
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
        : activeTab === 'review'
          ? 'dailyReview'
          : activeTab === 'finance'
            ? 'financeNews'
            : activeTab === 'conflict'
              ? 'globalConflict'
              : 'futureForecast';

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
      case 'review':
        return {
          ...baseProps,
          title: '每日复盘',
          subtitle: '趋势预判 · 机会前瞻',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10">
              <Hexagon className="w-3 h-3 text-secondary" />
            </div>
          ),
        };
      case 'finance':
        return {
          ...baseProps,
          title: '财经要闻',
          subtitle: '权威机构 · 利好分析',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10">
              <Pentagon className="w-3 h-3 text-secondary" />
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
      case 'forecast':
        return {
          ...baseProps,
          title: '未来预判',
          subtitle: '宏观推演 · 策略布局',
          icon: (
            <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10">
              <Hexagon className="w-3 h-3 text-secondary" />
            </div>
          ),
        };
      default:
        return {
          ...baseProps,
          title: '每日复盘',
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
              animation: wetaReveal 2.5s infinite;
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
              15%, 80% { opacity: 1; filter: blur(0); transform: translateX(0); text-shadow: 0 0 10px rgba(66, 211, 146, 0.4); }
              100% { opacity: 0; filter: blur(2px); transform: translateX(2px); }
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
                onClick={() => setActiveTab('review')}
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
