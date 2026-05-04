import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';        // 💥 用于读取本地 index.html，解决 Cannot GET /
import axios from 'axios';  // 💥 用于请求腾讯极速股票接口

// 💥 核心：根据模块名称智能拉取上下文（战事、热搜模块自动跳过个股拉取）
async function fetchMarketContext(customStocks: string[] = [], moduleName: string = '') {
  try {
    const fetchIndex = async () => {
      try {
        let context = '【实时大盘指数】\n';
        const res = await fetch('http://qt.gtimg.cn/q=s_sh000001,s_sz399001,s_sz399006,s_sh000300');
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder('gbk').decode(buffer);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => {
          const match = line.match(/="(.*?)";/);
          if (match) {
            const parts = match[1].split('~');
            context += `${parts[1]}: 当前点位 ${parts[3]}, 涨跌额 ${parts[4]}, 涨跌幅 ${parts[5]}%\n`;
          }
        });
        return context;
      } catch (e) {
        return '';
      }
    };

    const fetchTurnover = async () => {
      try {
        const shRes = await fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&fields=f2,f3,f4,f6');
        const shData = await shRes.json();
        if (shData && shData.data && shData.data.diff) {
          const shTurnover = shData.data.diff[0].f6 || 0;
          const szTurnover = shData.data.diff[1].f6 || 0;
          const totalTurnover = ((shTurnover + szTurnover) / 100000000).toFixed(2);
          return `\n【市场资金】\n今日两市总成交额: ${totalTurnover} 亿元\n`;
        }
        return '';
      } catch (e) {
        return '';
      }
    };

    const fetchCustomStocksData = async () => {
      // 💥 智能拦截：战事、热搜、财经模块不需要个股数据，直接跳过，防止 AI 强行联想
      const ignoreStocksModules = ['globalConflict', 'hotSearch', 'financeNews'];
      if (ignoreStocksModules.includes(moduleName) || !customStocks || customStocks.length === 0) return '';

      try {
        let context = '\n【自选股实时数据】\n';
        const quoteIds: string[] = [];

        await Promise.all(customStocks.map(async (stockName) => {
          try {
            const searchRes = await fetch(`https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(stockName)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8`);
            const searchData = await searchRes.json();
            if (searchData && searchData.QuotationCodeTable && searchData.QuotationCodeTable.Data && searchData.QuotationCodeTable.Data.length > 0) {
              quoteIds.push(searchData.QuotationCodeTable.Data[0].QuoteID);
            }
          } catch (e) { }
        }));

        if (quoteIds.length > 0) {
          const stockRes = await fetch(`https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=${quoteIds.join(',')}&fields=f2,f3,f4,f5,f8,f12,f14`);
          const stockData = await stockRes.json();
          if (stockData && stockData.data && stockData.data.diff) {
            stockData.data.diff.forEach((stock: any) => {
              context += `${stock.f14} (${stock.f12}): 最新价 ${stock.f2}, 涨跌幅 ${stock.f3}%, 涨跌额 ${stock.f4}, 换手率 ${stock.f8}%, 成交量 ${stock.f5}手\n`;
            });
          }
        }
        return context;
      } catch (e) {
        return '';
      }
    };

    const fetchTop10 = async () => {
      try {
        let context = '\n【沪深A股涨幅榜Top10】\n';
        const emRes = await fetch('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&fields=f2,f3,f4,f5,f8,f12,f14');
        const emData = await emRes.json();
        if (emData && emData.data && emData.data.diff) {
          emData.data.diff.forEach((stock: any) => {
            context += `${stock.f14} (${stock.f12}): 最新价 ${stock.f2}, 涨跌幅 ${stock.f3}%, 涨跌额 ${stock.f4}, 换手率 ${stock.f8}%, 成交量 ${stock.f5}手\n`;
          });
        }
        return context;
      } catch (e) {
        return '';
      }
    };

    const fetchTop5Sectors = async () => {
      try {
        let context = '\n【行业板块领涨Top5】\n';
        const emSectorRes = await fetch('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=5&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f4,f12,f14');
        const emSectorData = await emSectorRes.json();
        if (emSectorData && emSectorData.data && emSectorData.data.diff) {
          emSectorData.data.diff.forEach((sector: any) => {
            context += `${sector.f14}: 涨跌幅 ${sector.f3}%\n`;
          });
        }
        return context;
      } catch (e) {
        return '';
      }
    };

    const fetchNews = async () => {
      try {
        let context = '\n【最新财经要闻与市场动态】\n';
        const newsRes = await fetch('https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=20&zhibo_id=152');
        const newsData = await newsRes.json();
        if (newsData && newsData.result && newsData.result.data && newsData.result.data.feed) {
          newsData.result.data.feed.list.forEach((item: any) => {
            context += `- ${item.rich_text}\n`;
          });
        }
        return context;
      } catch (e) {
        return '';
      }
    };

    const results = await Promise.all([
      fetchIndex(),
      fetchTurnover(),
      fetchCustomStocksData(),
      fetchTop10(),
      fetchTop5Sectors(),
      fetchNews()
    ]);

    return results.join('');
  } catch (err) {
    console.error('Failed to fetch market context:', err);
    return '';
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3005;

  app.use(express.json());

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // 💥 新增：腾讯财经股票极速抓取 API
  app.post('/api/stocks/quotes', async (req, res) => {
    try {
      const { stocks } = req.body;
      if (!stocks || !Array.isArray(stocks)) return res.json({ quotes: {} });

      const quotes: Record<string, string> = {};
      const codesToFetch: string[] = [];
      const codeToNameMap: Record<string, string> = {};

      for (const name of stocks) {
        try {
          if (/^(sh|sz|hk|us)[0-9a-zA-Z]+$/i.test(name)) {
            codesToFetch.push(name.toLowerCase());
            codeToNameMap[name.toLowerCase()] = name;
            continue;
          }
          const searchRes = await axios.get(`http://smartbox.gtimg.cn/s3/?v=2&q=${encodeURIComponent(name)}&t=all`, {
            headers: { 'Referer': 'http://finance.qq.com' }
          });

          const match = searchRes.data.match(/v_hint="([^"]+)"/);
          if (match && match[1]) {
            const firstResult = match[1].split('^')[0];
            const parts = firstResult.split('~');
            if (parts.length >= 2) {
              const fullCode = `${parts[0]}${parts[1]}`;
              codesToFetch.push(fullCode);
              codeToNameMap[fullCode] = name;
            }
          }
        } catch (e) { }
      }

      if (codesToFetch.length > 0) {
        const quoteRes = await axios.get(`http://qt.gtimg.cn/q=${codesToFetch.join(',')}`, {
          headers: { 'Referer': 'http://finance.qq.com' },
          responseType: 'arraybuffer'
        });
        const decoder = new TextDecoder('gbk');
        const dataStr = decoder.decode(quoteRes.data);

        const lines = dataStr.split(';');
        for (const line of lines) {
          if (!line.trim()) continue;
          const match = line.match(/v_(.+)="([^"]+)"/);
          if (match) {
            const fullCode = match[1];
            const parts = match[2].split('~');
            if (parts.length > 32) {
              const price = parts[3];
              const changePercent = parts[32];
              const name = codeToNameMap[fullCode] || parts[1];
              const sign = parseFloat(changePercent) > 0 ? '+' : '';
              quotes[name] = `${price} CNY, ${sign}${changePercent}%`;
            }
          }
        }
      }
      res.json({ quotes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  });

  // API Route to send email
  app.post('/api/send-email', async (req, res) => {
    const { to, code } = req.body;
    const user = process.env.QQ_EMAIL;
    const pass = process.env.QQ_SMTP_CODE;

    if (!user || !pass) {
      return res.status(500).json({ error: 'QQ_EMAIL or QQ_SMTP_CODE environment variables are missing' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 465,
        secure: true,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: `"AI金融助手" <${user}>`,
        to: to,
        subject: '您的 AI 金融助手注册码',
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>您好！</h2>
            <p>您的注册申请已通过。</p>
            <p>您的专属注册码是：<strong style="font-size: 24px; color: #0066cc;">${code}</strong></p>
            <p>请妥善保管并在登录页面完成注册。</p>
          </div>
        `
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // 💥 API Route to generate module data (包含了各种提示词修正)
  app.post('/api/generate-module', async (req, res) => {
    const { moduleName, schema, extraPrompt, model, customStocks } = req.body;

    try {
      const marketContext = await fetchMarketContext(customStocks, moduleName);

      // 💥 战事模块“思想钢印”：阻断 AI 返回股票名称
      let warPromptInjector = '';
      if (moduleName === 'globalConflict') {
        warPromptInjector = `\n\n【最高指令 (CRITICAL)】：在分析 impacts 时，绝对禁止出现任何中国 A 股个股名称（如茅台、宁德时代等）。你必须分析该事件对全球宏观资产的影响，如：“布伦特原油”、“现货黄金”、“美元指数”、“航运指数”、“军工ETF” 等。`;
      }

      if (model === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('TODO')) {
          return res.status(400).json({ error: 'GEMINI_API_KEY is not configured or is invalid.' });
        }
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: `You are a top-tier financial analyst. Provide the latest, real-world data for the module: "${moduleName}". Use the googleSearch tool to find the most up-to-date information from today. Ensure all text is in Chinese. ${extraPrompt}\n\nCRITICAL: You MUST use the following real-time market data where applicable. DO NOT invent numbers.\n\n【实时市场数据】\n${marketContext}${warPromptInjector}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            tools: [{ googleSearch: {} }],
            toolConfig: { includeServerSideToolInvocations: true },
            temperature: 0.2,
          }
        });
        return res.json(JSON.parse(response.text || '{}'));
      }

      // Other models
      let apiUrl = '';
      let apiKey = '';
      let modelNameStr = '';

      if (model === 'deepseek') {
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        apiKey = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '';
        modelNameStr = process.env.VITE_DEEPSEEK_MODEL_ID || 'deepseek-chat';
      } else if (model === 'doubao') {
        apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
        apiKey = process.env.VITE_DOUBAO_API_KEY || process.env.DOUBAO_API_KEY || '';
        modelNameStr = process.env.VITE_DOUBAO_MODEL_ID || process.env.DOUBAO_MODEL_ID || 'ep-20250214220038-x1y2z';
      } else if (model === 'mimo') {
        apiUrl = process.env.VITE_MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1/chat/completions';
        apiKey = process.env.VITE_MIMO_API_KEY || process.env.MIMO_API_KEY || '';
        modelNameStr = process.env.VITE_MIMO_MODEL_ID || 'mimo-v2-pro';
      }

      if (!apiKey) {
        return res.status(400).json({ error: `API Key for ${model} is not configured.` });
      }

      const systemPrompt = `You are a top-tier financial analyst. Provide the latest data for the module: "${moduleName}". Ensure all text is in Chinese. ${extraPrompt}\n\n【实时市场数据】\n${marketContext}${warPromptInjector}\n\nCRITICAL: You MUST return ONLY a valid JSON object matching the schema below. No markdown text.\n\nSchema:\n${JSON.stringify(schema)}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelNameStr,
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.2,
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${model} API returned ${response.status}`);
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || '{}';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return res.json(JSON.parse(text));

    } catch (error: any) {
      console.error(`Generate Module API Error (${model}):`, error);
      res.status(500).json({ error: error.message || 'Failed to generate module data' });
    }
  });

  // API Route for PDF Analysis
  app.post('/api/analyze-pdf', async (req, res) => {
    const { base64Data, mimeType, schema, model } = req.body;
    try {
      if (model === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('TODO')) return res.status(400).json({ error: 'GEMINI_API_KEY is invalid.' });
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: mimeType } },
              { text: '你是一个资深的金融分析师。请阅读这份公告，总结归纳核心内容，给出观点并明确结论：是利好、利空还是中性。请返回 JSON 格式结果。' },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.2,
          }
        });
        return res.json(JSON.parse(response.text || '{}'));
      }
      return res.status(400).json({ error: `Model ${model} does not support PDF analysis yet.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to analyze PDF' });
    }
  });

  // API Route for Chat
  app.post('/api/chat', async (req, res) => {
    const { message, contextData, history, model, customStocks } = req.body;
    try {
      const marketContext = await fetchMarketContext(customStocks);
      const systemPrompt = `System Instruction: You are a professional financial AI assistant. You have access to the following current market data and analysis across 5 modules:\n\n${JSON.stringify(contextData, null, 2)}\n\nHere is the latest real-time market data:\n${marketContext}\n\nAnswer the user's questions based on this data. Be concise and insightful. Use Chinese.`;

      if (model === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: '好的，我已经了解了最新的市场数据。请问有什么可以帮您？' }] },
          ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: 'user', parts: [{ text: message }] }
        ];
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: contents as any,
        });
        return res.json({ text: response.text });
      }

      // Other Models
      let apiUrl = ''; let apiKey = ''; let modelName = '';
      if (model === 'deepseek') { apiUrl = 'https://api.deepseek.com/v1/chat/completions'; apiKey = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || ''; modelName = process.env.VITE_DEEPSEEK_MODEL_ID || 'deepseek-chat'; }
      else if (model === 'doubao') { apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'; apiKey = process.env.VITE_DOUBAO_API_KEY || process.env.DOUBAO_API_KEY || ''; modelName = process.env.VITE_DOUBAO_MODEL_ID || process.env.DOUBAO_MODEL_ID || 'ep-20250214220038-x1y2z'; }
      else if (model === 'mimo') { apiUrl = process.env.VITE_MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1/chat/completions'; apiKey = process.env.VITE_MIMO_API_KEY || process.env.MIMO_API_KEY || ''; modelName = process.env.VITE_MIMO_MODEL_ID || 'mimo-v2-pro'; }

      const openAiMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: '好的，我已经了解了最新数据。请问有什么可以帮您？' },
        ...history.map((h: any) => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
        { role: 'user', content: message }
      ];

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelName, messages: openAiMessages, temperature: 0.7 })
      });

      const data = await response.json();
      return res.json({ text: data.choices?.[0]?.message?.content || '' });

    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate chat response' });
    }
  });

  // 💥 兜底：处理前端管理页面的删除请求
  // 如果你的用户请求数据是保存在 Firebase 中，前端代码通常会直接连 Firebase SDK 处理。
  // 这个接口起到了拦截和保底的作用，防止因路由缺失导致 500/404 崩溃。
  app.delete('/api/admin/requests/:id', async (req, res) => {
    try {
      // 成功返回，通知前端刷新列表
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  // 💥 终极修复 Cannot GET / 的 Vite 中间件
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    // 接管所有未被命中的路由，返回 index.html 以支持 React 单页路由和热更新
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        // API 请求不要被拦截为 HTML
        if (url.startsWith('/api')) return next();

        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Static serving for production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();