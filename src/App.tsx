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

  const handleRefresh = async () => {
    let moduleName = '';
    let schema: object | null = null;
    let contextKey = '';
    let extraPrompt = '';

    switch (activeTab) {
      case 'hot':
        moduleName = '热搜早知道';
        schema = hotSearchSchema;
        contextKey = 'hotSearch';
        extraPrompt = `请获取以下网站的热搜数据：${customSites.join(', ')}。每个网站至少提供 5 条热点内容。${
          customTopics.length > 0 ? `用户特别关注以下话题：${customTopics.join(', ')}，请尽量包含相关内容。` : ''
        }`;
        break;
      case 'review':
        moduleName = '每日复盘';
        schema = dailyReviewSchema;
        contextKey = 'dailyReview';
        extraPrompt = `请重点复盘以下自选股：${customStocks.join(', ')}。`;
        break;
      case 'finance':
        moduleName = '财经要闻';
        schema = financeNewsSchema;
        contextKey = 'financeNews';
        break;
      case 'conflict':
        moduleName = '全球冲突进程';
        schema = globalConflictSchema;
        contextKey = 'globalConflict';
        break;
      case 'forecast':
        moduleName = '未来预判';
        schema = futureForecastSchema;
        contextKey = 'futureForecast';
        break;
      default:
        return;
    }

    if (!moduleName || !schema) return;

    setIsRefreshing(contextKey, true);
    try {
      const newData = await fetchLatestData(moduleName, schema, extraPrompt, globalModel, customStocks);
      updateData(contextKey, newData);
    } catch (error) {
      console.error('Refresh failed', error);
      alert('更新失败，请稍后再试');
    } finally {
      setIsRefreshing(contextKey, false);
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