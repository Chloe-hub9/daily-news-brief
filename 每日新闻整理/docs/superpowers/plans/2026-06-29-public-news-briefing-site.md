# Public News Briefing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public phone-and-desktop website where the user can click "更新今日简报" to generate, view, copy, and download the daily bilingual Markdown news briefing with a major-market index module.

**Architecture:** Use Cloudflare Pages for the static frontend and Cloudflare Worker-compatible API routes for generation and caching. Keep core briefing prompt construction and cache behavior testable as plain TypeScript modules before wiring them into the Worker endpoint.

**Tech Stack:** TypeScript, Vite, Vitest, Cloudflare Pages/Workers, Cloudflare KV-compatible cache binding, browser Clipboard and Blob APIs.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `tsconfig.json`: TypeScript compiler settings.
- `vite.config.ts`: Vite app and Vitest configuration.
- `wrangler.toml`: Cloudflare deployment configuration and KV binding declaration.
- `src/shared/dates.ts`: Asia/Hong_Kong date formatting helpers.
- `src/shared/briefingPrompt.ts`: builds the exact generation prompt, including news sections and market-index requirements.
- `src/shared/types.ts`: shared request and response types.
- `functions/api/briefing.ts`: Cloudflare Pages Function endpoint for `GET /api/briefing`.
- `src/app/main.ts`: browser behavior for loading, generating, copying, and downloading Markdown.
- `src/app/styles.css`: responsive UI styling.
- `index.html`: public app shell.
- `tests/dates.test.ts`: date helper tests.
- `tests/briefingPrompt.test.ts`: prompt coverage tests.
- `tests/briefingApi.test.ts`: API caching and auth tests with mocked bindings.
- `tests/app.test.ts`: browser interaction tests with jsdom.

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `wrangler.toml`
- Create: `.gitignore`

- [ ] **Step 1: Create package scripts and dependencies**

Create `package.json`:

```json
{
  "name": "daily-news-briefing-site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 8787",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "preview": "vite preview --host 0.0.0.0 --port 8788",
    "deploy": "wrangler pages deploy dist"
  },
  "dependencies": {
    "@cloudflare/workers-types": "^4.20260620.0",
    "marked": "^13.0.3"
  },
  "devDependencies": {
    "@vitejs/plugin-basic-ssl": "^1.2.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5",
    "jsdom": "^24.1.1",
    "wrangler": "^3.66.0"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "WebWorker"],
    "types": ["@cloudflare/workers-types", "vitest/globals"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["src", "functions", "tests", "vite.config.ts"]
}
```

- [ ] **Step 3: Create Vite and test config**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"]
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
```

- [ ] **Step 4: Create Cloudflare config**

Create `wrangler.toml`:

```toml
name = "daily-news-briefing-site"
compatibility_date = "2026-06-29"
pages_build_output_dir = "dist"
```

- [ ] **Step 5: Create ignore file**

Create `.gitignore`:

```gitignore
node_modules/
dist/
.wrangler/
.env
.env.*
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies install without errors.

- [ ] **Step 7: Run baseline checks**

Run: `npm run typecheck`

Expected: TypeScript reports no source files or no type errors after source files are added in later tasks. If it reports no inputs at this stage, continue to Task 2.

## Task 2: Shared Date and Type Helpers

**Files:**
- Create: `src/shared/dates.ts`
- Create: `src/shared/types.ts`
- Create: `tests/dates.test.ts`

- [ ] **Step 1: Write date helper tests**

Create `tests/dates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatHongKongDate, isValidIsoDate } from "../src/shared/dates";

describe("date helpers", () => {
  it("formats dates in Asia/Hong_Kong", () => {
    const date = new Date("2026-06-28T16:30:00.000Z");
    expect(formatHongKongDate(date)).toBe("2026-06-29");
  });

  it("accepts YYYY-MM-DD dates", () => {
    expect(isValidIsoDate("2026-06-29")).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(isValidIsoDate("2026-6-29")).toBe(false);
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/dates.test.ts`

Expected: FAIL because `src/shared/dates.ts` does not exist.

- [ ] **Step 3: Create date helpers**

Create `src/shared/dates.ts`:

```ts
export function formatHongKongDate(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return parsed.toISOString().slice(0, 10) === value;
}
```

