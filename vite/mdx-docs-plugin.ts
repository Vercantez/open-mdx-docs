import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import { matter } from 'vfile-matter';
import type { Plugin, ViteDevServer } from 'vite';

const PAGE_EXTENSIONS = new Set(['.mdx', '.md']);
const VIRTUAL_PREFIX = 'virtual:mdx-docs/';
const RESOLVED_PREFIX = '\0mdx-docs:';
const PAGE_QUERY = '?mdxdocs';

export interface MdxDocsPluginOptions {
	contentDir?: string;
}

interface ScannedPage {
	slug: string;
	file: string;
}

interface TocEntry {
	depth: number;
	text: string;
	id: string;
}

function walk(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	const out: string[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (entry.isFile()) out.push(full);
	}
	return out.sort();
}

function slugForFile(contentDir: string, file: string): string {
	const rel = path.relative(contentDir, file).replace(/\\/g, '/');
	const noExt = rel.slice(0, rel.length - path.extname(rel).length);
	if (noExt === 'index') return 'index';
	if (noExt.endsWith('/index')) return noExt.slice(0, -'/index'.length);
	return noExt;
}

function extractToc(body: string): TocEntry[] {
	const tree = unified().use(remarkParse).use(remarkGfm).parse(body);
	const slugger = new GithubSlugger();
	const toc: TocEntry[] = [];
	visit(tree, 'heading', (node: { depth: number }) => {
		const text = toString(node).trim();
		if (!text) return;
		toc.push({ depth: node.depth, text, id: slugger.slug(text) });
	});
	return toc;
}

function extractPlainText(body: string): string {
	const tree = unified().use(remarkParse).use(remarkGfm).parse(body);
	return toString(tree).replace(/\s+/g, ' ').trim().slice(0, 20000);
}

const MIME_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.pdf': 'application/pdf',
	'.json': 'application/json',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
};

