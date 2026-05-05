# NexArtDT (DailyTrendDT)

> AI 金融助手 — 品牌名：**NexArtDT**（原 DailyTrendDT）

一个面向中文金融信息场景的 AI 助手项目，提供热搜追踪、每日复盘、财经要闻、全球冲突进程、未来预判，以及带上下文的 AI 聊天问答能力。

项目采用前后端一体化结构：

- 前端：`React 19 + Vite 6 + TypeScript + Tailwind CSS v4`
- 后端：`Express + TypeScript`
- 数据与认证：`Firebase Auth + Firestore`
- AI 模型：`Gemini 3.1 Pro / DeepSeek / 豆包 (Doubao) / 小米 MiMo`
- 邮件能力：`Nodemailer + QQ SMTP`

## 项目目标

这个项目不是单纯的资讯展示页，而是一个"可登录、可配置、可审批、可生成内容"的金融信息工作台。用户登录后可以：

- 查看 5 个金融分析模块
- 手动刷新指定模块的数据
- 选择全局 AI 模型
- 配置自选股、热搜站点、关注主题
- 使用聊天 Copilot 基于当前模块数据继续追问
- 管理员审批注册请求并发放注册码
- **生成可分享的金融分析图片（含 Logo + 二维码）**

## 核心功能

### 1. 五大内容模块

- `热搜早知道`
  聚合用户关注的网站热搜，并结合 AI 给出摘要和分析。
- `每日复盘`
  结合大盘、成交额、自选股、公告分析，输出盘后复盘信息。
- `财经要闻`
  汇总财经新闻，并给出利好板块、相关个股及原因。
- `全球冲突进程`
  跟踪地缘政治事件及其对金融市场的影响。**特别注意：该模块的分析结果中会强制禁止出现 A 股个股名称，仅分析全球宏观资产（如原油、黄金、美元指数等）。**
- `未来预判`
  输出未来一段时间的主题方向、风险提示和策略建议。

### 2. AI 聊天 Copilot

- 基于当前模块数据和实时市场上下文回答用户问题
- 支持多轮历史消息
- 返回中文结果（支持 Markdown 渲染）
- 支持切换不同模型（Gemini / DeepSeek / 豆包 / MiMo）

### 3. 用户注册与管理员审批

- 未注册用户可以提交邮箱申请
- 管理员在后台审批后生成注册码
- 后端通过 QQ SMTP 自动发送注册码邮件
- 用户使用注册码完成注册

### 4. 个性化偏好设置

用户偏好会写入 Firestore，包括：

- `customStocks` 自选股
- `customSites` 热搜来源站点
- `customTopics` 关注主题
- `globalModel` 当前使用的默认模型

### 5. 内容分享（新增）

每个模块都支持将分析内容生成为精美的分享图片：

- 可勾选要包含的内容条目
- 自动生成包含 **NexArtDT Logo + 今日洞察卡片 + 二维码** 的分享图
- 支持保存为 PNG 图片

## 技术架构

### 前端

- 单页应用，入口为 `src/main.tsx`
- 主应用入口为 `src/App.tsx`
- 使用 Context 管理认证状态与业务数据
- 通过 `fetch('/api/*')` 调用后端接口
- 新增 `lucide-react` 图标库，全局统一图标风格
- 新增 `html2canvas` 用于分享图片生成
- 新增 `react-markdown` 用于 AI 回复 Markdown 渲染

前端关键上下文：

- `src/context/AuthContext.tsx` — 负责 Firebase 登录态和角色读取
- `src/context/DataContext.tsx` — 负责五大模块数据、刷新状态、更新时间、用户偏好和全局模型

前端 UI 组件一览：

| 组件 | 说明 |
|------|------|
| `TopBar` | 顶部栏，含模块标题/图标、**分享按钮**、刷新按钮、**设置按钮** |
| `BottomNav` | 🆕 底部导航栏，5 个 Tab（复盘/热搜/财经/战事/预判），磨砂玻璃效果 |
| `Logo` | 🆕 NexArtDT 品牌 Logo，六边形 + Activity 图标，渐变发光动画 |
| `ShareModal` | 🆕 定制分享弹窗，可勾选内容、预览卡片、保存为 PNG 图片 |
| `ChatCopilot` | AI 聊天面板，侧滑式，支持 Markdown 渲染 |
| `SettingsModal` | 全局设置弹窗，模型切换 + 退出登录 |
| `AuthScreen` | 登录/注册/验证码界面 |
| `AdminPanel` | 管理员审批后台 |

