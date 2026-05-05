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
                link: { type: Type.STRING, description: '该热搜内容的原始链接URL' },
                perspectives: {
                  type: Type.ARRAY,
                  description: '从三个不同角色视角给出的观点分析',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      role: { type: Type.STRING, description: '视角角色名称，如：黑粉视角、狂热粉丝视角、客观官方视角' },
                      view: { type: Type.STRING, description: '该角色的具体观点和分析' },
                    },
                    required: ['role', 'view'],
                  },
                },
              },
              required: ['title', 'hotness', 'desc', 'link', 'perspectives'],
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
          link: { type: Type.STRING, description: '该新闻的原始链接URL' },
          goodSectors: { type: Type.STRING },
          goodStocks: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['source', 'time', 'title', 'desc', 'link', 'goodSectors', 'goodStocks', 'reason'],
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
          sideA: {
            type: Type.OBJECT,
            description: '冲突甲方的立场和理由',
            properties: {
              name: { type: Type.STRING, description: '甲方（一方）的名称' },
              opinion: { type: Type.STRING, description: '甲方的立场和观点' },
              reason: { type: Type.STRING, description: '甲方的理由和论据' },
            },
            required: ['name', 'opinion', 'reason'],
          },
          sideB: {
            type: Type.OBJECT,
            description: '冲突乙方的立场和理由',
            properties: {
              name: { type: Type.STRING, description: '乙方（另一方）的名称' },
              opinion: { type: Type.STRING, description: '乙方的立场和观点' },
              reason: { type: Type.STRING, description: '乙方的理由和论据' },
            },
            required: ['name', 'opinion', 'reason'],
          },
          analysis: { type: Type.STRING, description: '从第三方客观视角对事件的分析和评论' },
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
        required: ['region', 'duration', 'desc', 'sideA', 'sideB', 'analysis', 'impacts', 'source'],
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
          reason: { type: Type.STRING, description: '推荐该个股的核心理由和投资逻辑' },
          upstream: { type: Type.STRING, description: '该个股的上游产业和核心供应商/原材料公司' },
          downstream: { type: Type.STRING, description: '该个股的下游产业和核心客户/渠道公司' },
          holdDays: { type: Type.STRING },
          buyRange: { type: Type.STRING },
          target: { type: Type.STRING },
        },
        required: ['tag', 'name', 'event', 'judgment', 'stock', 'reason', 'upstream', 'downstream', 'holdDays', 'buyRange', 'target'],
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