export function mdxDocsPlugin(options: MdxDocsPluginOptions = {}): Plugin {
	const contentDir = path.resolve(options.contentDir ?? 'docs');

	let docsConfig: Record<string, unknown> = {};
	let pages: ScannedPage[] = [];
	let staticAssets: string[] = [];

	function loadConfig() {
		for (const name of ['docs.json', 'mint.json']) {
			const file = path.join(contentDir, name);
			if (fs.existsSync(file)) {
				try {
					docsConfig = JSON.parse(fs.readFileSync(file, 'utf8'));
				} catch (error) {
					throw new Error(`Failed to parse ${file}: ${(error as Error).message}`);
				}
				return;
			}
		}
		docsConfig = {};
	}

	function collectNavSlugs(node: unknown, out: Set<string>) {
		if (typeof node === 'string') {
			out.add(node);
			return;
		}
		if (Array.isArray(node)) {
			for (const item of node) collectNavSlugs(item, out);
			return;
		}
		if (node && typeof node === 'object') {
			const record = node as Record<string, unknown>;
			for (const key of ['pages', 'groups', 'tabs', 'anchors', 'dropdowns', 'languages', 'versions']) {
				if (key in record) collectNavSlugs(record[key], out);
			}
		}
	}

	function resolvePageFile(slug: string): string | null {
		for (const ext of ['.mdx', '.md']) {
			const direct = path.join(contentDir, slug + ext);
			if (fs.existsSync(direct)) return direct;
			const index = path.join(contentDir, slug, `index${ext}`);
			if (fs.existsSync(index)) return index;
		}
		return null;
	}

	function scan() {
		const files = walk(contentDir);
		const allPages = files
			.filter((file) => PAGE_EXTENSIONS.has(path.extname(file)))
			.map((file) => ({ slug: slugForFile(contentDir, file), file }));

		// Prefer navigation-listed pages so internal notes/plans in the content
		// repo are not compiled (Mintlify only ships nav pages in practice).
		const navSlugs = new Set<string>();
		const navigation = (docsConfig as { navigation?: unknown }).navigation;
		if (navigation) collectNavSlugs(navigation, navSlugs);

		const includeAll = process.env.OPEN_MDX_DOCS_ALL_PAGES === '1';
		if (!includeAll && navSlugs.size > 0) {
			pages = [];
			for (const slug of [...navSlugs].sort()) {
				const file = resolvePageFile(slug);
				if (file) pages.push({ slug, file });
				else console.warn(`[open-mdx-docs] nav page missing: ${slug}`);
			}
		} else {
			pages = allPages;
		}

		// Static assets: logos, images, css — never page sources / config.
		const skipNames = new Set(['docs.json', 'mint.json', 'package.json', 'package-lock.json', 'bun.lock']);
		staticAssets = files.filter((file) => {
			const ext = path.extname(file);
			const base = path.basename(file);
			if (PAGE_EXTENSIONS.has(ext)) return false;
			if (skipNames.has(base)) return false;
			// skip common non-asset trees
			const rel = path.relative(contentDir, file).replace(/\\/g, '/');
			if (rel.startsWith('node_modules/') || rel.startsWith('.git/')) return false;
			return true;
		});
	}

	async function compilePage(file: string): Promise<string> {
		const source = await fs.promises.readFile(file, 'utf8');
		const vfile = new VFile({ path: file, value: source });
		matter(vfile, { strip: true });
		const frontmatter = (vfile.data.matter ?? {}) as Record<string, unknown>;
		const body = String(vfile);
		const toc = extractToc(body);
		const injected = `\n\nexport const frontmatter = ${JSON.stringify(frontmatter)};\nexport const toc = ${JSON.stringify(toc)};\n`;
		const compiled = await compile(
			new VFile({ path: file, value: body + injected }),
			{
				// Force MDX so injected `export const frontmatter/toc` work for .md too.
				format: 'mdx',
				jsxImportSource: 'react',
				providerImportSource: undefined,
				remarkPlugins: [remarkGfm],
				rehypePlugins: [
					rehypeSlug,
					[
						rehypeAutolinkHeadings,
						{
							behavior: 'append',
							properties: {
								className: ['heading-anchor'],
								ariaLabel: 'Link to this section',
							},
							content: { type: 'text', value: '#' },
						},
					],
					[
						rehypeShiki,
						{
							themes: {
								light: 'github-light-default',
								dark: 'github-dark-default',
							},
						},
					],
				],
			},
		);
		// MDX emits a full ESM module (import jsx runtime + default export).
		return `${String(compiled)}\n`;
	}

	function pagesModule(): string {
		const imports = pages
			.map((page, i) => `import * as page_${i} from ${JSON.stringify(page.file + PAGE_QUERY)};`)
			.join('\n');
		const entries = pages
			.map(
				(page, i) =>
					`  ${JSON.stringify(page.slug)}: { slug: ${JSON.stringify(page.slug)}, frontmatter: page_${i}.frontmatter ?? {}, toc: page_${i}.toc ?? [], Component: page_${i}.default }`,
			)
			.join(',\n');
		return `${imports}\n\nexport const pages = {\n${entries}\n};\nexport const pageSlugs = ${JSON.stringify(pages.map((p) => p.slug))};\n`;
	}

	async function searchIndexModule(): Promise<string> {
		const entries = await Promise.all(
			pages.map(async (page) => {
				const source = await fs.promises.readFile(page.file, 'utf8');
				const vfile = new VFile({ path: page.file, value: source });
				matter(vfile, { strip: true });
				const fm = (vfile.data.matter ?? {}) as Record<string, unknown>;
				const body = String(vfile);
				return {
					slug: page.slug,
					title: typeof fm.title === 'string' ? fm.title : page.slug,
					description: typeof fm.description === 'string' ? fm.description : '',
					headings: extractToc(body).map((h) => h.text),
					text: extractPlainText(body),
				};
			}),
		);
		return `export default ${JSON.stringify(entries)};`;
	}

	function rawModule(): string {
		const imports = pages
			.map((page, i) => `import raw_${i} from ${JSON.stringify(page.file + '?raw')};`)
			.join('\n');
		const entries = pages.map((page, i) => `  ${JSON.stringify(page.slug)}: raw_${i}`).join(',\n');
		return `${imports}\n\nexport const rawMarkdown = {\n${entries}\n};\nexport function getRawMarkdown(slug) { return rawMarkdown[slug]; }\n`;
	}

	function invalidateAll(server: ViteDevServer) {
		loadConfig();
		scan();
		for (const environment of Object.values(server.environments)) {
			const graph = environment.moduleGraph;
			for (const mod of [...graph.idToModuleMap.keys()]) {
				if (mod.startsWith(RESOLVED_PREFIX) || mod.endsWith(PAGE_QUERY)) {
					const module = graph.getModuleById(mod);
					if (module) graph.invalidateModule(module);
				}
			}
		}
		server.ws.send({ type: 'full-reload' });
	}

	return {
		name: 'open-mdx-docs',
		enforce: 'pre',

		configResolved() {
			loadConfig();
			scan();
		},

		resolveId(id) {
			if (id.startsWith(VIRTUAL_PREFIX)) return RESOLVED_PREFIX + id;
			if (id.endsWith(PAGE_QUERY) && path.isAbsolute(id.slice(0, -PAGE_QUERY.length))) {
				return id;
			}
			return null;
		},

		load(id) {
			if (id.endsWith(PAGE_QUERY)) {
				const file = id.slice(0, -PAGE_QUERY.length);
				return compilePage(file);
			}
			if (!id.startsWith(RESOLVED_PREFIX)) return null;
			const name = id.slice(RESOLVED_PREFIX.length);
			switch (name) {
				case 'virtual:mdx-docs/config':
					return `export default ${JSON.stringify(docsConfig)};`;
				case 'virtual:mdx-docs/pages':
					return pagesModule();
				case 'virtual:mdx-docs/raw':
					return rawModule();
				case 'virtual:mdx-docs/search-index':
					return searchIndexModule();
				default:
					return null;
			}
		},

		configureServer(server) {
			server.watcher.add(contentDir);
			server.watcher.on('add', (file) => {
				if (file.startsWith(contentDir)) invalidateAll(server);
			});
			server.watcher.on('unlink', (file) => {
				if (file.startsWith(contentDir)) invalidateAll(server);
			});
			server.watcher.on('change', (file) => {
				if (
					file === path.join(contentDir, 'docs.json') ||
					file === path.join(contentDir, 'mint.json')
				) {
					invalidateAll(server);
				}
			});

			server.middlewares.use((req, res, next) => {
				const url = (req.url ?? '').split('?')[0];
				if (!url || req.method !== 'GET') return next();
				const rel = decodeURIComponent(url).replace(/^\/+/, '');
				if (!rel) return next();
				const file = path.join(contentDir, rel);
				if (!file.startsWith(contentDir) || !staticAssets.includes(file)) return next();
				res.setHeader('content-type', MIME_TYPES[path.extname(file)] ?? 'application/octet-stream');
				fs.createReadStream(file).pipe(res);
			});
		},

		generateBundle() {
			if (this.environment?.name !== 'client') return;
			for (const file of staticAssets) {
				const rel = path.relative(contentDir, file).replace(/\\/g, '/');
				this.emitFile({
					type: 'asset',
					fileName: rel,
					source: fs.readFileSync(file),
				});
			}
		},
	};
}
