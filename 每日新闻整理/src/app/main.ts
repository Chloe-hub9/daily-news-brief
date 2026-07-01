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

function setBusy(isBusy: boolean): void {
  getElement<HTMLButtonElement>("load-button").disabled = isBusy;
  getElement<HTMLButtonElement>("refresh-button").disabled = isBusy;
}

async function requestBriefing(force: boolean): Promise<void> {
  const dateInput = getElement<HTMLInputElement>("briefing-date");
  const tokenInput = getElement<HTMLInputElement>("admin-token");
  const output = getElement<HTMLPreElement>("markdown-output");
  const status = getElement<HTMLParagraphElement>("status");
  const date = dateInput.value || formatHongKongDate();

  if (window.location.protocol === "file:") {
    status.textContent = "当前是本地文件预览，无法连接后端生成简报。请部署到 Cloudflare Pages 后使用固定链接。";
    output.textContent = "本地文件预览只用于查看界面。生成新闻简报需要 Cloudflare Pages Function、BRIEFINGS_KV、OPENAI_API_KEY 和 ADMIN_TOKEN。";
    return;
  }

  setBusy(true);
  status.textContent = force ? "正在生成新的简报..." : "正在加载简报...";

  const headers: Record<string, string> = {};
  const token = tokenInput.value.trim();
  if (force && token) {
    headers.authorization = `Bearer ${token}`;
    window.localStorage.setItem("briefing-admin-token", token);
  }

  try {
    const response = await fetch(`/api/briefing?date=${encodeURIComponent(date)}&force=${String(force)}`, { headers });
    const body = (await response.json()) as BriefingResponse | BriefingErrorResponse;

    if (!response.ok || "error" in body) {
      status.textContent = "生成失败，请稍后重试。";
      return;
    }

    output.textContent = body.markdown;
    status.textContent = body.cached ? `已加载 ${body.date} 缓存简报` : `已更新 ${body.date} 简报`;
  } catch {
    status.textContent = "网络或服务暂不可用。";
  } finally {
    setBusy(false);
  }
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
  tokenInput.value ||= window.localStorage.getItem("briefing-admin-token") ?? "";

  if (window.location.protocol === "file:") {
    getElement<HTMLParagraphElement>("status").textContent = "本地文件预览：可查看界面，生成简报需要部署后使用。";
  } else {
    getElement<HTMLParagraphElement>("status").textContent = "准备就绪";
  }

  getElement<HTMLButtonElement>("load-button").addEventListener("click", () => void requestBriefing(false));
  getElement<HTMLButtonElement>("refresh-button").addEventListener("click", () => void requestBriefing(true));
  getElement<HTMLButtonElement>("copy-button").addEventListener("click", () => void copyMarkdown());
  getElement<HTMLButtonElement>("download-button").addEventListener("click", downloadMarkdown);
}

if (typeof document !== "undefined") {
  initializeApp();
}
