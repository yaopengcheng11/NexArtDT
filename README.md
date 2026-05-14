# NexArtDT (DailyTrendDT)

> AI 金融助手 — 品牌名：**NexArtDT**

一个面向中文金融信息场景的 AI 助手项目，提供**实时热搜追踪、大盘复盘、题材预判、全球地缘政治追踪**，以及带上下文的 AI 聊天问答能力。

## 项目概览

- **前端**：`React 19 + Vite 6 + TypeScript + Tailwind CSS v4`
- **后端**：`Express + TypeScript`
- **数据与认证**：`Firebase Auth + Firestore`
- **AI 模型**：`Gemini 2.5 Flash / DeepSeek / 豆包 (Doubao) / 小米 MiMo`
- **实时数据源**：B站/微博/百度热搜 API · 腾讯行情 · 东方财富 · 新浪财经

## 核心功能

### 三大模块

| 模块 | 功能 |
|------|------|
| **热搜** | 后端直连 B站/微博/百度实时热搜 API，AI 补充描述和三种视角分析 |
| **投资** | 大盘概况 + 自选股复盘 + 公告 PDF 解读 + 题材预判 + 核心策略 |
| **战事** | 全球地缘冲突追踪，双立场分析+客观分析+宏观资产影响 |

### 主要特性

- **实时热搜数据** — B站热搜词、微博热搜榜、百度热搜均由后端直接调用平台 API，**非 AI 编造**
- **公告智能解读** — 上传 PDF 公告，AI 提取核心内容并判断利好/利空
- **AI 聊天 Copilot** — 基于当前模块数据和实时市场上下文多轮对话
- **内容分享** — 生成精美分享图片（含 Logo + 二维码），支持文字/图片两种格式
- **多模型切换** — Gemini / DeepSeek / 豆包 / MiMo 自由切换
- **个性化配置** — 自选股、热搜站点、关注主题持久化到 Firestore
- **管理员系统** — 审批注册请求、发放注册码（QQ SMTP 邮件发送）

## 技术架构

### 前端架构

```
src/
├── App.tsx                 # 应用主入口（加载动画 + 路由 + 刷新逻辑）
├── context/
│   ├── AuthContext.tsx      # Firebase 认证 & 角色管理
│   └── DataContext.tsx      # 全局数据状态 + 用户偏好
├── lib/
│   ├── gemini.ts            # AI 数据归一化（多字段名兼容）
│   ├── schemas.ts           # Gemini JSON Schema 定义
│   ├── api.ts               # HTTP 请求封装 + 实时热搜拉取
│   └── utils.ts             # 工具函数：颜色、链接验证等
├── components/
│   ├── TopBar.tsx           # 顶部导航栏
│   ├── BottomNav.tsx        # 底部导航（3 Tab：热搜·投资·战事）
│   ├── ShareModal.tsx       # 两步式分享弹窗
│   ├── ChatCopilot.tsx      # AI 聊天面板
│   ├── SettingsModal.tsx    # 模型切换
│   ├── AuthScreen.tsx       # 登录/注册
│   └── AdminPanel.tsx       # 管理员后台
└── tabs/
    ├── HotSearch.tsx             # Tab 1: 热搜早知道
    ├── InvestmentOverview.tsx    # Tab 2: 投资总览（复盘+预判）
    └── GlobalConflict.tsx        # Tab 3: 全球冲突进程
```

### 后端架构

`server.ts` 提供以下 API：

| 接口 | 说明 |
|------|------|
| `GET /api/health` | 健康检查 |
| `POST /api/generate-module` | 调用 AI 生成模块数据（含实时市场上下文注入） |
| `POST /api/hot-search/real-time` | 直连 B站/微博/百度抓取实时热搜榜单 |
| `POST /api/chat` | AI 聊天 Copilot |
| `POST /api/analyze-pdf` | PDF 公告分析 |
| `POST /api/stocks/quotes` | 腾讯极速股票行情查询 |
| `POST /api/send-email` | QQ SMTP 发送审批邮件 |
| `DELETE /api/admin/requests/:id` | 管理员删除注册请求 |

