# Agent instructions

## Architecture

- **Content**: `docs/` (or `DOCS_DIR`) — Mintlify-style `docs.json` / `mint.json` + `.mdx` / `.md` pages.
- **Build**: `vite/mdx-docs-plugin.ts` compiles pages, extracts frontmatter/TOC, builds search index and raw Markdown map as virtual modules (`virtual:mdx-docs/*`).
- **UI**: React Router 7 + shadcn/ui + Tailwind v4. Framework defaults live in `app/app.css`; consumer theme tokens are compiled from `docs.json` and `theme.css` through `virtual:mdx-docs/theme.css`.
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
- `docs.json` `colors` is the compatibility shortcut for the accent trio. An optional `theme.css` next to `docs.json` loads last and can override any shadcn token.
- Optional `fonts.family` / `fonts.mono` values populate CSS variables and load from Google Fonts unless `fonts.source` is `none`.
- The framework fallback favicon is `public/open-mdx-docs-favicon.svg`; consumer asset names stay unreserved so configured content favicons win in dev and production.
- shadcn components live under `app/components/ui/`. Prefer adding via shadcn CLI patterns.
- Do not introduce named theme presets; one high-quality layout.

## Navigation and components

- Multi-tab sites render tabs in the horizontal header bar and only the active tab's groups in the flat sidebar.
- Desktop sidebar and table-of-contents rails are viewport-fixed inside reserved layout columns; the mobile drawer passes `sticky={false}` to keep its navigation in flow.
- `navigation.global.anchors` render above sidebar groups on desktop and mobile.
- Mintlify-compatible components are registered in `app/lib/mdx-components.tsx`, including the changelog `Update` component.
- `Card horizontal` renders a compact linked banner. `CardGroup` honors `cols` responsively and stretches orphaned cards so the final row has no empty cell.
- On pages containing `Update`, the table of contents uses the unique `Update` labels and ignores headings inside each entry.

## After changes

```bash
bun run typecheck
bun run build
```