### 后端

后端入口为 `server.ts`，默认监听 `3005` 端口（支持通过 `PORT` 环境变量覆盖）。

后端职责：

- 提供统一的 `/api/*` 接口
- 拉取实时市场数据和资讯（腾讯行情 / 东方财富 / 新浪直播）
- 调用不同大模型生成结构化 JSON
- 处理 PDF 公告分析
- 发送审批邮件（QQ SMTP）
- **根据模块智能跳过个股数据拉取**（战事/热搜/财经模块自动跳过，避免 AI 强行联想）
- **战事模块强制注入"思想钢印"提示**，阻断 AI 输出 A 股个股名称
- 在生产环境中托管前端 `dist/` 文件
- 在开发环境中集成 Vite 中间件（热更新 + SPA 路由支持）

### Firebase

Firebase 配置文件：

- `firebase-applet-config.json`
- `firestore.rules`

当前 Firestore 规则已覆盖：

- 注册申请写入
- 普通用户资料读写
- 管理员审批与删除
- 角色校验

## API 一览

后端当前提供以下接口：

### `GET /api/health`

健康检查接口，返回服务是否正常。

### `POST /api/generate-module`

用于生成五大模块的数据。

请求体主要字段：

- `moduleName`
- `schema`
- `extraPrompt`
- `model`
- `customStocks`

说明：

- 后端会先抓取实时大盘、成交额、自选股、涨幅榜、板块、新闻等上下文
- 再把这些上下文喂给指定模型
- 期望模型严格返回符合 `schema` 的 JSON
- **战事/热搜/财经模块**会智能跳过个股数据拉取

### `POST /api/chat`

用于聊天 Copilot。

请求体主要字段：

- `message`
- `contextData`
- `history`
- `model`
- `customStocks`

### `POST /api/analyze-pdf`

用于分析上市公司公告 PDF。

当前实现说明：

- `Gemini 3.1 Pro` 已支持
- 其他模型暂未支持 PDF 分析

### `POST /api/send-email`

用于管理员审批后发送注册码邮件。

请求体主要字段：

- `to`
- `code`

### `POST /api/stocks/quotes` 🆕

腾讯财经股票极速行情查询接口。

请求体：

```json
{ "stocks": ["贵州茅台", "腾讯控股", "sz000001"] }
```

支持股票名称自动搜索匹配，或直接传入 `sh/sz/hk/us` 格式代码。

### `DELETE /api/admin/requests/:id` 🆕

管理员删除注册请求的兜底接口，防止因 Firebase 直连权限问题导致 500 崩溃。

## 支持的模型

当前代码中内置了以下模型接入方式：

- `gemini` — 走 `@google/genai` SDK，使用 `gemini-3.1-pro-preview` 模型
- `deepseek` — 走 OpenAI 兼容格式，`https://api.deepseek.com/v1/chat/completions`
- `doubao` — 走 OpenAI 兼容格式，`https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- `mimo` — 走 OpenAI 兼容格式，默认 `https://api.xiaomimimo.com/v1/chat/completions`

其中：

- `Gemini` 支持响应 Schema 约束 + Google Search 联网搜索
- 其他模型走 OpenAI 兼容格式接口

**Gemini 的路由在 `generate-module` 中会优先走 `googleSearch` 联网模式，确保数据时效性。**

## 目录结构

```text
DailyTrendDT/
├─ src/
│  ├─ components/        # 通用组件（Logo, TopBar, BottomNav, ChatCopilot,
│  │                     #   SettingsModal, ShareModal, AuthScreen, AdminPanel）
│  ├─ context/           # 认证与业务数据上下文
│  ├─ lib/               # API、Firebase、schema、数据归一化、工具函数
│  ├─ tabs/              # 五大业务模块页面（HotSearch, DailyReview, FinanceNews,
│  │                     #   GlobalConflict, FutureForecast）
│  ├─ App.tsx            # 应用主体（含 NexArtDT 品牌加载动画）
│  ├─ main.tsx           # 前端入口
│  └─ index.css          # 全局样式（Tailwind v4 入口）
├─ server.ts             # Express 服务端入口
├─ firestore.rules       # Firestore 安全规则
├─ firebase-applet-config.json
├─ index.html            # 入口 HTML（含 SVG Favicon + 内联后备加载动画）
├─ package.json
├─ vite.config.ts        # Vite 配置（@tailwindcss/vite 插件 + 域名白名单）
└─ README.md
```

