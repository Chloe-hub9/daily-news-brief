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
