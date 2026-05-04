import { postJson } from './api';

export async function fetchLatestData(
  moduleName: string,
  schema: any,
  extraPrompt: string = '',
  model: string = 'gemini',
  customStocks: string[] = [],
) {
  try {
    return await postJson('/api/generate-module', {
      moduleName,
      schema,
      extraPrompt,
      model,
      customStocks,
    });
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
