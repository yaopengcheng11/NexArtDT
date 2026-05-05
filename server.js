import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import axios from "axios";
async function fetchMarketContext(customStocks = [], moduleName = "") {
  try {
    const fetchIndex = async () => {
      try {
        let context = "\u3010\u5B9E\u65F6\u5927\u76D8\u6307\u6570\u3011\n";
        const res = await fetch("http://qt.gtimg.cn/q=s_sh000001,s_sz399001,s_sz399006,s_sh000300");
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder("gbk").decode(buffer);
        const lines = text.split("\n").filter((line) => line.trim() !== "");
        lines.forEach((line) => {
          const match = line.match(/="(.*?)";/);
          if (match) {
            const parts = match[1].split("~");
            context += `${parts[1]}: \u5F53\u524D\u70B9\u4F4D ${parts[3]}, \u6DA8\u8DCC\u989D ${parts[4]}, \u6DA8\u8DCC\u5E45 ${parts[5]}%
`;
          }
        });
        return context;
      } catch (e) {
        return "";
      }
    };
    const fetchTurnover = async () => {
      try {
        const shRes = await fetch("https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&fields=f2,f3,f4,f6");
        const shData = await shRes.json();
        if (shData && shData.data && shData.data.diff) {
          const shTurnover = shData.data.diff[0].f6 || 0;
          const szTurnover = shData.data.diff[1].f6 || 0;
          const totalTurnover = ((shTurnover + szTurnover) / 1e8).toFixed(2);
          return `
\u3010\u5E02\u573A\u8D44\u91D1\u3011
\u4ECA\u65E5\u4E24\u5E02\u603B\u6210\u4EA4\u989D: ${totalTurnover} \u4EBF\u5143
`;
        }
        return "";
      } catch (e) {
        return "";
      }
    };
    const fetchCustomStocksData = async () => {
      const ignoreStocksModules = ["globalConflict", "hotSearch", "financeNews"];
      if (ignoreStocksModules.includes(moduleName) || !customStocks || customStocks.length === 0) return "";
      try {
        let context = "\n\u3010\u81EA\u9009\u80A1\u5B9E\u65F6\u6570\u636E\u3011\n";
        const quoteIds = [];
        await Promise.all(customStocks.map(async (stockName) => {
          try {
            const searchRes = await fetch(`https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(stockName)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8`);
            const searchData = await searchRes.json();
            if (searchData && searchData.QuotationCodeTable && searchData.QuotationCodeTable.Data && searchData.QuotationCodeTable.Data.length > 0) {
              quoteIds.push(searchData.QuotationCodeTable.Data[0].QuoteID);
            }
          } catch (e) {
          }
        }));
        if (quoteIds.length > 0) {
          const stockRes = await fetch(`https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=${quoteIds.join(",")}&fields=f2,f3,f4,f5,f8,f12,f14`);
          const stockData = await stockRes.json();
          if (stockData && stockData.data && stockData.data.diff) {
            stockData.data.diff.forEach((stock) => {
              context += `${stock.f14} (${stock.f12}): \u6700\u65B0\u4EF7 ${stock.f2}, \u6DA8\u8DCC\u5E45 ${stock.f3}%, \u6DA8\u8DCC\u989D ${stock.f4}, \u6362\u624B\u7387 ${stock.f8}%, \u6210\u4EA4\u91CF ${stock.f5}\u624B
`;
            });
          }
        }
        return context;
      } catch (e) {
        return "";
      }
    };
    const fetchTop10 = async () => {
      try {
        let context = "\n\u3010\u6CAA\u6DF1A\u80A1\u6DA8\u5E45\u699CTop10\u3011\n";
        const emRes = await fetch("https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&fields=f2,f3,f4,f5,f8,f12,f14");
        const emData = await emRes.json();
        if (emData && emData.data && emData.data.diff) {
          emData.data.diff.forEach((stock) => {
            context += `${stock.f14} (${stock.f12}): \u6700\u65B0\u4EF7 ${stock.f2}, \u6DA8\u8DCC\u5E45 ${stock.f3}%, \u6DA8\u8DCC\u989D ${stock.f4}, \u6362\u624B\u7387 ${stock.f8}%, \u6210\u4EA4\u91CF ${stock.f5}\u624B
`;
          });
        }
        return context;
      } catch (e) {
        return "";
      }
    };
    const fetchTop5Sectors = async () => {
      try {
        let context = "\n\u3010\u884C\u4E1A\u677F\u5757\u9886\u6DA8Top5\u3011\n";
        const emSectorRes = await fetch("https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=5&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f4,f12,f14");
        const emSectorData = await emSectorRes.json();
        if (emSectorData && emSectorData.data && emSectorData.data.diff) {
          emSectorData.data.diff.forEach((sector) => {
            context += `${sector.f14}: \u6DA8\u8DCC\u5E45 ${sector.f3}%
`;
          });
        }
        return context;
      } catch (e) {
        return "";
      }
    };
    const fetchNews = async () => {
      try {
        let context = "\n\u3010\u6700\u65B0\u8D22\u7ECF\u8981\u95FB\u4E0E\u5E02\u573A\u52A8\u6001\u3011\n";
        const newsRes = await fetch("https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=20&zhibo_id=152");
        const newsData = await newsRes.json();
        if (newsData && newsData.result && newsData.result.data && newsData.result.data.feed) {
          newsData.result.data.feed.list.forEach((item) => {
            context += `- ${item.rich_text}
`;
          });
        }
        return context;
      } catch (e) {
        return "";
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
    return results.join("");
  } catch (err) {
    console.error("Failed to fetch market context:", err);
    return "";
  }
}
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3005);
  app.use(express.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/stocks/quotes", async (req, res) => {
    try {
      const { stocks } = req.body;
      if (!stocks || !Array.isArray(stocks)) return res.json({ quotes: {} });
      const quotes = {};
      const codesToFetch = [];
      const codeToNameMap = {};
      for (const name of stocks) {
        try {
          if (/^(sh|sz|hk|us)[0-9a-zA-Z]+$/i.test(name)) {
            codesToFetch.push(name.toLowerCase());
            codeToNameMap[name.toLowerCase()] = name;
            continue;
          }
          const searchRes = await axios.get(`http://smartbox.gtimg.cn/s3/?v=2&q=${encodeURIComponent(name)}&t=all`, {
            headers: { "Referer": "http://finance.qq.com" }
          });
          const match = searchRes.data.match(/v_hint="([^"]+)"/);
          if (match && match[1]) {
            const firstResult = match[1].split("^")[0];
            const parts = firstResult.split("~");
            if (parts.length >= 2) {
              const fullCode = `${parts[0]}${parts[1]}`;
              codesToFetch.push(fullCode);
              codeToNameMap[fullCode] = name;
            }
          }
        } catch (e) {
        }
      }
      if (codesToFetch.length > 0) {
        const quoteRes = await axios.get(`http://qt.gtimg.cn/q=${codesToFetch.join(",")}`, {
          headers: { "Referer": "http://finance.qq.com" },
          responseType: "arraybuffer"
        });
        const decoder = new TextDecoder("gbk");
        const dataStr = decoder.decode(quoteRes.data);
        const lines = dataStr.split(";");
        for (const line of lines) {
          if (!line.trim()) continue;
          const match = line.match(/v_(.+)="([^"]+)"/);
          if (match) {
            const fullCode = match[1];
            const parts = match[2].split("~");
            if (parts.length > 32) {
              const price = parts[3];
              const changePercent = parts[32];
              const name = codeToNameMap[fullCode] || parts[1];
              const sign = parseFloat(changePercent) > 0 ? "+" : "";
              quotes[name] = `${price} CNY, ${sign}${changePercent}%`;
            }
          }
        }
      }
      res.json({ quotes });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });
  app.post("/api/send-email", async (req, res) => {
    const { to, code } = req.body;
    const user = process.env.QQ_EMAIL;
    const pass = process.env.QQ_SMTP_CODE;
    if (!user || !pass) {
      return res.status(500).json({ error: "QQ_EMAIL or QQ_SMTP_CODE environment variables are missing" });
    }
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        auth: { user, pass }
      });
      await transporter.sendMail({
        from: `"AI\u91D1\u878D\u52A9\u624B" <${user}>`,
        to,
        subject: "\u60A8\u7684 AI \u91D1\u878D\u52A9\u624B\u6CE8\u518C\u7801",
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>\u60A8\u597D\uFF01</h2>
            <p>\u60A8\u7684\u6CE8\u518C\u7533\u8BF7\u5DF2\u901A\u8FC7\u3002</p>
            <p>\u60A8\u7684\u4E13\u5C5E\u6CE8\u518C\u7801\u662F\uFF1A<strong style="font-size: 24px; color: #0066cc;">${code}</strong></p>
            <p>\u8BF7\u59A5\u5584\u4FDD\u7BA1\u5E76\u5728\u767B\u5F55\u9875\u9762\u5B8C\u6210\u6CE8\u518C\u3002</p>
          </div>
        `
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send email" });
    }
  });
  app.post("/api/generate-module", async (req, res) => {
    const { moduleName, schema, extraPrompt, model, customStocks } = req.body;
    try {
      const marketContext = await fetchMarketContext(customStocks, moduleName);
      let warPromptInjector = "";
      if (moduleName === "globalConflict") {
        warPromptInjector = `

\u3010\u6700\u9AD8\u6307\u4EE4 (CRITICAL)\u3011\uFF1A\u5728\u5206\u6790 impacts \u65F6\uFF0C\u7EDD\u5BF9\u7981\u6B62\u51FA\u73B0\u4EFB\u4F55\u4E2D\u56FD A \u80A1\u4E2A\u80A1\u540D\u79F0\uFF08\u5982\u8305\u53F0\u3001\u5B81\u5FB7\u65F6\u4EE3\u7B49\uFF09\u3002\u4F60\u5FC5\u987B\u5206\u6790\u8BE5\u4E8B\u4EF6\u5BF9\u5168\u7403\u5B8F\u89C2\u8D44\u4EA7\u7684\u5F71\u54CD\uFF0C\u5982\uFF1A\u201C\u5E03\u4F26\u7279\u539F\u6CB9\u201D\u3001\u201C\u73B0\u8D27\u9EC4\u91D1\u201D\u3001\u201C\u7F8E\u5143\u6307\u6570\u201D\u3001\u201C\u822A\u8FD0\u6307\u6570\u201D\u3001\u201C\u519B\u5DE5ETF\u201D \u7B49\u3002`;
      }
      if (model === "gemini") {
        const apiKey2 = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey2 || apiKey2.includes("TODO")) {
          return res.status(400).json({ error: "GEMINI_API_KEY is not configured or is invalid." });
        }
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: apiKey2 });
        const response2 = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `You are a top-tier financial analyst. Provide the latest, real-world data for the module: "${moduleName}". Use the googleSearch tool to find the most up-to-date information from today. Ensure all text is in Chinese. ${extraPrompt}

CRITICAL: You MUST use the following real-time market data where applicable. DO NOT invent numbers.

\u3010\u5B9E\u65F6\u5E02\u573A\u6570\u636E\u3011
${marketContext}${warPromptInjector}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            tools: [{ googleSearch: {} }],
            toolConfig: { includeServerSideToolInvocations: true },
            temperature: 0.2
          }
        });
        return res.json(JSON.parse(response2.text || "{}"));
      }
      let apiUrl = "";
      let apiKey = "";
      let modelNameStr = "";
      if (model === "deepseek") {
        apiUrl = "https://api.deepseek.com/v1/chat/completions";
        apiKey = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || "";
        modelNameStr = process.env.VITE_DEEPSEEK_MODEL_ID || "deepseek-chat";
      } else if (model === "doubao") {
        apiUrl = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
        apiKey = process.env.VITE_DOUBAO_API_KEY || process.env.DOUBAO_API_KEY || "";
        modelNameStr = process.env.VITE_DOUBAO_MODEL_ID || process.env.DOUBAO_MODEL_ID || "ep-20250214220038-x1y2z";
      } else if (model === "mimo") {
        apiUrl = process.env.VITE_MIMO_BASE_URL || "https://api.xiaomimimo.com/v1/chat/completions";
        apiKey = process.env.VITE_MIMO_API_KEY || process.env.MIMO_API_KEY || "";
        modelNameStr = process.env.VITE_MIMO_MODEL_ID || "mimo-v2-pro";
      }
      if (!apiKey) {
        return res.status(400).json({ error: `API Key for ${model} is not configured.` });
      }
      const systemPrompt = `You are a top-tier financial analyst. Provide the latest data for the module: "${moduleName}". Ensure all text is in Chinese. ${extraPrompt}

\u3010\u5B9E\u65F6\u5E02\u573A\u6570\u636E\u3011
${marketContext}${warPromptInjector}

CRITICAL: You MUST return ONLY a valid JSON object matching the schema below. No markdown text.

Schema:
${JSON.stringify(schema)}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelNameStr,
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.2
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${model} API returned ${response.status}`);
      }
      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || "{}";
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return res.json(JSON.parse(text));
    } catch (error) {
      console.error(`Generate Module API Error (${model}):`, error);
      res.status(500).json({ error: error.message || "Failed to generate module data" });
    }
  });
  app.post("/api/analyze-pdf", async (req, res) => {
    const { base64Data, mimeType, schema, model } = req.body;
    try {
      if (model === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes("TODO")) return res.status(400).json({ error: "GEMINI_API_KEY is invalid." });
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: "\u4F60\u662F\u4E00\u4E2A\u8D44\u6DF1\u7684\u91D1\u878D\u5206\u6790\u5E08\u3002\u8BF7\u9605\u8BFB\u8FD9\u4EFD\u516C\u544A\uFF0C\u603B\u7ED3\u5F52\u7EB3\u6838\u5FC3\u5185\u5BB9\uFF0C\u7ED9\u51FA\u89C2\u70B9\u5E76\u660E\u786E\u7ED3\u8BBA\uFF1A\u662F\u5229\u597D\u3001\u5229\u7A7A\u8FD8\u662F\u4E2D\u6027\u3002\u8BF7\u8FD4\u56DE JSON \u683C\u5F0F\u7ED3\u679C\u3002" }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.2
          }
        });
        return res.json(JSON.parse(response.text || "{}"));
      }
      return res.status(400).json({ error: `Model ${model} does not support PDF analysis yet.` });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to analyze PDF" });
    }
  });
  app.post("/api/chat", async (req, res) => {
    const { message, contextData, history, model, customStocks } = req.body;
    try {
      const marketContext = await fetchMarketContext(customStocks);
      const systemPrompt = `System Instruction: You are a professional financial AI assistant. You have access to the following current market data and analysis across 5 modules:

${JSON.stringify(contextData, null, 2)}

Here is the latest real-time market data:
${marketContext}

Answer the user's questions based on this data. Be concise and insightful. Use Chinese.`;
      if (model === "gemini") {
        const apiKey2 = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: apiKey2 });
        const contents = [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "\u597D\u7684\uFF0C\u6211\u5DF2\u7ECF\u4E86\u89E3\u4E86\u6700\u65B0\u7684\u5E02\u573A\u6570\u636E\u3002\u8BF7\u95EE\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u60A8\uFF1F" }] },
          ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: "user", parts: [{ text: message }] }
        ];
        const response2 = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents
        });
        return res.json({ text: response2.text });
      }
      let apiUrl = "";
      let apiKey = "";
      let modelName = "";
      if (model === "deepseek") {
        apiUrl = "https://api.deepseek.com/v1/chat/completions";
        apiKey = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || "";
        modelName = process.env.VITE_DEEPSEEK_MODEL_ID || "deepseek-chat";
      } else if (model === "doubao") {
        apiUrl = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
        apiKey = process.env.VITE_DOUBAO_API_KEY || process.env.DOUBAO_API_KEY || "";
        modelName = process.env.VITE_DOUBAO_MODEL_ID || process.env.DOUBAO_MODEL_ID || "ep-20250214220038-x1y2z";
      } else if (model === "mimo") {
        apiUrl = process.env.VITE_MIMO_BASE_URL || "https://api.xiaomimimo.com/v1/chat/completions";
        apiKey = process.env.VITE_MIMO_API_KEY || process.env.MIMO_API_KEY || "";
        modelName = process.env.VITE_MIMO_MODEL_ID || "mimo-v2-pro";
      }
      const openAiMessages = [
        { role: "system", content: systemPrompt },
        { role: "assistant", content: "\u597D\u7684\uFF0C\u6211\u5DF2\u7ECF\u4E86\u89E3\u4E86\u6700\u65B0\u6570\u636E\u3002\u8BF7\u95EE\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u60A8\uFF1F" },
        ...history.map((h) => ({ role: h.role === "model" ? "assistant" : "user", content: h.text })),
        { role: "user", content: message }
      ];
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelName, messages: openAiMessages, temperature: 0.7 })
      });
      const data = await response.json();
      return res.json({ text: data.choices?.[0]?.message?.content || "" });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to generate chat response" });
    }
  });
  app.delete("/api/admin/requests/:id", async (req, res) => {
    try {
      res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        if (url.startsWith("/api")) return next();
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
