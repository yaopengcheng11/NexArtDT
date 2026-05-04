import { Type } from '@google/genai';

export const hotSearchSchema = { /* 保持不变 */ };
export const dailyReviewSchema = { /* 保持不变 */ };
export const announcementAnalysisSchema = { /* 保持不变 */ };
export const financeNewsSchema = { /* 保持不变 */ };

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
            // 💥 核心修改：通过 description 给模型强暗示
            description: "受影响的宏观大宗商品、外汇或全球核心指数（例如：布伦特原油、现货黄金、航运指数、美元指数等），绝对不要填入任何具体的A股个股名称。",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "如：现货黄金" },
                change: { type: Type.STRING, description: "如：+1.5%" },
              },
              required: ["name", "change"]
            }
          },
          opinion: { type: Type.STRING },
          reason: { type: Type.STRING },
          source: { type: Type.STRING },
        },
        required: ["region", "duration", "desc", "analysis", "impacts", "opinion", "reason", "source"]
      }
    }
  },
  required: ["conflicts"]
};

export const futureForecastSchema = { /* 保持不变 */ };