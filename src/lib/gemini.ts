import { postJson } from './api';

// 将 snake_case 转换为 camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function pickFirst(...values: any[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
}

function normalizeSignedValue(value: any) {
  if (value === undefined || value === null || value === '') return '';
  const str = String(value).trim();
  if (!str) return '';
  if (str.startsWith('+') || str.startsWith('-')) return str;
  const numeric = Number(str.replace(/%/g, ''));
  if (!Number.isNaN(numeric) && numeric > 0) return `+${str}`;
  return str;
}

function ensureArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? value : [];
}

function ensureObject(value: any) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

  const market =
    data.marketOverview ||
    data.market_overview ||
    data.市场概览 ||
    data.大盘概览 ||
    data.市场总览 ||
    {};

  const fundFlow =
    data.marketCapital ||
    data.market_capital ||
    data.市场资金情况 ||
    data.资金情况 ||
    {};

  const stockList =
    data.watchlistStocks ||
    data.watchlist_stocks ||
    data.stocks ||
    data.自选股复盘 ||
    data.自选股 ||
    [];

  const announcementList =
    data.announcements ||
    data.announcementAnalysis ||
    data.announcement_analysis ||
    data.公告智能解读 ||
    data.公告解读 ||
    [];

  return {
    marketOverview: {
      indexValue: String(pickFirst(
        market.indexValue,
        market.index_value,
        market.currentIndex,
        market.current_index,
        market.指数点位,
        market.当前点位
      )),
      indexChange: String(normalizeSignedValue(pickFirst(
        market.indexChange,
        market.index_change,
        market.change,
        market.changePercent,
        market.change_percent,
        market.指数涨跌幅,
        market.涨跌幅,
        market.涨跌
      ))),
      summary: String(pickFirst(
        market.summary,
        market.marketSummary,
        market.market_summary,
        market.analysis,
        market.comment,
        market.市场概述,
        market.复盘总结,
        market.总结,
        fundFlow.summary,
        fundFlow.analysis,
        fundFlow.comment,
        fundFlow.资金点评,
        fundFlow.总结
      )),
      volume: String(pickFirst(
        market.volume,
        market.totalVolume,
        market.total_volume,
        market.turnover,
        market.成交额,
        market.两市成交额,
        fundFlow.totalTurnover,
        fundFlow.total_turnover,
        fundFlow.volume,
        fundFlow.两市总成交额,
        fundFlow.总成交额,
        fundFlow.成交额
      )),
      mainFlow: String(normalizeSignedValue(pickFirst(
        market.mainFlow,
        market.main_flow,
        market.mainForce,
        market.main_force,
        market.主力流向,
        market.主力净流入,
        fundFlow.mainFlow,
        fundFlow.main_flow,
        fundFlow.主力流向,
        fundFlow.主力净流入
      ))),
    },
    stocks: stockList.map((s: any) => ({
      name: String(pickFirst(s.name, s.stockName, s.stock_name, s.证券名称, s.股票名称)),
      code: String(pickFirst(s.code, s.stockCode, s.stock_code, s.symbol, s.证券代码, s.股票代码)),
      price: String(pickFirst(s.current, s.currentPrice, s.current_price, s.price, s.最新价, s.现价)),
      change: String(normalizeSignedValue(pickFirst(
        s.changePercent,
        s.change_percent,
        s.change,
        s.percent,
        s.涨跌幅,
        s.涨幅,
        s.涨跌
      ))),
      turnover: String(pickFirst(s.turnoverRate, s.turnover_rate, s.turnover, s.换手率)),
      volume: String(pickFirst(s.volume, s.amount, s.turnoverAmount, s.turnover_amount, s.成交量, s.成交额)),
      opinion: String(pickFirst(s.opinion, s.suggestion, s.advice, s.操作建议, s.建议, '观望')),
      takeProfit: String(pickFirst(s.takeProfit, s.take_profit, s.targetPrice, s.target_price, s.止盈位, s.目标价)),
      stopLoss: String(pickFirst(s.stopLoss, s.stop_loss, s.riskLine, s.risk_line, s.止损位, s.风险位)),
      reason: String(pickFirst(s.reason, s.analysis, s.comment, s.summary, s.理由, s.分析, s.复盘简评)),
    })),
    announcements: announcementList.map((item: any) => ({
      summary: String(pickFirst(item.summary, item.核心归纳, item.总结, item.content)),
      opinion: String(pickFirst(item.opinion, item.观点, item.aiOpinion, item.ai_opinion)),
      reason: String(pickFirst(item.reason, item.理由, item.coreReason, item.core_reason)),
      conclusion: String(pickFirst(item.conclusion, item.结论, item.sentiment, '中性')),
    })),
  };
}