### Gemini API 集成（重要）

Gemini 使用**原生 `fetch()`** 调用，而非 `@google/genai` SDK：

- 使用 `v1beta` API 版本（`gemini-2.5-flash` 需要）
- 支持 `googleSearch` 联网搜索
- 结构化输出通过**在 prompt 中嵌入 schema** 实现（而非 `responseMimeType`——它与 `googleSearch` 不兼容）
- 支持代理转发（国内服务器必备），通过 `GEMINI_PROXY_URL` 配置
- 自动降级：Gemini 被暂停时自动 fallback 到 DeepSeek

## 实时数据流

```
热搜刷新流程：
  用户点"刷新"
  → 后端并行抓取 B站热搜词 API / 微博热搜 API / 百度热搜 API
  → 真实标题+热度注入 Gemini prompt
  → Gemini 仅补充描述、链接、三种视角
  → 返回结果中每条标题 100% 来自平台实时榜单 ✅

投资/战事刷新流程：
  用户点"刷新"
  → 后端抓取实时大盘指数/成交额/涨幅榜/板块排行/财经要闻
  → 注入 Gemini + googleSearch 强制联网
  → AI 返回结构化 JSON
```

## 支持模型

| 模型 ID | 说明 |
|---------|------|
| `gemini` | Gemini 2.5 Flash（默认），支持 Google Search 联网 |
| `deepseek` | DeepSeek Chat，OpenAI 兼容格式 |
| `doubao` | 豆包，火山引擎端点 |
| `mimo` | 小米 MiMo |

## 环境变量

```env
# Gemini（必填）
GEMINI_API_KEY=你的API_KEY
GEMINI_MODEL_ID=gemini-2.5-flash
GEMINI_PROXY_URL=你的代理地址（国内服务器必填）

# DeepSeek
VITE_DEEPSEEK_API_KEY=你的KEY
VITE_DEEPSEEK_MODEL_ID=deepseek-chat

# 豆包
VITE_DOUBAO_API_KEY=你的KEY
VITE_DOUBAO_MODEL_ID=doubao-seed-2-0-pro-260215

# 小米 MiMo
VITE_MIMO_API_KEY=你的KEY
VITE_MIMO_MODEL_ID=mimo-v2-pro
VITE_MIMO_BASE_URL=https://api.xiaomimimo.com/v1/chat/completions

# QQ SMTP（审批邮件用）
QQ_EMAIL=你的QQ邮箱
QQ_SMTP_CODE=SMTP授权码
```

## 本地开发

```bash
# 1. 安装
npm install

# 2. 配置 .env

# 3. 启动开发服务器（3005端口，Vite 热更新）
NODE_ENV=development npx tsx server.ts

# 4. 浏览器访问 http://localhost:3005
```

## 生产部署

```bash
npm run build        # 构建前端 dist/ + 服务端 server.js
NODE_ENV=production npx tsx server.ts   # 或用 PM2 管理
```

推荐部署方式：Nginx / Caddy 反代 → Node 服务（3005 端口）。

## 已知注意事项

1. **Gemini 代理** — 国内服务器必须配置 `GEMINI_PROXY_URL`，WSL 本地开发可直连
2. **B站热搜 API** — 使用 B站搜索推荐词接口（`/wbi/search/square`），非热门视频接口
3. **知乎不可用** — 知乎无公开 API，勾选"知乎"时会自动用百度热搜替代
4. **`server.js` 是构建产物** — 开发时用 `tsx server.ts`，不要手工编译或提交 `server.js`
5. **NODE_ENV 陷阱** — 如果全局设置了 `NODE_ENV=production`（如 .bashrc），本地开发时需要显式覆盖
