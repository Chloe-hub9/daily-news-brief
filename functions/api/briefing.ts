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

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
}

function jsonResponse(body: BriefingResponse | BriefingErrorResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function isAuthorized(request: Request, env: Env): boolean {
  if (!env.ADMIN_TOKEN) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

function extractOutputText(data: OpenAIResponse): string | null {
  if (data.output_text) {
    return data.output_text;
  }

  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n\n");

  return text || null;
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
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      input: prompt,
      model: "gpt-4.1",
      tools: [{ type: "web_search_preview" }]
    })
  });

  if (!response.ok) {
    throw new Error(`Generation failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = extractOutputText(data);
  if (!text) {
    throw new Error("Generation response did not include output_text");
  }

  return text;
}

export async function onRequestGet(context: PagesContextWithEnv): Promise<Response> {
  const url = new URL(context.request.url);
  const requestedDate = url.searchParams.get("date") ?? formatHongKongDate();
  const force = url.searchParams.get("force") === "true";

  if (!isValidIsoDate(requestedDate)) {
    return jsonResponse({ error: "invalid_date", message: "Date must use YYYY-MM-DD format." }, 400);
  }

  if (force && !context.env.ADMIN_TOKEN) {
    return jsonResponse(
      { error: "missing_admin_token", message: "ADMIN_TOKEN must be configured before updates are allowed." },
      500
    );
  }

  if (force && !isAuthorized(context.request, context.env)) {
    return jsonResponse({ error: "unauthorized", message: "Update token is required." }, 401);
  }

  const key = `briefing:${requestedDate}`;
  const cached = await context.env.BRIEFINGS_KV.get(key);

  if (cached && !force) {
    const body = JSON.parse(cached) as BriefingResponse;
    return jsonResponse({ ...body, cached: true });
  }

  if (!force && context.env.OPENAI_API_KEY) {
    return jsonResponse(
      {
        error: "briefing_not_found",
        message: "No cached briefing is available for this date. Use an authorized refresh to generate it."
      },
      404
    );
  }

  try {
    const markdown = await generateBriefing(requestedDate, context.env);
    const body: BriefingResponse = {
      cached: false,
      date: requestedDate,
      generatedAt: new Date().toISOString(),
      markdown
    };
    await context.env.BRIEFINGS_KV.put(key, JSON.stringify(body));
    return jsonResponse(body);
  } catch {
    if (cached) {
      const body = JSON.parse(cached) as BriefingResponse;
      return jsonResponse({ ...body, cached: true });
    }
    return jsonResponse(
      {
        error: "generation_failed",
        message: "Generation failed and no cached briefing is available for this date."
      },
      502
    );
  }
}
