import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { normalizeModuleData } from '../lib/gemini';

export interface HotSearchData { sites: { siteName: string; items: { title: string; hotness: string; link: string; desc: string; perspectives: { role: string; view: string }[]; }[]; }[]; }
export interface AnnouncementAnalysis { summary: string; opinion: string; reason: string; conclusion: string; }
export interface DailyReviewData { marketOverview: { indexValue: string; indexChange: string; summary: string; volume: string; mainFlow: string; }; stocks: { name: string; code: string; price: string; change: string; turnover: string; volume: string; opinion: string; takeProfit: string; stopLoss: string; reason: string; }[]; announcements: AnnouncementAnalysis[]; }
export interface FinanceNewsData { news: { source: string; time: string; title: string; link: string; desc: string; goodSectors: string; goodStocks: string; reason: string; }[]; }
export interface GlobalConflictData { conflicts: { region: string; duration: string; desc: string; sideA: { name: string; opinion: string; reason: string; }; sideB: { name: string; opinion: string; reason: string; }; analysis: string; impacts: { name: string; change: string; }[]; source: string; }[]; }
export interface FutureForecastData { period: string; riskWarning: string; themes: { tag: string; name: string; event: string; judgment: string; stock: string; stockName: string; reason: string; upstream: string; downstream: string; holdDays: string; buyRange: string; target: string; }[]; avoidSectors: { tags: string[]; reason: string; }; events: { name: string; time: string; }[]; strategy: { position: string; positionDesc: string; attack: string; defense: string; view: string; }; }

interface DataContextType {
  hotSearch: HotSearchData; dailyReview: DailyReviewData; financeNews: FinanceNewsData; globalConflict: GlobalConflictData; futureForecast: FutureForecastData;
  updateData: (module: string, data: any) => void;
  isRefreshing: Record<string, boolean>; setIsRefreshing: (module: string, isRefreshing: boolean) => void;
  getAllData: () => any; lastUpdated: Record<string, string>;
  customStocks: string[]; setCustomStocks: (stocks: string[]) => void;
  customSites: string[]; setCustomSites: (sites: string[]) => void;
  customTopics: string[]; setCustomTopics: (topics: string[]) => void;
  globalModel: string; setGlobalModel: (model: string) => void;
}

// 原始占位数据略（保持你原来的 initialData 不变，只是作为 fallback）
const initialHotSearch: HotSearchData = { sites: [{ siteName: "新浪微博", items: [{ title: "全球半导体出口限制引发供应链波动", hotness: "4.2亿", link: "", desc: "...", perspectives: [{ role: "综合视角", view: "..." }] }] }] };
const initialDailyReview: DailyReviewData = { marketOverview: { indexValue: "3,278.45", indexChange: "+1.24%", summary: "...", volume: "8,421亿", mainFlow: "+245亿" }, stocks: [], announcements: [] };
const initialFinanceNews: FinanceNewsData = { news: [] };
const initialGlobalConflict: GlobalConflictData = { conflicts: [] };
const initialFutureForecast: FutureForecastData = { period: "中期趋势预判", riskWarning: "...", themes: [], avoidSectors: { tags: [], reason: "" }, events: [], strategy: { position: "", positionDesc: "", attack: "", defense: "", view: "" } };

const DataContext = createContext<DataContextType | undefined>(undefined);

