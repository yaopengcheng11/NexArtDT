import { Type } from '@google/genai';

export const hotSearchSchema = {
  type: Type.OBJECT,
  properties: {
    sites: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          siteName: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                hotness: { type: Type.STRING },
                desc: { type: Type.STRING },
                analysis: { type: Type.STRING },
              },
              required: ['title', 'hotness', 'desc', 'analysis'],
            },
          },
        },
        required: ['siteName', 'items'],
      },
    },
  },
  required: ['sites'],
};

export const dailyReviewSchema = {
  type: Type.OBJECT,
  properties: {
    marketOverview: {
      type: Type.OBJECT,
      properties: {
        indexValue: { type: Type.STRING },
        indexChange: { type: Type.STRING },
        summary: { type: Type.STRING },
        volume: { type: Type.STRING },
        mainFlow: { type: Type.STRING },
      },
      required: ['indexValue', 'indexChange', 'summary', 'volume', 'mainFlow'],
    },
    stocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          code: { type: Type.STRING },
          price: { type: Type.STRING },
          change: { type: Type.STRING },
          turnover: { type: Type.STRING },
          volume: { type: Type.STRING },
          opinion: { type: Type.STRING },
          takeProfit: { type: Type.STRING },
          stopLoss: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['name', 'code', 'price', 'change', 'turnover', 'volume', 'opinion', 'takeProfit', 'stopLoss', 'reason'],
      },
    },
    announcements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          opinion: { type: Type.STRING },
          reason: { type: Type.STRING },
          conclusion: { type: Type.STRING },
        },
        required: ['summary', 'opinion', 'reason', 'conclusion'],
      },
    },
  },
  required: ['marketOverview', 'stocks', 'announcements'],
};

export const announcementAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    opinion: { type: Type.STRING },
    reason: { type: Type.STRING },
    conclusion: { type: Type.STRING, description: '只能返回 利好、利空、Neutral、Bullish、Bearish 或 中性 之一。' },
  },
  required: ['summary', 'opinion', 'reason', 'conclusion'],
};

export const financeNewsSchema = {
  type: Type.OBJECT,
  properties: {
    news: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          time: { type: Type.STRING },
          title: { type: Type.STRING },
          desc: { type: Type.STRING },
          goodSectors: { type: Type.STRING },
          goodStocks: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['source', 'time', 'title', 'desc', 'goodSectors', 'goodStocks', 'reason'],
      },
    },
  },
  required: ['news'],
};

export const globalConflictSchema = {
  type: Type.OBJECT,
  properties: {
    conflicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          region: { type: Type.STRING },
          duration: { type: Type.STRING },
          desc: { type: Type.STRING },
          analysis: { type: Type.STRING },
          impacts: {
            type: Type.ARRAY,
            description: '受影响的宏观大宗商品、外汇或全球核心指数（例如：布伦特原油、现货黄金、航运指数、美元指数等），绝对不要填入任何具体的A股个股名称。',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: '如：现货黄金' },
                change: { type: Type.STRING, description: '如：+1.5%' },
              },
              required: ['name', 'change'],
            },
          },
          opinion: { type: Type.STRING },
          reason: { type: Type.STRING },
          source: { type: Type.STRING },
        },
        required: ['region', 'duration', 'desc', 'analysis', 'impacts', 'opinion', 'reason', 'source'],
      },
    },
  },
  required: ['conflicts'],
};

export const futureForecastSchema = {
  type: Type.OBJECT,
  properties: {
    period: { type: Type.STRING },
    riskWarning: { type: Type.STRING },
    themes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tag: { type: Type.STRING },
          name: { type: Type.STRING },
          event: { type: Type.STRING },
          judgment: { type: Type.STRING },
          stock: { type: Type.STRING },
          holdDays: { type: Type.STRING },
          buyRange: { type: Type.STRING },
          target: { type: Type.STRING },
        },
        required: ['tag', 'name', 'event', 'judgment', 'stock', 'holdDays', 'buyRange', 'target'],
      },
    },
    avoidSectors: {
      type: Type.OBJECT,
      properties: {
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        reason: { type: Type.STRING },
      },
      required: ['tags', 'reason'],
    },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          time: { type: Type.STRING },
        },
        required: ['name', 'time'],
      },
    },
    strategy: {
      type: Type.OBJECT,
      properties: {
        position: { type: Type.STRING },
        positionDesc: { type: Type.STRING },
        attack: { type: Type.STRING },
        defense: { type: Type.STRING },
        view: { type: Type.STRING },
      },
      required: ['position', 'positionDesc', 'attack', 'defense', 'view'],
    },
  },
  required: ['period', 'riskWarning', 'themes', 'avoidSectors', 'events', 'strategy'],
};