- [ ] **Step 4: Create shared types**

Create `src/shared/types.ts`:

```ts
export interface BriefingResponse {
  date: string;
  markdown: string;
  cached: boolean;
  generatedAt: string;
}

export interface BriefingErrorResponse {
  error: string;
  message: string;
}

export interface GenerateBriefingInput {
  date: string;
  force: boolean;
}
```

- [ ] **Step 5: Run date tests**

Run: `npm test -- tests/dates.test.ts`

Expected: PASS.

## Task 3: Briefing Prompt Builder

**Files:**
- Create: `src/shared/briefingPrompt.ts`
- Create: `tests/briefingPrompt.test.ts`

- [ ] **Step 1: Write prompt tests**

Create `tests/briefingPrompt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildBriefingPrompt } from "../src/shared/briefingPrompt";

describe("buildBriefingPrompt", () => {
  it("includes the requested date and fixed sections", () => {
    const prompt = buildBriefingPrompt("2026-06-29");
    expect(prompt).toContain("# 每日国际新闻双语简报 - 2026-06-29");
    expect(prompt).toContain("## 1. 金融相关信息 / Finance and Markets");
    expect(prompt).toContain("## 2. 主要市场指数走势 / Major Market Index Performance");
    expect(prompt).toContain("## 3. AI 相关新闻 / AI News");
    expect(prompt).toContain("## 4. 热点信息与大公司事件 / Major Companies and Global Hot Topics");
    expect(prompt).toContain("## 5. 国际政治新闻 / International Politics");
    expect(prompt).toContain("## 今日重点观察 / Key Watch");
  });

  it("requires active retrieval, bilingual summaries, and source links", () => {
    const prompt = buildBriefingPrompt("2026-06-29");
    expect(prompt).toContain("必须主动检索最新信息");
    expect(prompt).toContain("中文摘要 2-4 句");
    expect(prompt).toContain("English summary 2-4 sentences");
    expect(prompt).toContain("来源链接");
  });

  it("includes the market index coverage list", () => {
    const prompt = buildBriefingPrompt("2026-06-29");
    expect(prompt).toContain("Dow Jones Industrial Average");
    expect(prompt).toContain("S&P 500");
    expect(prompt).toContain("Nasdaq Composite");
    expect(prompt).toContain("Shanghai Composite");
    expect(prompt).toContain("Hang Seng Index");
    expect(prompt).toContain("Singapore STI");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/briefingPrompt.test.ts`

Expected: FAIL because `src/shared/briefingPrompt.ts` does not exist.

- [ ] **Step 3: Create prompt builder**

Create `src/shared/briefingPrompt.ts`:

```ts
export function buildBriefingPrompt(date: string): string {
  return `请生成今日国际新闻双语 Markdown 简报。

时间与范围：
- 简报日期：${date}
- 以该日期 Asia/Hong_Kong 时间为准，优先整理过去 24 小时内的最新国际新闻。
- 必须主动检索最新信息，不要依赖旧知识。
- 主要参考 Bloomberg、CNBC、The Wall Street Journal、Financial Times；如遇付费墙或无法访问全文，允许用 Reuters、AP、官方公告、公司新闻稿、央行/政府官网、监管机构官网等公开来源补足。
- 每条新闻都要附来源链接；如多个来源互相印证，可列 1-2 个关键来源。

输出格式：
- 仅输出 Markdown。
- 使用中文为主，英文并列。
- 每条新闻必须包含：中文标题、English title、中文摘要 2-4 句、English summary 2-4 sentences、来源链接。
- 摘要要包含新闻内容和关键事实，不要只提取标题或一句核心观点。
- 内容要简洁但准确，避免夸张和无来源判断。
- 如某条信息仍在发展中，请明确写“仍在发展中 / developing”。

固定结构：
# 每日国际新闻双语简报 - ${date}

## 1. 金融相关信息 / Finance and Markets
整理 10 条。偏向全球主要市场：美国、日本、新加坡、欧盟、中国、香港。覆盖宏观经济、央行/利率、财政与监管政策、汇率、股市、债市、大宗商品、银行与金融机构、跨境资本流动等。

## 2. 主要市场指数走势 / Major Market Index Performance
统计美股、中国股市、其他主要市场的指数走势情况。