## 本地开发

### 环境要求

- Node.js 18 及以上
- npm
- 一个可用的 Firebase 项目
- 至少一个可用的大模型 API Key
- 如需审批邮件功能，准备 QQ 邮箱 SMTP 授权码

### 安装依赖

```bash
npm install
```

### 配置环境变量

项目根目录已有 `.env` 和 `.env.example`。建议你根据实际环境重新整理一份 `.env`，至少包含以下变量：

```env
# 前后端 API
VITE_API_BASE_URL=

# Gemini
GEMINI_API_KEY=
VITE_GEMINI_API_KEY=

# DeepSeek
DEEPSEEK_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_DEEPSEEK_MODEL_ID=deepseek-chat

# 豆包
DOUBAO_API_KEY=
VITE_DOUBAO_API_KEY=
DOUBAO_MODEL_ID=
VITE_DOUBAO_MODEL_ID=doubao-seed-2-0-pro-260215

# 小米 MiMo
MIMO_API_KEY=
VITE_MIMO_API_KEY=
VITE_MIMO_MODEL_ID=mimo-v2-pro
VITE_MIMO_BASE_URL=https://api.xiaomimimo.com/v1/chat/completions

# QQ SMTP
QQ_EMAIL=
QQ_SMTP_CODE=
```

说明：

- 当前代码会同时读取前端前缀变量和服务端变量
- `Gemini` 优先读取 `GEMINI_API_KEY`，其次读取 `VITE_GEMINI_API_KEY`
- 其他模型也有类似的前后端双读取逻辑
- 如果前后端同域部署，`VITE_API_BASE_URL` 可以留空
- 如果后端单独部署到别的域名，需要把 `VITE_API_BASE_URL` 配成完整地址

### 启动开发环境

```bash
npm run dev
```

这个命令会：

- 直接用 `tsx` 启动 `server.ts`（端口 3005）
- 在开发模式下挂载 Vite 中间件（支持热更新）
- 使用 `http://localhost:3005` 作为统一入口

也就是说，本项目开发时不是前后端分开跑两个命令，而是跑一个 Node 进程即可。

### 构建生产版本

```bash
npm run build
```

这个命令会依次执行：

- `npm run build:client`
- `npm run build:server`

产物包括：

- 前端静态资源：`dist/`
- 后端运行文件：`server.js`（构建时自动生成，不建议手动维护）

### 生产启动

```bash
npm run start
```

注意：

- 生产环境仍然需要 Node 服务常驻运行
- 不能只部署 `dist/` 静态文件
- 如果只部署前端而没有部署 Node 后端，所有 `/api/*` 功能都会失败
- `npm start` 会先自动执行 `build:server`，再启动 `server.js`

## 部署说明

这个项目适合部署为"Node 服务 + 静态前端"的一体化应用。

推荐部署方式：

1. 在服务器上执行 `npm install`
2. 配置生产环境变量
3. 执行 `npm run build`
4. 执行 `npm run start`
5. 用 Nginx、Caddy 或其他反向代理把域名转发到 Node 服务

如果前后端分离部署：

- 前端单独部署静态资源
- 后端单独部署 Node 服务
- 前端环境变量里设置 `VITE_API_BASE_URL`

## Firebase 数据设计建议

根据当前代码，至少会用到以下集合：

### `users`

字段示例：

- `email`
- `role`
- `createdAt`
- `customStocks`
- `customSites`
- `customTopics`

### `registration_requests`

字段示例：

- `email`
- `status`
- `registrationCode`
- `createdAt`

状态值包括：

- `pending`
- `approved`
- `rejected`
- `used`

## 管理员逻辑说明

当前管理员逻辑是**优先从 Firestore users 文档读取 role，其次通过硬编码邮箱兜底**：

- 管理员邮箱：`yao_pengcheng@outlook.com`

相关位置：

