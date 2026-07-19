# Agent instructions

## Architecture

- **Content**: `docs/` (or `DOCS_DIR`) — Mintlify-style `docs.json` / `mint.json` + `.mdx` / `.md` pages.
- **Build**: `vite/mdx-docs-plugin.ts` compiles pages, extracts frontmatter/TOC, builds search index and raw Markdown map as virtual modules (`virtual:mdx-docs/*`).
- **UI**: React Router 7 + shadcn/ui + Tailwind v4. Theme tokens in `app/app.css`; brand color from `docs.json` `colors`.
- **Cloudflare entry**: `workers/app.ts` — content negotiation first, then React Router.
- **Node entry**: `server/node-server.mjs` — same negotiation from disk, static assets, then RR handler.

## Content negotiation (invariant)

- Always prefer Markdown when the client sends `Accept: text/markdown`, `text/x-markdown`, or `text/plain` with higher quality than `text/html`.
- Explicit `/{slug}.md` (and `.mdx`) always returns Markdown.
- Responses must set `Content-Type: text/markdown; charset=utf-8` and `Vary: Accept`.
- Negotiation runs in the server entry **before** React rendering on both Cloudflare and Node.

## Search (invariant)

- Cloudflare: binding name is **`AI_SEARCH`** (`ai_search_namespaces`). Instance name from `AI_SEARCH_INSTANCE` (default `open-mdx-docs`).
- Use `env.AI_SEARCH.get(instance).search({ query, ai_search_options })`.
- Local/Node/failure: static index from `virtual:mdx-docs/search-index`. Never require AI Search for the site to work.
- Do not add a custom indexing pipeline, Vectorize upload loop, or R2 document sync. Website crawler owns indexing on Cloudflare.

## Theming

- Keep Mintlify `colors` / `appearance` shape in `docs.json`.
- shadcn components live under `app/components/ui/`. Prefer adding via shadcn CLI patterns.
- Do not introduce named theme presets; one high-quality layout.

## After changes

```bash
bun run typecheck
bun run build
```
