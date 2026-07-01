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

This local Codex environment may not have `npm` on the default shell path. If that happens, use the bundled Node runtime or `pnpm` available in the Codex workspace dependencies.

## Public usage

Open the deployed Pages URL on phone or desktop. Anyone with the link can read cached briefings. To refresh a date, enter the update token and click "更新今日简报".
