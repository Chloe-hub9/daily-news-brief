# Public Daily News Briefing Site Design

## Goal

Build a public website that can be opened from both phone and desktop. The site provides a fixed URL where the user can click a button to generate or refresh the current day's international bilingual Markdown news briefing.

## Recommended Approach

Use Cloudflare Pages for the frontend and a Cloudflare Worker for the backend API.

This keeps the public link stable, avoids exposing API keys in browser code, and provides a lightweight place to cache the generated briefing for the day. The first version should be small and practical rather than a full content-management system.

## User Experience

The page opens directly to the briefing tool, not a marketing page.

The interface includes:

- A title: "每日国际新闻双语简报"
- A date selector defaulting to the current date in Asia/Hong_Kong
- An "更新今日简报" button
- A Markdown output area
- "复制 Markdown" and "下载 .md" actions
- A visible status line for loading, success, and generation errors

On mobile, controls stack above the Markdown output. On desktop, controls can stay compact at the top with the briefing below.

## Briefing Requirements

The generated Markdown follows the confirmed daily structure:

- 10 finance and markets items
- A market-index performance module covering U.S. equities, Chinese equities, and other major global markets
- 5 AI news items
- 5 major companies and global hot topics
- 5 international politics items
- 3-5 "今日重点观察 / Key Watch" bullets

Each item includes:

- Chinese title
- English title
- Chinese summary in 2-4 sentences
- English summary in 2-4 sentences
- Source link or links

The backend prompt must require active retrieval of current information and must mark developing stories with "仍在发展中 / developing".

The market-index module should be titled "主要市场指数走势 / Major Market Index Performance" and should appear after the finance and markets section. It should include:

- U.S. equities: Dow Jones Industrial Average, S&P 500, and Nasdaq Composite
- Chinese equities: Shanghai Composite, Shenzhen Component or CSI 300, Hang Seng Index, and Hang Seng Tech Index when available
- Other major markets: Nikkei 225, TOPIX, STOXX Europe 600 or Euro Stoxx 50, FTSE 100, Singapore STI, and other relevant regional benchmarks when important

For each index, include latest level, daily change percentage, and a concise bilingual note explaining the main driver when a reliable source provides one. If a market is closed, show the most recent close and label it clearly.

## Architecture

The system has three parts:

- Static frontend: HTML, CSS, and JavaScript deployed on Cloudflare Pages.
- Backend API: Cloudflare Worker endpoint, for example `/api/briefing?date=YYYY-MM-DD&force=false`.
- Storage/cache: Cloudflare KV or D1 stores one generated Markdown result per date.

Normal flow:

1. User opens the fixed public URL.
2. Frontend requests the cached briefing for today's HKT date.
3. If cached content exists, show it immediately.
4. If the user clicks "更新今日简报", call the backend with `force=true`.
5. Backend generates the Markdown, saves it under the date key, and returns it.

## Data Flow

The Worker owns all private configuration:

- OpenAI API key or equivalent model provider key
- Search/news retrieval configuration
- Market-data retrieval configuration for index levels and daily percentage changes
- Optional admin token if the update button should be protected

The browser never receives API keys. It only receives generated Markdown and status information.

## Access Control

The first design can support a public read page with protected updates.

Recommended behavior:

- Anyone with the link can read the latest cached briefing.
- Updating the briefing requires a simple admin token stored in the browser after the user enters it once.

This prevents random visitors from repeatedly triggering generation costs while preserving easy phone and desktop access for the user.

## Error Handling

The frontend shows plain-language states:

- Loading cached briefing
- Generating new briefing
- Briefing updated
- Generation failed; retry later

The backend returns structured errors but does not expose secret configuration, raw provider errors, or hidden prompts.

If generation fails, the page keeps showing the last cached version for that date when available.

## Testing

Before deployment:

- Verify the page renders on desktop and mobile widths.
- Verify "copy Markdown" copies the full output.
- Verify ".md" download uses the selected date in the filename.
- Verify cached content loads without regeneration.
- Verify forced update replaces the cached result.
- Verify API keys are only read from server-side environment variables.

## Out of Scope For First Version

- User accounts
- Multiple newsletter templates
- Email delivery
- Rich HTML article rendering
- Archive search across many dates
- Automatic scheduled generation on the website side

These can be added after the fixed-link update workflow is working reliably.