必须覆盖：
- U.S. equities: Dow Jones Industrial Average, S&P 500, Nasdaq Composite
- Chinese equities: Shanghai Composite, Shenzhen Component 或 CSI 300, Hang Seng Index, Hang Seng Tech Index
- Other major markets: Nikkei 225, TOPIX, STOXX Europe 600 或 Euro Stoxx 50, FTSE 100, Singapore STI，以及当天重要的其他区域指数

每个指数包含：最新点位、日涨跌幅、简短中文解读、brief English note、数据来源链接。如果市场休市，标注“最近收盘 / latest close”。

## 3. AI 相关新闻 / AI News
整理 5 条。关注 AI 前沿报道、模型/芯片/云基础设施、监管、投融资、企业产品发布、产业落地和安全治理。

## 4. 热点信息与大公司事件 / Major Companies and Global Hot Topics
整理 5 条。选择全球最热门、影响面较大的公司或热点事件，优先覆盖大型科技、能源、汽车、消费、制药、航运、并购、监管调查等。

## 5. 国际政治新闻 / International Politics
整理 5 条。覆盖全球重要政治、外交、安全、选举、制裁、贸易摩擦、地缘冲突等。

## 今日重点观察 / Key Watch
用 3-5 条 bullet 总结当天最值得继续关注的线索。

质量要求：
- 金融部分必须尽量平衡覆盖美国、日本、新加坡、欧盟、中国、香港；如果某一地区当天没有足够重要新闻，可以用其他全球市场新闻补足，并在摘要中体现原因。
- 不要编造无法核实的细节。对数据、日期、金额、涨跌幅、政策名称、机构名称要核对来源。
- 不要输出过程性说明；如果某来源不可用，直接使用公开可靠来源补足。`;
}
```

- [ ] **Step 4: Run prompt tests**

Run: `npm test -- tests/briefingPrompt.test.ts`

Expected: PASS.

## Task 4: Worker API With Cache and Auth

**Files:**
- Create: `functions/api/briefing.ts`
- Create: `tests/briefingApi.test.ts`

- [ ] **Step 1: Write API tests**

Create `tests/briefingApi.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { onRequestGet } from "../functions/api/briefing";

class MemoryKV {
  store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
}

function createContext(url: string, env: Record<string, unknown>) {
  return {
    request: new Request(url),
    env,
    waitUntil: vi.fn(),
    next: vi.fn(),
    data: {},
    params: {}
  };
}

describe("briefing API", () => {
  it("returns cached content when force is false", async () => {
    const kv = new MemoryKV();
    await kv.put("briefing:2026-06-29", JSON.stringify({
      date: "2026-06-29",
      markdown: "# cached",
      cached: true,
      generatedAt: "2026-06-29T00:00:00.000Z"
    }));

    const response = await onRequestGet(createContext("https://example.com/api/briefing?date=2026-06-29", {
      BRIEFINGS_KV: kv
    }) as never);
    const body = await response.json() as { markdown: string; cached: boolean };

    expect(response.status).toBe(200);
    expect(body.markdown).toBe("# cached");
    expect(body.cached).toBe(true);
  });

  it("requires admin token for forced refresh when ADMIN_TOKEN is set", async () => {
    const response = await onRequestGet(createContext("https://example.com/api/briefing?date=2026-06-29&force=true", {
      BRIEFINGS_KV: new MemoryKV(),
      ADMIN_TOKEN: "secret"
    }) as never);

    expect(response.status).toBe(401);
  });

  it("generates and stores a fallback briefing when no model key is configured", async () => {
    const kv = new MemoryKV();
    const response = await onRequestGet(createContext("https://example.com/api/briefing?date=2026-06-29&force=true", {
      BRIEFINGS_KV: kv
    }) as never);
    const body = await response.json() as { markdown: string; cached: boolean };

    expect(response.status).toBe(200);
    expect(body.cached).toBe(false);
    expect(body.markdown).toContain("# 每日国际新闻双语简报 - 2026-06-29");
    expect(await kv.get("briefing:2026-06-29")).toContain("每日国际新闻双语简报");
  });
});
```

- [ ] **Step 2: Run API tests to verify failure**

Run: `npm test -- tests/briefingApi.test.ts`

Expected: FAIL because `functions/api/briefing.ts` does not exist.

- [ ] **Step 3: Create Worker API**

