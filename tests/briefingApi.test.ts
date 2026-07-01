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

type TestEnv = {
  BRIEFINGS_KV: MemoryKV;
  ADMIN_TOKEN?: string;
  OPENAI_API_KEY?: string;
};

function createContext(url: string, env: TestEnv, init?: RequestInit) {
  return {
    request: new Request(url, init),
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
    await kv.put(
      "briefing:2026-06-29",
      JSON.stringify({
        date: "2026-06-29",
        markdown: "# cached",
        cached: false,
        generatedAt: "2026-06-29T00:00:00.000Z"
      })
    );

    const response = await onRequestGet(
      createContext("https://example.com/api/briefing?date=2026-06-29", {
        BRIEFINGS_KV: kv
      }) as never
    );
    const body = (await response.json()) as { markdown: string; cached: boolean };

    expect(response.status).toBe(200);
    expect(body.markdown).toBe("# cached");
    expect(body.cached).toBe(true);
  });

  it("requires admin token for forced refresh when ADMIN_TOKEN is set", async () => {
    const response = await onRequestGet(
      createContext("https://example.com/api/briefing?date=2026-06-29&force=true", {
        BRIEFINGS_KV: new MemoryKV(),
        ADMIN_TOKEN: "secret"
      }) as never
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: "unauthorized"
    });
  });

  it("fails closed for forced refresh when ADMIN_TOKEN is not configured", async () => {
    const response = await onRequestGet(
      createContext("https://example.com/api/briefing?date=2026-06-29&force=true", {
        BRIEFINGS_KV: new MemoryKV()
      }) as never
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: "missing_admin_token"
    });
  });

  it("does not generate on public cache miss when a model key is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequestGet(
      createContext("https://example.com/api/briefing?date=2026-06-29", {
        BRIEFINGS_KV: new MemoryKV(),
        OPENAI_API_KEY: "model-key",
        ADMIN_TOKEN: "secret"
      }) as never
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      error: "briefing_not_found"
    });

    vi.unstubAllGlobals();
  });

  it("allows forced refresh with the configured admin token", async () => {
    const kv = new MemoryKV();
    const response = await onRequestGet(
      createContext(
        "https://example.com/api/briefing?date=2026-06-29&force=true",
        {
          BRIEFINGS_KV: kv,
          ADMIN_TOKEN: "secret"
        },
        {
          headers: {
            authorization: "Bearer secret"
          }
        }
      ) as never
    );
    const body = (await response.json()) as { cached: boolean; markdown: string };

    expect(response.status).toBe(200);
    expect(body.cached).toBe(false);
    expect(body.markdown).toContain("# 每日国际新闻双语简报 - 2026-06-29");
    expect(await kv.get("briefing:2026-06-29")).toContain("每日国际新闻双语简报");
  });

  it("generates and stores a fallback briefing when no model key is configured", async () => {
    const kv = new MemoryKV();
    const response = await onRequestGet(
      createContext(
        "https://example.com/api/briefing?date=2026-06-29&force=true",
        {
          BRIEFINGS_KV: kv,
          ADMIN_TOKEN: "secret"
        },
        {
          headers: {
            authorization: "Bearer secret"
          }
        }
      ) as never
    );
    const body = (await response.json()) as { markdown: string; cached: boolean };

    expect(response.status).toBe(200);
    expect(body.cached).toBe(false);
    expect(body.markdown).toContain("# 每日国际新闻双语简报 - 2026-06-29");
    expect(body.markdown).toContain("OPENAI_API_KEY");
    expect(await kv.get("briefing:2026-06-29")).toContain("每日国际新闻双语简报");
  });

  it("parses OpenAI raw response output text items", async () => {
    const kv = new MemoryKV();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            output: [
              {
                content: [
                  {
                    type: "output_text",
                    text: "# generated from raw response"
                  }
                ]
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    );

    const response = await onRequestGet(
      createContext(
        "https://example.com/api/briefing?date=2026-06-29&force=true",
        {
          BRIEFINGS_KV: kv,
          OPENAI_API_KEY: "model-key",
          ADMIN_TOKEN: "secret"
        },
        {
          headers: {
            authorization: "Bearer secret"
          }
        }
      ) as never
    );
    const body = (await response.json()) as { markdown: string };

    expect(response.status).toBe(200);
    expect(body.markdown).toBe("# generated from raw response");

    vi.unstubAllGlobals();
  });

  it("returns sanitized OpenAI error details when generation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: {
              message: "Incorrect API key provided",
              type: "invalid_request_error"
            }
          }),
          { status: 401, headers: { "content-type": "application/json" } }
        )
      )
    );

    const response = await onRequestGet(
      createContext(
        "https://example.com/api/briefing?date=2026-06-29&force=true",
        {
          BRIEFINGS_KV: new MemoryKV(),
          OPENAI_API_KEY: "bad-key",
          ADMIN_TOKEN: "secret"
        },
        {
          headers: {
            authorization: "Bearer secret"
          }
        }
      ) as never
    );
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(502);
    expect(body.message).toContain("OpenAI request failed with status 401");
    expect(body.message).toContain("Incorrect API key provided");

    vi.unstubAllGlobals();
  });

  it("rejects invalid dates", async () => {
    const response = await onRequestGet(
      createContext("https://example.com/api/briefing?date=2026-02-31", {
        BRIEFINGS_KV: new MemoryKV()
      }) as never
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "invalid_date"
    });
  });
});