- `src/context/AuthContext.tsx`
- `src/components/AuthScreen.tsx`
- `firestore.rules`

如果后续要交付给别人使用，建议把管理员身份改成纯 Firestore 配置，不再依赖硬编码邮箱。

## 关键实现细节

### 实时市场数据来源

后端在生成内容前，会抓取多类外部数据，例如：

- **腾讯行情接口** (`qt.gtimg.cn`) — 大盘指数、个股实时行情
- **东方财富接口** (`push2.eastmoney.com`) — 成交额、涨幅榜、板块排行、自选股
- **新浪直播资讯** (`zhibo.sina.com.cn`) — 实时财经要闻
- **腾讯极速行情** (`qt.gtimg.cn + smartbox.gtimg.cn`) — 极速股票行情查询 API

这些数据被拼装成实时上下文，再传给模型，尽量降低"纯模型幻觉"。

### 智能数据拉取

- **战事/热搜/财经模块**自动跳过自选股数据拉取，防止 AI 强行联想个股
- **战事模块**额外注入强制指令，禁止返回 A 股个股名称，仅分析全球宏观资产

### Schema 驱动生成

每个模块都通过 schema 约束模型输出 JSON 结构，相关定义在：

- `src/lib/schemas.ts`

这使得前端渲染可以依赖稳定字段，而不是解析自由文本。

### 数据归一化

前端 `src/lib/gemini.ts` 中的 `normalizeModuleData` 函数：

- 支持字段名的多种中英文变体（如 `marketOverview` / `market_overview` / `市场概览` / `大盘概览`）
- 自动将 snake_case 转为 camelCase
- 确保各模块数据格式统一，前端渲染稳定

### API 降级提示

`src/lib/api.ts` 已经内置了一个很实用的错误提示：

- 如果前端请求到的是 HTML 页面而不是 API JSON
- 会提示"站点只部署了前端页面，未部署 /api 后端服务"

这有助于快速定位部署缺失问题。

### NexArtDT 品牌加载动画

应用启动时展示"**NexArtDT**"逐字飞入动画（品牌色薄荷绿渐变），支持淡出过渡效果。

- `index.html` 中包含纯 CSS 后备动画（网络慢时 JS 未加载也能看到）
- `App.tsx` 中的 React 版动画在认证状态加载完毕后自动淡出

## 已知注意事项

### 1. `.env.example` 不应提交真实密钥

当前项目中的 `.env.example` 看起来包含了真实格式的密钥内容。建议尽快处理：

- 撤销公开泄露的密钥
- 在平台侧重新生成新密钥
- 把 `.env.example` 改成纯占位符模板

### 2. `clean` 脚本偏 Unix 风格

当前 `package.json` 中：

```json
"clean": "rm -rf dist"
```

在 Windows 原生环境下未必可直接执行。若后续需要兼容 Windows 命令行，建议改成跨平台写法。

### 3. 服务端端口当前默认 `3005`（支持环境变量覆盖）

```ts
const PORT = Number(process.env.PORT || 3005);
```

### 4. `server.ts` 与 `server.js` 的关系

- `server.ts` 是源码
- `server.js` 是构建时自动生成的运行产物

日常开发只需要修改 `server.ts`，不要直接改 `server.js`。

### 5. HMR 在 AI Studio 环境中默认关闭

`vite.config.ts` 中有 `DISABLE_HMR` 环境变量控制，用于防止 AI 编辑时页面频繁重刷。

## 常用命令

```bash
npm run dev        # 启动开发环境（tsx + Vite 中间件）
npm run build      # 构建前端 + 后端
npm run start      # 生产启动（先 build:server，再 node server.js）
npm run lint       # TypeScript 类型检查
npm run clean      # 清理 dist 目录
```

## 后续优化建议

如果你准备继续把这个项目产品化，优先建议做这几件事：

1. 清理并轮换已暴露的 API Key
2. 把管理员邮箱从硬编码改成纯配置化
3. 给关键接口增加日志、限流和错误监控
4. 为模型调用增加超时、重试和 fallback 机制
5. 补充 `README` 之外的部署脚本和初始化脚本
6. 为 Firestore 集合结构补一份更正式的数据字典

## License

当前仓库中未看到明确的 License 文件。如果你准备公开或协作分发，建议补充 `LICENSE`。