Create `functions/api/briefing.ts`:

```ts
import { buildBriefingPrompt } from "../../src/shared/briefingPrompt";
import { formatHongKongDate, isValidIsoDate } from "../../src/shared/dates";
import type { BriefingErrorResponse, BriefingResponse } from "../../src/shared/types";

interface Env {
  BRIEFINGS_KV: KVNamespace;
  ADMIN_TOKEN?: string;
  OPENAI_API_KEY?: string;
}

interface PagesContextWithEnv {
  request: Request;
  env: Env;
}

function jsonResponse(body: BriefingResponse | BriefingErrorResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function isAuthorized(request: Request, env: Env): boolean {
  if (!env.ADMIN_TOKEN) {
    return true;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${env.ADMIN_TOKEN}`;
}

async function generateBriefing(date: string, env: Env): Promise<string> {
  const prompt = buildBriefingPrompt(date);

  if (!env.OPENAI_API_KEY) {
    return `${prompt}

> 本地预览内容：部署后配置 OPENAI_API_KEY，后端将使用实时检索和生成能力产出完整简报。`;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      input: prompt,
      tools: [{ type: "web_search_preview" }]
    })
  });

  if (!response.ok) {
    throw new Error(`Generation failed with status ${response.status}`);
  }

  const data = await response.json() as { output_text?: string };
  if (!data.output_text) {
    throw new Error("Generation response did not include output_text");
  }
  return data.output_text;
}

