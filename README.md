# DailyTrendDT

一个面向中文金融信息场景的 AI 助手项目，提供热搜追踪、每日复盘、财经要闻、全球冲突进程、未来预判，以及带上下文的 AI 聊天问答能力。

项目采用前后端一体化结构：

- 前端：`React 19 + Vite + TypeScript`
- 后端：`Express + TypeScript`
- 数据与认证：`Firebase Auth + Firestore`
- AI 模型：`Gemini / DeepSeek / 豆包 / 小米 MiMo`
- 邮件能力：`Nodemailer + QQ SMTP`

## 项目目标

这个项目不是单纯的资讯展示页，而是一个“可登录、可配置、可审批、可生成内容”的金融信息工作台。用户登录后可以：

- 查看 5 个金融分析模块
- 手动刷新指定模块的数据
- 选择全局 AI 模型
- 配置自选股、热搜站点、关注主题
- 使用聊天 Copilot 基于当前模块数据继续追问
- 管理员审批注册请求并发放注册码

## 核心功能

### 1. 五大内容模块

- `热搜早知道`
  聚合用户关注的网站热搜，并结合 AI 给出摘要和分析。
- `每日复盘`
  结合大盘、成交额、自选股、公告分析，输出盘后复盘信息。
- `财经要闻`
  汇总财经新闻，并给出利好板块、相关个股及原因。
- `全球冲突进程`
  跟踪地缘政治事件及其对金融市场的影响。
- `未来预判`
  输出未来一段时间的主题方向、风险提示和策略建议。

### 2. AI 聊天 Copilot

- 基于当前模块数据和实时市场上下文回答用户问题
- 支持多轮历史消息
- 返回中文结果
- 支持切换不同模型

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

## 技术架构

### 前端

- 单页应用，入口为 [src/main.tsx](G:\AITOOLS\DailyTrendDT\src\main.tsx)
- 主应用入口为 [src/App.tsx](G:\AITOOLS\DailyTrendDT\src\App.tsx)
- 使用 Context 管理认证状态与业务数据
- 通过 `fetch('/api/*')` 调用后端接口

前端关键上下文：

- [src/context/AuthContext.tsx](G:\AITOOLS\DailyTrendDT\src\context\AuthContext.tsx)
  负责 Firebase 登录态和角色读取
- [src/context/DataContext.tsx](G:\AITOOLS\DailyTrendDT\src\context\DataContext.tsx)
  负责五大模块数据、刷新状态、更新时间和用户偏好

### 后端

后端入口为 [server.ts](G:\AITOOLS\DailyTrendDT\server.ts)，默认监听 `3000` 端口。

后端职责：

- 提供统一的 `/api/*` 接口
- 拉取实时市场数据和资讯
- 调用不同大模型生成结构化 JSON
- 处理 PDF 公告分析
- 发送审批邮件
- 在生产环境中托管前端 `dist/` 文件

### Firebase

Firebase 配置文件：

- [firebase-applet-config.json](G:\AITOOLS\DailyTrendDT\firebase-applet-config.json)
- [firestore.rules](G:\AITOOLS\DailyTrendDT\firestore.rules)

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

- `Gemini` 已支持
- 其他模型暂未支持 PDF 分析

### `POST /api/send-email`

用于管理员审批后发送注册码邮件。

请求体主要字段：

- `to`
- `code`

## 支持的模型

当前代码中内置了以下模型接入方式：

- `gemini`
- `deepseek`
- `doubao`
- `mimo`

其中：

- `Gemini` 走 `@google/genai`
- 其他模型走 OpenAI 兼容格式接口

对应逻辑可见：

- [server.ts](G:\AITOOLS\DailyTrendDT\server.ts)
- [src/components/SettingsModal.tsx](G:\AITOOLS\DailyTrendDT\src\components\SettingsModal.tsx)

## 目录结构

```text
DailyTrendDT/
├─ src/
│  ├─ components/        # 通用组件、弹窗、管理员后台、聊天面板
│  ├─ context/           # 认证与业务数据上下文
│  ├─ lib/               # API、Firebase、schema、工具函数
│  ├─ tabs/              # 五大业务模块页面
│  ├─ App.tsx            # 应用主体
│  ├─ main.tsx           # 前端入口
│  └─ index.css          # 全局样式
├─ server.ts             # Express 服务端入口
├─ firestore.rules       # Firestore 安全规则
├─ firebase-applet-config.json
├─ package.json
├─ vite.config.ts
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
VITE_DOUBAO_MODEL_ID=

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

- 直接用 `tsx` 启动 [server.ts](G:\AITOOLS\DailyTrendDT\server.ts)
- 在开发模式下挂载 Vite 中间件
- 使用 `http://localhost:3000` 作为统一入口

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

这个项目适合部署为“Node 服务 + 静态前端”的一体化应用。

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

当前管理员逻辑在代码里是硬编码邮箱识别：

- `yao_pengcheng@outlook.com`

相关位置：

- [src/context/AuthContext.tsx](G:\AITOOLS\DailyTrendDT\src\context\AuthContext.tsx)
- [src/components/AuthScreen.tsx](G:\AITOOLS\DailyTrendDT\src\components\AuthScreen.tsx)
- [firestore.rules](G:\AITOOLS\DailyTrendDT\firestore.rules)

如果后续要交付给别人使用，建议把管理员身份改成纯 Firestore 配置，不再依赖硬编码邮箱。

## 关键实现细节

### 实时市场数据来源

后端在生成内容前，会抓取多类外部数据，例如：

- 腾讯行情接口
- 东方财富接口
- 新浪直播资讯

这些数据被拼装成实时上下文，再传给模型，尽量降低“纯模型幻觉”。

### Schema 驱动生成

每个模块都通过 schema 约束模型输出 JSON 结构，相关定义在：

- [src/lib/schemas.ts](G:\AITOOLS\DailyTrendDT\src\lib\schemas.ts)

这使得前端渲染可以依赖稳定字段，而不是解析自由文本。

### API 降级提示

[src/lib/api.ts](G:\AITOOLS\DailyTrendDT\src\lib\api.ts) 已经内置了一个很实用的错误提示：

- 如果前端请求到的是 HTML 页面而不是 API JSON
- 会提示“站点只部署了前端页面，未部署 /api 后端服务”

这有助于快速定位部署缺失问题。

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

### 3. 服务端端口当前写死为 `3000`

[server.ts](G:\AITOOLS\DailyTrendDT\server.ts) 里当前是固定端口：

```ts
const PORT = 3000;
```

如果未来要部署到云平台，通常建议改为优先读取 `process.env.PORT`。

### 4. `server.ts` 与 `server.js` 的关系

- `server.ts` 是源码
- `server.js` 是构建时自动生成的运行产物

日常开发只需要修改 `server.ts`，不要直接改 `server.js`。

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 后续优化建议

如果你准备继续把这个项目产品化，优先建议做这几件事：

1. 清理并轮换已暴露的 API Key
2. 把管理员邮箱从硬编码改成配置化
3. 给关键接口增加日志、限流和错误监控
4. 为模型调用增加超时、重试和 fallback 机制
5. 补充 `README` 之外的部署脚本和初始化脚本
6. 为 Firestore 集合结构补一份更正式的数据字典

## License

当前仓库中未看到明确的 License 文件。如果你准备公开或协作分发，建议补充 `LICENSE`。