// 转换财经要闻数据结构
function transformFinanceNews(data: any) {
  if (!data) return data;

  const newsList = data.news || data.newsList || data.财经要闻 || data.要闻列表 || [];

  return {
    news: ensureArray(newsList).map((n: any) => ({
      source: String(pickFirst(n.source, n.media, n.publisher, n.来源)),
      time: String(pickFirst(n.time, n.publishTime, n.publish_time, n.时间)),
      title: String(pickFirst(n.title, n.headline, n.标题)),
      desc: String(pickFirst(n.desc, n.summary, n.content, n.摘要, n.内容)),
      goodSectors: String(pickFirst(n.good_sectors, n.goodSectors, n.benefitSectors, n.benefit_sectors, n.利好板块)),
      goodStocks: String(pickFirst(n.good_stocks, n.goodStocks, n.benefitStocks, n.benefit_stocks, n.利好个股)),
      reason: String(pickFirst(n.reason, n.analysis, n.comment, n.理由, n.分析)),
    })),
  };
}

// 转换热搜数据结构
function transformHotSearch(data: any) {
  if (!data) return data;

  const sites = data.sites || data.platforms || data.hot_list || data.hotList || data.热搜平台 || data.平台列表 || [];

  return {
    sites: ensureArray(sites).map((site: any) => ({
      siteName: String(pickFirst(site.site_name, site.siteName, site.name, site.platform, site.平台名称, site.站点名称)),
      items: ensureArray(site.items || site.list || site.hotspots || site.热点列表).map((item: any) => ({
        title: String(pickFirst(item.title, item.keyword, item.name, item.标题, item.热搜词)),
        hotness: String(pickFirst(item.hotness, item.hot_value, item.hotValue, item.hot, item.score, item.热度)),
        desc: String(pickFirst(item.desc, item.description, item.summary, item.摘要, item.描述)),
        analysis: String(pickFirst(item.analysis, item.comment, item.reason, item.分析, item.观点)),
      })),
    })),
  };
}

function transformGlobalConflict(data: any) {
  if (!data) return data;

  const conflicts = data.conflicts || data.events || data.global_conflicts || data.全球冲突进程 || data.冲突列表 || [];

  return {
    conflicts: ensureArray(conflicts).map((conflict: any) => ({
      region: String(pickFirst(conflict.region, conflict.name, conflict.title, conflict.地区, conflict.区域)),
      duration: String(pickFirst(conflict.duration, conflict.phase, conflict.timeRange, conflict.持续时间, conflict.阶段)),
      desc: String(pickFirst(conflict.desc, conflict.summary, conflict.content, conflict.描述, conflict.概述)),
      analysis: String(pickFirst(conflict.analysis, conflict.comment, conflict.judgment, conflict.分析, conflict.判断)),
      impacts: ensureArray(conflict.impacts || conflict.impactList || conflict.影响列表).map((impact: any) => ({
        name: String(pickFirst(impact.name, impact.asset, impact.symbol, impact.名称, impact.资产)),
        change: String(normalizeSignedValue(pickFirst(impact.change, impact.changePercent, impact.change_percent, impact.涨跌幅, impact.变化))),
      })),
      opinion: String(pickFirst(conflict.opinion, conflict.view, conflict.outlook, conflict.观点)),
      reason: String(pickFirst(conflict.reason, conflict.logic, conflict.comment, conflict.理由)),
      source: String(pickFirst(conflict.source, conflict.sources, conflict.reference, conflict.来源)),
    })),
  };
}

