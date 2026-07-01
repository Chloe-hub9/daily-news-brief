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
    localStorage.clear();
    vi.resetModules();
  });

  it("loads briefing markdown into the page", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          cached: true,
          date: "2026-06-29",
          generatedAt: "2026-06-29T00:00:00.000Z",
          markdown: "# briefing"
        }),
        { headers: { "content-type": "application/json" } }
      )
    ) as never;

    const { initializeApp } = await import("../src/app/main");
    initializeApp();
    document.querySelector<HTMLButtonElement>("#load-button")?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#markdown-output")?.textContent).toBe("# briefing");
    expect(document.querySelector("#status")?.textContent).toContain("已加载");
  });

  it("sends admin token when refreshing", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          cached: false,
          date: "2026-06-29",
          generatedAt: "2026-06-29T00:00:00.000Z",
          markdown: "# refreshed"
        }),
        { headers: { "content-type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as never;

    const { initializeApp } = await import("../src/app/main");
    document.querySelector<HTMLInputElement>("#briefing-date")!.value = "2026-06-29";
    document.querySelector<HTMLInputElement>("#admin-token")!.value = "secret";
    initializeApp();
    document.querySelector<HTMLButtonElement>("#refresh-button")?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>;
    expect(calls[0][1]?.headers).toMatchObject({ authorization: "Bearer secret" });
    expect(document.querySelector("#markdown-output")?.textContent).toBe("# refreshed");
  });
});