export async function onRequestGet(context: PagesContextWithEnv): Promise<Response> {
  const url = new URL(context.request.url);
  const requestedDate = url.searchParams.get("date") ?? formatHongKongDate();
  const force = url.searchParams.get("force") === "true";

  if (!isValidIsoDate(requestedDate)) {
    return jsonResponse({ error: "invalid_date", message: "Date must use YYYY-MM-DD format." }, 400);
  }

  if (force && !isAuthorized(context.request, context.env)) {
    return jsonResponse({ error: "unauthorized", message: "Update token is required." }, 401);
  }

  const key = `briefing:${requestedDate}`;
  const cached = await context.env.BRIEFINGS_KV.get(key);
  if (cached && !force) {
    return jsonResponse({ ...JSON.parse(cached), cached: true });
  }

  try {
    const markdown = await generateBriefing(requestedDate, context.env);
    const body: BriefingResponse = {
      date: requestedDate,
      markdown,
      cached: false,
      generatedAt: new Date().toISOString()
    };
    await context.env.BRIEFINGS_KV.put(key, JSON.stringify(body));
    return jsonResponse(body);
  } catch {
    if (cached) {
      return jsonResponse({ ...JSON.parse(cached), cached: true });
    }
    return jsonResponse({
      error: "generation_failed",
      message: "Generation failed and no cached briefing is available for this date."
    }, 502);
  }
}
```

- [ ] **Step 4: Run API tests**

Run: `npm test -- tests/briefingApi.test.ts`

Expected: PASS.

## Task 5: Frontend App

**Files:**
- Create: `index.html`
- Create: `src/app/main.ts`
- Create: `src/app/styles.css`
- Create: `tests/app.test.ts`

- [ ] **Step 1: Write frontend tests**

Create `tests/app.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("frontend app", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="briefing-date" />
      <input id="admin-token" />
      <button id="load-button"></button>
      <button id="refresh-button"></button>
      <button id="copy-button"></button>
      <button id="download-button"></button>
      <div id="status"></div>
      <pre id="markdown-output"></pre>
    `;
    vi.resetModules();
  });

  it("loads briefing markdown into the page", async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({
      date: "2026-06-29",
      markdown: "# briefing",
      cached: true,
      generatedAt: "2026-06-29T00:00:00.000Z"
    }), { headers: { "content-type": "application/json" } })) as never;

    const { initializeApp } = await import("../src/app/main");
    initializeApp();
    document.querySelector<HTMLButtonElement>("#load-button")?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#markdown-output")?.textContent).toBe("# briefing");
    expect(document.querySelector("#status")?.textContent).toContain("已加载");
  });

  it("sends admin token when refreshing", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      date: "2026-06-29",
      markdown: "# refreshed",
      cached: false,
      generatedAt: "2026-06-29T00:00:00.000Z"
    }), { headers: { "content-type": "application/json" } }));
    globalThis.fetch = fetchMock as never;

    const { initializeApp } = await import("../src/app/main");
    document.querySelector<HTMLInputElement>("#briefing-date")!.value = "2026-06-29";
    document.querySelector<HTMLInputElement>("#admin-token")!.value = "secret";
    initializeApp();
    document.querySelector<HTMLButtonElement>("#refresh-button")?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe("Bearer secret");
    expect(document.querySelector("#markdown-output")?.textContent).toBe("# refreshed");
  });
});
```

- [ ] **Step 2: Run frontend tests to verify failure**

Run: `npm test -- tests/app.test.ts`

Expected: FAIL because `src/app/main.ts` does not exist.

- [ ] **Step 3: Create app shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>每日国际新闻双语简报</title>
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <div>
          <h1>每日国际新闻双语简报</h1>
          <p>Daily International Bilingual News Briefing</p>
        </div>
        <div class="controls">
          <label>
            日期
            <input id="briefing-date" type="date" />
          </label>
          <label>
            更新口令
            <input id="admin-token" type="password" autocomplete="current-password" />
          </label>
          <button id="load-button" type="button">加载</button>
          <button id="refresh-button" type="button">更新今日简报</button>
        </div>
      </header>
      <section class="actions">
        <p id="status">准备就绪</p>
        <button id="copy-button" type="button">复制 Markdown</button>
        <button id="download-button" type="button">下载 .md</button>
      </section>
      <pre id="markdown-output" class="markdown-output"></pre>
    </main>
    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: Create frontend behavior**

Create `src/app/main.ts`:

```ts
import "./styles.css";
import { formatHongKongDate } from "../shared/dates";
import type { BriefingErrorResponse, BriefingResponse } from "../shared/types";

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
}

async function requestBriefing(force: boolean): Promise<void> {
  const dateInput = getElement<HTMLInputElement>("briefing-date");
  const tokenInput = getElement<HTMLInputElement>("admin-token");
  const output = getElement<HTMLPreElement>("markdown-output");
  const status = getElement<HTMLParagraphElement>("status");
  const date = dateInput.value || formatHongKongDate();

  status.textContent = force ? "正在生成新的简报..." : "正在加载简报...";

  const headers: Record<string, string> = {};
  if (force && tokenInput.value.trim()) {
    headers.authorization = `Bearer ${tokenInput.value.trim()}`;
    window.localStorage.setItem("briefing-admin-token", tokenInput.value.trim());
  }

  const response = await fetch(`/api/briefing?date=${encodeURIComponent(date)}&force=${String(force)}`, { headers });
  const body = await response.json() as BriefingResponse | BriefingErrorResponse;

  if (!response.ok || "error" in body) {
    status.textContent = "生成失败，请稍后重试。";
    return;
  }

  output.textContent = body.markdown;
  status.textContent = body.cached ? `已加载 ${body.date} 缓存简报` : `已更新 ${body.date} 简报`;
}

async function copyMarkdown(): Promise<void> {
  const output = getElement<HTMLPreElement>("markdown-output");
  const status = getElement<HTMLParagraphElement>("status");
  await navigator.clipboard.writeText(output.textContent ?? "");
  status.textContent = "Markdown 已复制";
}

function downloadMarkdown(): void {
  const date = getElement<HTMLInputElement>("briefing-date").value || formatHongKongDate();
  const output = getElement<HTMLPreElement>("markdown-output");
  const blob = new Blob([output.textContent ?? ""], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `daily-news-briefing-${date}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function initializeApp(): void {
  const dateInput = getElement<HTMLInputElement>("briefing-date");
  const tokenInput = getElement<HTMLInputElement>("admin-token");
  dateInput.value ||= formatHongKongDate();
  tokenInput.value = window.localStorage.getItem("briefing-admin-token") ?? "";

  getElement<HTMLButtonElement>("load-button").addEventListener("click", () => void requestBriefing(false));
  getElement<HTMLButtonElement>("refresh-button").addEventListener("click", () => void requestBriefing(true));
  getElement<HTMLButtonElement>("copy-button").addEventListener("click", () => void copyMarkdown());
  getElement<HTMLButtonElement>("download-button").addEventListener("click", downloadMarkdown);
}

if (typeof document !== "undefined") {
  initializeApp();
}
```

- [ ] **Step 5: Create responsive styles**

Create `src/app/styles.css`:

```css
:root {
  color: #16201f;
  background: #f6f7f4;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: #f6f7f4;
}

button,
input {
  font: inherit;
}

button {
  min-height: 40px;
  border: 1px solid #0f6b57;
  border-radius: 6px;
  padding: 0 14px;
  color: #ffffff;
  background: #0f6b57;
  cursor: pointer;
}

button:focus-visible,
input:focus-visible {
  outline: 3px solid #9ad8c7;
  outline-offset: 2px;
}

.shell {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0;
}

.topbar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #d7ded8;
}