// 转换未来预判数据结构
function transformFutureForecast(data: any) {
  if (!data) return data;

  const strategy = ensureObject(data.strategy || data.coreStrategy || data.core_strategy || data.核心策略概览 || data.策略概览);
  const avoidSectors = ensureObject(data.avoidSectors || data.avoid_sectors || data.riskSectors || data.risk_sectors || data.回避板块);

  return {
    period: String(pickFirst(data.period, data.forecastPeriod, data.forecast_period, data.周期, data.预判周期)),
    riskWarning: String(pickFirst(data.risk_warning, data.riskWarning, data.warning, data.风险提示)),
    themes: ensureArray(data.themes || data.hot_themes || data.topicThemes || data.topic_themes || data.热点题材 || data.题材列表).map((t: any) => ({
      tag: String(pickFirst(t.tag, t.label, t.styleTag, t.标签)),
      name: String(pickFirst(t.name, t.theme, t.title, t.题材名称, t.名称)),
      event: String(pickFirst(t.event, t.event_desc, t.catalyst, t.催化事件)),
      judgment: String(pickFirst(t.judgment, t.analysis, t.comment, t.板块判断, t.判断)),
      stock: String(pickFirst(t.stock, t.related_stocks, t.relatedStocks, t.pick, t.推荐个股)),
      holdDays: String(pickFirst(t.hold_days, t.holdDays, t.holdingPeriod, t.holding_period, t.持股天数)),
      buyRange: String(pickFirst(t.buy_range, t.buyRange, t.entryRange, t.entry_range, t.买入区间)),
      target: String(pickFirst(t.target, t.target_price, t.targetPrice, t.止盈目标, t.目标价)),
    })),
    avoidSectors: {
      tags: ensureArray(pickFirst(
        avoidSectors.tags,
        avoidSectors.sectors,
        avoidSectors.names,
        avoidSectors.板块,
        avoidSectors.标签
      )),
      reason: String(pickFirst(avoidSectors.reason, avoidSectors.comment, avoidSectors.analysis, avoidSectors.理由)),
    },
    events: ensureArray(data.events || data.keyEvents || data.key_events || data.重点事件观察 || data.事件列表).map((e: any) => ({
      name: String(pickFirst(e.name, e.event_name, e.title, e.事件名称, e.名称)),
      time: String(pickFirst(e.time, e.event_time, e.date, e.时间)),
    })),
    strategy: {
      position: String(pickFirst(strategy.position, strategy.posture, strategy.总体仓位, strategy.仓位)),
      positionDesc: String(pickFirst(strategy.position_desc, strategy.positionDesc, strategy.description, strategy.仓位说明)),
      attack: String(pickFirst(strategy.attack, strategy.offense, strategy.进攻组合)),
      defense: String(pickFirst(strategy.defense, strategy.guard, strategy.防守组合)),
      view: String(pickFirst(strategy.view, strategy.outlook, strategy.summary, strategy.核心观点, strategy.观点)),
    },
  };
}

export function normalizeModuleData(moduleName: string, data: any) {
  if (!data) return data;

  if (moduleName === '每日复盘' || moduleName === 'dailyReview') {
    return transformDailyReview(data);
  }
  if (moduleName === '财经要闻' || moduleName === 'financeNews') {
    return transformFinanceNews(data);
  }
  if (moduleName === '热搜早知道' || moduleName === 'hotSearch') {
    return transformHotSearch(data);
  }
  if (moduleName === '全球冲突进程' || moduleName === 'globalConflict') {
    return transformGlobalConflict(data);
  }
  if (moduleName === '未来预判' || moduleName === 'futureForecast') {
    return transformFutureForecast(data);
  }

  return convertKeysToCamelCase(data);
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

    return normalizeModuleData(moduleName, result);
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
