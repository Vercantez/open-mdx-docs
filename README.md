# Open MDX Docs

A Mintlify-style documentation site you own. Drop in MDX content, theme with shadcn/ui, deploy to **Cloudflare Workers** or **Node.js**. Agents that prefer Markdown get Markdown.

## Features

- Mintlify-compatible `docs.json` / `mint.json` navigation
- MDX pages with callouts, cards, tabs, steps, accordions, code groups
- shadcn/ui + Tailwind v4 theming (brand color from `docs.json`)
- Content negotiation: `Accept: text/markdown` or `.md` URLs return source
- `/llms.txt` and `/llms-full.txt` for agents
- Cloudflare AI Search for production search; static local index everywhere else
- One codebase → Cloudflare Workers or Node.js

## Quick start

```bash
bun install
bun run dev
```

Open `http://localhost:3000`. Content lives in `docs/`.

## Add to your MDX docs project

Point the build and server at your content directory:

```bash
DOCS_DIR=/path/to/your/docs bun run dev
DOCS_DIR=/path/to/your/docs bun run build
DOCS_DIR=/path/to/your/docs bun start
```

Your content directory needs:

```
docs/
  docs.json          # or mint.json
  index.mdx
  guides/...
```

## Deploy

### Cloudflare Workers

```bash
bunx wrangler login
bun run deploy
```

Then create an [AI Search](https://developers.cloudflare.com/ai-search/) instance with a **website** data source pointing at your deployed domain, name it `open-mdx-docs`, uncomment `ai_search_namespaces` in `wrangler.jsonc`, and redeploy.

### Node.js

```bash
bun run build
bun start
# PORT=8080 node server/node-server.mjs
```

## Content negotiation

```bash
curl -H "Accept: text/markdown" http://localhost:3000/quickstart
curl http://localhost:3000/quickstart.md
curl http://localhost:3000/llms.txt
```

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Dev server (Cloudflare Vite plugin) |
| `bun run build` | Production build |
| `bun run deploy` | Build + `wrangler deploy` |
| `bun run preview` | Preview production build with Wrangler |
| `bun start` | Node.js server |
| `bun run typecheck` | Typecheck |

## Project layout

```
app/           React Router app + shadcn components
docs/          Example MDX content + docs.json
vite/          MDX docs Vite plugin
workers/       Cloudflare Workers entry (content negotiation)
server/        Node.js server (content negotiation)
wrangler.jsonc Cloudflare config + AI Search binding
```
