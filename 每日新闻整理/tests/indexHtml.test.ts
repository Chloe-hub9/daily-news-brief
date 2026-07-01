// @ts-expect-error This test runs in Vitest's Node runtime; the project does not ship Node types to the app.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("index.html", () => {
  it("loads CSS when opened directly and shows a local preview fallback message", () => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain('href="./src/app/styles.css"');
    expect(html).toContain("本地文件预览");
    expect(html).toContain("<style>");
    expect(html).toContain("生成新闻简报需要部署到 Cloudflare Pages");
  });
});
