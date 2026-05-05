import { postJson } from './api';

// 将 snake_case 转换为 camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = convertKeysToCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

// 转换每日复盘数据结构
function transformDailyReview(data: any) {
  if (!data) return data;
  
  return {
    marketOverview: {
      indexValue: data.market_overview?.index_value || '',
      indexChange: data.market_overview?.index_change || '',
      summary: data.market_overview?.summary || '',
      volume: data.market_overview?.volume || data.market_overview?.total_volume || '',
      mainFlow: data.market_overview?.main_flow || '',
    },
    stocks: (data.watchlist_stocks || data.stocks || []).map((s: any) => ({
      name: s.name || '',
      code: s.code || '',
      price: s.current || s.price || '',
      change: s.change !== undefined ? (s.change > 0 ? `+${s.change}` : `${s.change}`) : '',
      changePercent: s.change_percent || '',
      turnover: s.turnover_rate || s.turnover || '',
      volume: s.volume || '',
      opinion: s.opinion || '观望',
      takeProfit: s.take_profit || s.takeProfit || '',
      stopLoss: s.stop_loss || s.stopLoss || '',
      reason: s.reason || '',
    })),
    announcements: data.announcements || [],
  };
}

// 转换财经要闻数据结构
function transformFinanceNews(data: any) {
  if (!data) return data;
  
  return {
    news: (data.news || []).map((n: any) => ({
      source: n.source || '',
      time: n.time || '',
      title: n.title || n.headline || '',
      desc: n.desc || n.summary || n.content || '',
      goodSectors: n.good_sectors || n.goodSectors || '',
      goodStocks: n.good_stocks || n.goodStocks || '',
      reason: n.reason || '',
    })),
  };
}

// 转换热搜数据结构
function transformHotSearch(data: any) {
  if (!data) return data;
  
  return {
    sites: (data.sites || []).map((site: any) => ({
      siteName: site.site_name || site.siteName || site.name || '',
      items: (site.items || []).map((item: any) => ({
        title: item.title || '',
        hotness: item.hotness || item.hot_value || item.hot || '',
        desc: item.desc || item.description || '',
        analysis: item.analysis || '',
      })),
    })),
  };
}

// 转换未来预判数据结构
function transformFutureForecast(data: any) {
  if (!data) return data;
  
  return {
    period: data.period || '',
    riskWarning: data.risk_warning || data.riskWarning || '',
    themes: (data.themes || data.hot_themes || []).map((t: any) => ({
      tag: t.tag || '',
      name: t.name || t.event_name || '',
      event: t.event || t.event_desc || '',
      judgment: t.judgment || t.analysis || '',
      stock: t.stock || t.related_stocks || '',
      holdDays: t.hold_days || t.holdDays || '',
      buyRange: t.buy_range || t.buyRange || '',
      target: t.target || t.target_price || '',
    })),
    avoidSectors: {
      tags: data.avoid_sectors?.tags || data.avoidSectors?.tags || [],
      reason: data.avoid_sectors?.reason || data.avoidSectors?.reason || '',
    },
    events: (data.events || []).map((e: any) => ({
      name: e.name || e.event_name || '',
      time: e.time || e.event_time || '',
    })),
    strategy: {
      position: data.strategy?.position || data.strategy?.posture || '',
      positionDesc: data.strategy?.position_desc || data.strategy?.positionDesc || '',
      attack: data.strategy?.attack || '',
      defense: data.strategy?.defense || '',
      view: data.strategy?.view || data.strategy?.outlook || '',
    },
  };
}

export async function fetchLatestData(
  moduleName: string,
  schema: any,
  extraPrompt: string = '',
  model: string = 'gemini',
  customStocks: string[] = [],
) {
  try {
    const result = await postJson('/api/generate-module', {
      moduleName,
      schema,
      extraPrompt,
      model,
      customStocks,
    });
    
    // 根据模块类型转换数据结构
    if (moduleName === '每日复盘' || moduleName === 'dailyReview') {
      return transformDailyReview(result);
    } else if (moduleName === '财经要闻' || moduleName === 'financeNews') {
      return transformFinanceNews(result);
    } else if (moduleName === '热搜早知道' || moduleName === 'hotSearch') {
      return transformHotSearch(result);
    } else if (moduleName === '未来预判' || moduleName === 'futureForecast') {
      return transformFutureForecast(result);
    }
    
    // 默认进行 camelCase 转换
    return convertKeysToCamelCase(result);
  } catch (error) {
    console.error(`Failed to fetch latest data for ${moduleName}:`, error);
    throw error;
  }
}

export async function chatWithAI(
  message: string,
  contextData: any,
  history: { role: string; text: string }[],
  model: string = 'gemini',
  customStocks: string[] = [],
) {
  try {
    const data = await postJson<{ text: string }>('/api/chat', {
      message,
      contextData,
      history,
      model,
      customStocks,
    });

    return data.text;
  } catch (error: any) {
    console.error('Chat failed:', error);
    return `抱歉，AI 功能当前不可用：${error.message || '请稍后再试'}`;
  }
}

export async function analyzeAnnouncementPDF(
  base64Data: string,
  mimeType: string,
  schema: any,
  model: string = 'gemini',
) {
  try {
    return await postJson('/api/analyze-pdf', {
      base64Data,
      mimeType,
      schema,
      model,
    });
  } catch (error) {
    console.error('Failed to analyze PDF:', error);
    throw error;
  }
}