// 💥 核心修改：封装本地读取逻辑
const getLocalData = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;

    const parsed = JSON.parse(item);
    switch (key) {
      case 'dt_hotSearch':
        return normalizeModuleData('hotSearch', parsed);
      case 'dt_dailyReview':
        return normalizeModuleData('dailyReview', parsed);
      case 'dt_financeNews':
        return normalizeModuleData('financeNews', parsed);
      case 'dt_globalConflict':
        return normalizeModuleData('globalConflict', parsed);
      case 'dt_futureForecast':
        return normalizeModuleData('futureForecast', parsed);
      default:
        return parsed;
    }
  } catch {
    return fallback;
  }
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // 💥 核心修改：优先从 LocalStorage 加载数据，拒绝默认假数据
  const [hotSearch, setHotSearch] = useState<HotSearchData>(() => getLocalData('dt_hotSearch', initialHotSearch));
  const [dailyReview, setDailyReview] = useState<DailyReviewData>(() => getLocalData('dt_dailyReview', initialDailyReview));
  const [financeNews, setFinanceNews] = useState<FinanceNewsData>(() => getLocalData('dt_financeNews', initialFinanceNews));
  const [globalConflict, setGlobalConflict] = useState<GlobalConflictData>(() => getLocalData('dt_globalConflict', initialGlobalConflict));
  const [futureForecast, setFutureForecast] = useState<FutureForecastData>(() => getLocalData('dt_futureForecast', initialFutureForecast));

  const [isRefreshing, setIsRefreshingState] = useState<Record<string, boolean>>({});

  // 💥 核心修改：偏好设置同样优先读取本地缓存
  const [customStocks, setCustomStocksState] = useState<string[]>(() => getLocalData('dt_customStocks', ['贵州茅台', '宁德时代', '比亚迪']));
  const [customSites, setCustomSitesState] = useState<string[]>(() => getLocalData('dt_customSites', ['bilibili', '知乎', '新浪微博']));
  const [customTopics, setCustomTopicsState] = useState<string[]>(() => getLocalData('dt_customTopics', []));
  const [globalModel, setGlobalModel] = useState<string>(() => localStorage.getItem('ai_model') || 'gemini');

  useEffect(() => {
    if (user) {
      const loadPreferences = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // 同步 Firestore 到 State 和 LocalStorage
            if (data.customStocks) { setCustomStocksState(data.customStocks); localStorage.setItem('dt_customStocks', JSON.stringify(data.customStocks)); }
            if (data.customSites) { setCustomSitesState(data.customSites); localStorage.setItem('dt_customSites', JSON.stringify(data.customSites)); }
            if (data.customTopics) { setCustomTopicsState(data.customTopics); localStorage.setItem('dt_customTopics', JSON.stringify(data.customTopics)); }
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      };
      loadPreferences();
    }
  }, [user]);

  const savePreferences = async (updates: any) => {
    // 💥 核心修改：立即保存到本地，避免刷新丢失
    if (updates.customStocks) localStorage.setItem('dt_customStocks', JSON.stringify(updates.customStocks));
    if (updates.customSites) localStorage.setItem('dt_customSites', JSON.stringify(updates.customSites));
    if (updates.customTopics) localStorage.setItem('dt_customTopics', JSON.stringify(updates.customTopics));

    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, updates).catch(async (error) => {
        if (error.code === 'not-found') {
          await setDoc(docRef, updates, { merge: true });
        } else throw error;
      });
    } catch (error) { console.error('Failed to save user preferences:', error); }
  };

  const setCustomStocks = (stocks: string[]) => { setCustomStocksState(stocks); savePreferences({ customStocks: stocks }); };
  const setCustomSites = (sites: string[]) => { setCustomSitesState(sites); savePreferences({ customSites: sites }); };
  const setCustomTopics = (topics: string[]) => { setCustomTopicsState(topics); savePreferences({ customTopics: topics }); };

  const [lastUpdated, setLastUpdated] = useState<Record<string, string>>(() => getLocalData('dt_lastUpdated', {}));

  const updateData = (module: string, data: any) => {
    const normalizedData = normalizeModuleData(module, data);
    const updateTime = new Date();
    const formattedTime = `${updateTime.getFullYear()}年${updateTime.getMonth() + 1}月${updateTime.getDate()}日 ${String(updateTime.getHours()).padStart(2, '0')}:${String(updateTime.getMinutes()).padStart(2, '0')}:${String(updateTime.getSeconds()).padStart(2, '0')}`;

    // 💥 核心修改：生成完毕后，立刻存入 LocalStorage 进行固化
    localStorage.setItem(`dt_${module}`, JSON.stringify(normalizedData));

    setLastUpdated(prev => {
      const newTimes = { ...prev, [module]: formattedTime };
      localStorage.setItem('dt_lastUpdated', JSON.stringify(newTimes));
      return newTimes;
    });

    switch (module) {
      case 'hotSearch': setHotSearch(normalizedData); break;
      case 'dailyReview': setDailyReview(normalizedData); break;
      case 'financeNews': setFinanceNews(normalizedData); break;
      case 'globalConflict': setGlobalConflict(normalizedData); break;
      case 'futureForecast': setFutureForecast(normalizedData); break;
    }
  };

  const setIsRefreshing = (module: string, refreshing: boolean) => { setIsRefreshingState(prev => ({ ...prev, [module]: refreshing })); };
  const getAllData = () => ({ hotSearch, dailyReview, financeNews, globalConflict, futureForecast });

  return (
    <DataContext.Provider value={{
      hotSearch, dailyReview, financeNews, globalConflict, futureForecast,
      updateData, isRefreshing, setIsRefreshing, getAllData, lastUpdated,
      customStocks, setCustomStocks, customSites, setCustomSites, customTopics, setCustomTopics, globalModel, setGlobalModel
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
}
