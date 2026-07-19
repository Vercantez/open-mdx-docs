import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = path.join(rootDir, 'build', 'client');
const docsDir = process.env.DOCS_DIR ? path.resolve(process.env.DOCS_DIR) : path.join(rootDir, 'docs');
const port = Number(process.env.PORT ?? 3000);

const MIME_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.otf': 'font/otf',
	'.map': 'application/json',
};

function walk(dir) {
	if (!existsSync(dir)) return [];
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (entry.isFile()) out.push(full);
	}
	return out.sort();
}

const PAGE_EXTENSIONS = new Set(['.mdx', '.md']);
const slugToFile = new Map();
for (const file of walk(docsDir)) {
	const ext = path.extname(file);
	if (!PAGE_EXTENSIONS.has(ext)) continue;
	const rel = path.relative(docsDir, file).replace(/\\/g, '/');
	const noExt = rel.slice(0, rel.length - ext.length);
	const slug =
		noExt === 'index' ? 'index' : noExt.endsWith('/index') ? noExt.slice(0, -'/index'.length) : noExt;
	slugToFile.set(slug, file);
}

function firstPageSlug() {
	try {
		const config = JSON.parse(readFileSync(path.join(docsDir, 'docs.json'), 'utf8'));
		const navigation = config.navigation ?? {};
		const first =
			navigation.tabs?.[0]?.groups?.[0]?.pages?.[0] ??
			navigation.tabs?.[0]?.pages?.[0] ??
			navigation.groups?.[0]?.pages?.[0] ??
			navigation.pages?.[0];
		if (typeof first === 'string' && slugToFile.has(first)) return first;
	} catch {
		// fall through
	}
	return slugToFile.keys().next().value ?? 'index';
}

const MARKDOWN_TYPES = ['text/markdown', 'text/x-markdown', 'text/plain'];

function prefersMarkdown(acceptHeader) {
	if (!acceptHeader) return false;
	const accept = new Map();
	for (const part of acceptHeader.split(',')) {
		const [rawType, ...params] = part.split(';');
		const type = rawType.trim().toLowerCase();
		if (!type) continue;
		let q = 1;
		for (const param of params) {
			const [key, value] = param.split('=');
			if (key?.trim() === 'q') q = Number(value) || 0;
		}
		accept.set(type, Math.max(q, accept.get(type) ?? 0));
	}
	const markdown = Math.max(...MARKDOWN_TYPES.map((type) => accept.get(type) ?? 0));
	if (markdown <= 0) return false;
	const html = accept.get('text/html') ?? 0;
	const wildcard = accept.get('*/*') ?? accept.get('text/*') ?? 0;
	return markdown > html && markdown > wildcard;
}

function slugFromPathname(pathname) {
	let slug = pathname.replace(/^\/+|\/+$/g, '');
	if (!slug) return null;
	try {
		slug = decodeURIComponent(slug);
	} catch {
		return null;
	}
	if (slug.endsWith('.md')) return { slug: slug.slice(0, -3), explicit: true };
	if (slug.endsWith('.mdx')) return { slug: slug.slice(0, -4), explicit: true };
	if (slug.includes('.')) return null;
	return { slug, explicit: false };
}

async function markdownNegotiation(req, res, pathname) {
	if (req.method !== 'GET' && req.method !== 'HEAD') return false;
	const candidate = slugFromPathname(pathname);
	let slug = null;
	if (candidate?.explicit) slug = candidate.slug;
	else if (prefersMarkdown(req.headers.accept)) slug = candidate?.slug ?? firstPageSlug();
	if (!slug) return false;
	const file = slugToFile.get(slug);
	if (!file) return false;
	const raw = await readFile(file, 'utf8');
	res.writeHead(200, {
		'content-type': 'text/markdown; charset=utf-8',
		vary: 'Accept',
		'cache-control': 'public, max-age=300',
	});
	res.end(req.method === 'HEAD' ? undefined : raw);
	return true;
}

function serveFile(res, file, method) {
	res.writeHead(200, {
		'content-type': MIME_TYPES[path.extname(file)] ?? 'application/octet-stream',
		'cache-control': file.includes(`${path.sep}assets${path.sep}`)
			? 'public, max-age=31536000, immutable'
			: 'public, max-age=3600',
	});
	if (method === 'HEAD') return res.end();
	createReadStream(file).pipe(res);
}

function serveStatic(res, pathname, method) {
	const rel = pathname.replace(/^\/+/, '');
	if (!rel) return false;
	for (const base of [clientDir, docsDir]) {
		const file = path.join(base, rel);
		if (!file.startsWith(base)) continue;
		if (
			base === docsDir &&
			(PAGE_EXTENSIONS.has(path.extname(file)) ||
				['docs.json', 'mint.json'].includes(path.basename(file)))
		) {
			continue;
		}
		if (existsSync(file) && statSync(file).isFile()) {
			serveFile(res, file, method);
			return true;
		}
	}
	return false;
}

function nodeRequestToFetch(req) {
	const host = req.headers.host ?? `localhost:${port}`;
	const url = new URL(req.url ?? '/', `http://${host}`);
	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) {
			for (const item of value) headers.append(key, item);
		} else {
			headers.set(key, value);
		}
	}
	const init = { method: req.method, headers };
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		init.body = Readable.toWeb(req);
		init.duplex = 'half';
	}
	return new Request(url, init);
}

async function writeFetchResponse(webResponse, res) {
	const headers = {};
	webResponse.headers.forEach((value, key) => {
		if (key.toLowerCase() === 'transfer-encoding') return;
		headers[key] = value;
	});
	res.writeHead(webResponse.status, headers);
	if (!webResponse.body || res.req.method === 'HEAD') {
		res.end();
		return;
	}
	const nodeStream = Readable.fromWeb(webResponse.body);
	nodeStream.pipe(res);
}

const workerModule = await import(path.join(rootDir, 'build', 'server', 'index.js'));
const worker = workerModule.default ?? workerModule;

const emptyEnv = {
	AI_SEARCH_INSTANCE: process.env.AI_SEARCH_INSTANCE ?? 'open-mdx-docs',
};
const emptyCtx = {
	waitUntil() {},
	passThroughOnException() {},
};

const server = createServer(async (req, res) => {
	try {
		const pathname = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`).pathname;
		if (await markdownNegotiation(req, res, pathname)) return;
		if ((req.method === 'GET' || req.method === 'HEAD') && serveStatic(res, pathname, req.method)) {
			return;
		}
		const request = nodeRequestToFetch(req);
		const response = await worker.fetch(request, emptyEnv, emptyCtx);
		await writeFetchResponse(response, res);
	} catch (error) {
		console.error(error);
		if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
		res.end('Internal Server Error');
	}
});

server.listen(port, () => {
	console.log(`open-mdx-docs listening on http://localhost:${port}`);
	console.log(`Content directory: ${docsDir}`);
});