h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

p {
  margin: 6px 0 0;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  align-items: end;
}

label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #40514d;
}

input {
  min-height: 40px;
  border: 1px solid #b8c5bf;
  border-radius: 6px;
  padding: 0 10px;
  background: #ffffff;
  color: #16201f;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
}

#status {
  min-height: 24px;
  margin: 0;
  color: #40514d;
}

.markdown-output {
  min-height: 62vh;
  margin: 0;
  padding: 18px;
  overflow: auto;
  white-space: pre-wrap;
  border: 1px solid #d7ded8;
  border-radius: 8px;
  background: #ffffff;
  color: #16201f;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .shell {
    width: min(100vw - 20px, 100%);
    padding: 14px 0;
  }

  h1 {
    font-size: 22px;
  }

  .actions {
    align-items: stretch;
  }

  .actions button {
    flex: 1 1 150px;
  }
}
```

- [ ] **Step 6: Run frontend tests**

Run: `npm test -- tests/app.test.ts`

Expected: PASS.

## Task 6: Full Verification and Local Preview

**Files:**
- Modify: none unless verification exposes a defect.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all test files pass.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: no TypeScript errors.

- [ ] **Step 3: Build production bundle**

Run: `npm run build`

Expected: Vite writes production files to `dist/` without errors.

- [ ] **Step 4: Start local preview**

Run: `npm run dev`

Expected: the app is reachable at `http://localhost:8787`.

- [ ] **Step 5: Manual browser checks**

Open `http://localhost:8787` and verify:

- The page loads on desktop width.
- The date defaults to the current Asia/Hong_Kong date.
- "加载" returns cached or fallback content from `/api/briefing`.
- "更新今日简报" uses the update token when entered.
- "复制 Markdown" copies the full text.
- "下载 .md" downloads `daily-news-briefing-YYYY-MM-DD.md`.
- Mobile width shows controls stacked without overlapping text.

## Task 7: Deployment Notes

**Files:**
- Create: `DEPLOYMENT.md`

- [ ] **Step 1: Create deployment guide**

Create `DEPLOYMENT.md`:

```md
# Deployment

## Cloudflare setup

1. Create a Cloudflare Pages project connected to this repository.
2. Create a KV namespace named `daily-news-briefings`.
3. In the Cloudflare Pages project settings, add a KV namespace binding named `BRIEFINGS_KV` and connect it to `daily-news-briefings`.
4. Add these Cloudflare Pages environment variables:
   - `OPENAI_API_KEY`: model provider key used by the Worker endpoint.
   - `ADMIN_TOKEN`: private token required when clicking "更新今日简报".
5. Build command: `npm run build`
6. Build output directory: `dist`

## Local commands

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

## Public usage

Open the deployed Pages URL on phone or desktop. Anyone with the link can read cached briefings. To refresh a date, enter the update token and click "更新今日简报".
```

- [ ] **Step 2: Verify docs mention required secrets**

Run: `rg -n "OPENAI_API_KEY|ADMIN_TOKEN|BRIEFINGS_KV|KV" DEPLOYMENT.md wrangler.toml`

Expected: output lists the required secret and KV names.

## Self-Review Checklist

- Spec coverage: Tasks cover fixed public site, update button, Markdown display, copy, download, daily cache, protected update token, backend prompt, and market-index module.
- Placeholder scan: Deployment-specific Cloudflare values are documented as dashboard steps, not written as fake IDs in source files.
- Type consistency: Shared response types are used by both API and frontend; prompt builder is imported by the API and tested directly.
- Known environment note: The current folder is not a Git repository, so implementation should not run commit steps unless the user initializes Git first.
