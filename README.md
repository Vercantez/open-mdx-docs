# open-mdx-docs

Mintlify-style MDX documentation you own. **Add it to any docs content repo**, then:

```bash
bunx open-mdx-docs dev
bunx open-mdx-docs deploy
```

- Mintlify-compatible `docs.json` / `mint.json` + MDX
- shadcn/ui + Tailwind v4 theming
- Content negotiation (`Accept: text/markdown` / `.md` URLs)
- Cloudflare AI Search in production, local search everywhere else
- Deploy to **Cloudflare Workers** or run on **Node**

## Add to your MDX docs repo

```bash
cd your-docs-repo
bun add -d open-mdx-docs
# or until published to npm:
# bun add -d github:Vercantez/open-mdx-docs

bunx open-mdx-docs init
bun install
bunx open-mdx-docs doctor
bunx open-mdx-docs dev
```

Your content stays Mintlify-shaped:

```
your-docs-repo/
  docs.json          # or mint.json
  getting-started/
  guides/
  open-mdx-docs.config.json
  package.json
```

Brand the site and add persistent sidebar destinations in `docs.json`:

```json
{
  "colors": { "primary": "oklch(0.55 0.2 250)" },
  "fonts": { "family": "Inter", "mono": "Geist Mono" },
  "navigation": {
    "global": {
      "anchors": [
        { "anchor": "Dashboard", "href": "https://example.com", "icon": "browser" }
      ]
    }
  }
}
```

Omit `colors` to keep the neutral zinc accent. Fonts load from Google Fonts unless `fonts.source` is set to `"none"`. For full shadcn control, place a `theme.css` file next to `docs.json`; its tokens override the framework defaults and the `colors` shortcut.

### MDX components

The renderer includes Mintlify-compatible cards, callouts, tabs, accordions, steps, code groups, fields, and frames. Changelog entries use `Update`:

```mdx
<Update label="July 21, 2026" description="Version 1.2">
### Faster search

Search results now include each page's navigation group.
</Update>
```

Keep `Update` labels unique within a page. Changelog pages use those labels, rather than their inner headings, for the table of contents. Cards also support a compact banner layout with `<Card horizontal>`.

Section headings include a link icon that copies the base-path-aware deep link while preserving normal hash navigation.

`navigation.global.anchors` render above the current tab's sidebar groups on desktop and mobile.

### Config (`open-mdx-docs.config.json`)

```json
{
  "basePath": "/docs",
  "docsDir": ".",
  "name": "my-docs",
  "aiSearchInstance": "my-docs",
  "routes": [
    { "pattern": "example.com/docs*", "zone_name": "example.com" }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `docsDir` | Folder with `docs.json` (default: auto-detect `.` or `docs/`) |
| `basePath` | URL prefix, e.g. `/docs` for `example.com/docs` |
| `name` | Cloudflare Worker name |
| `routes` | Wrangler routes for production |
| `aiSearchInstance` | Cloudflare AI Search instance name |

### Commands

| Command | Description |
| --- | --- |
| `open-mdx-docs dev` | Dev server with HMR |
| `open-mdx-docs build` | Build into `.open-mdx-docs/` |
| `open-mdx-docs start` | Node server for the production build |
| `open-mdx-docs deploy` | Build + `wrangler deploy` |
| `open-mdx-docs doctor` | Sanity-check content + toolchain |
| `open-mdx-docs init` | Scaffold scripts + config |

Flags: `--docs <dir>`, `--base-path <path>`, `--port <n>`, `--name <worker>`.

### Deploy (Cloudflare)

```bash
# real Node on PATH (not a bun→node shim)
bunx open-mdx-docs deploy
```

Uses routes from config. Build artifacts land in `.open-mdx-docs/` (gitignored).

### Content negotiation

```bash
curl -H "Accept: text/markdown" https://example.com/docs/quickstart
curl https://example.com/docs/quickstart.md
curl https://example.com/docs/llms.txt
```

## Developing this package

```bash
bun install
bun run dev          # uses ./docs example content
bun run typecheck
bun run build
```

## Publish to npm

```bash
npm login
npm publish --access public
```

Until then, consumers can depend on:

```json
"devDependencies": {
  "open-mdx-docs": "github:Vercantez/open-mdx-docs"
}
```

## License

MIT
