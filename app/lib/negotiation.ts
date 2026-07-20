const MARKDOWN_TYPES = ['text/markdown', 'text/x-markdown', 'text/plain'];

function parseAccept(header: string | null): Map<string, number> {
	const map = new Map<string, number>();
	if (!header) return map;
	for (const part of header.split(',')) {
		const [rawType, ...params] = part.split(';');
		const type = rawType.trim().toLowerCase();
		if (!type) continue;
		let q = 1;
		for (const param of params) {
			const [key, value] = param.split('=');
			if (key?.trim() === 'q') {
				const parsed = Number(value);
				q = Number.isFinite(parsed) ? parsed : 0;
			}
		}
		map.set(type, Math.max(q, map.get(type) ?? 0));
	}
	return map;
}

export function prefersMarkdown(acceptHeader: string | null): boolean {
	const accept = parseAccept(acceptHeader);
	if (accept.size === 0) return false;
	const markdown = Math.max(...MARKDOWN_TYPES.map((type) => accept.get(type) ?? 0));
	if (markdown <= 0) return false;
	const html = accept.get('text/html') ?? 0;
	const wildcard = accept.get('*/*') ?? accept.get('text/*') ?? 0;
	return markdown > html && markdown > wildcard;
}

export function slugFromPathname(
	pathname: string,
): { slug: string; explicit: boolean } | null {
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

export function markdownResponse(raw: string): Response {
	return new Response(raw, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			vary: 'Accept',
			'cache-control': 'public, max-age=300',
		},
	});
}

export function negotiateMarkdown(
	request: Request,
	getRaw: (slug: string) => string | undefined,
	defaultSlug: string,
	/** Pathname with any mount prefix already stripped (e.g. "/quickstart"). */
	pathname?: string,
): Response | null {
	if (request.method !== 'GET' && request.method !== 'HEAD') return null;
	const url = new URL(request.url);
	const candidate = slugFromPathname(pathname ?? url.pathname);

	let slug: string | null = null;
	if (candidate?.explicit) {
		slug = candidate.slug;
	} else if (prefersMarkdown(request.headers.get('accept'))) {
		slug = candidate?.slug ?? defaultSlug;
	}
	if (!slug) return null;
	const raw = getRaw(slug);
	if (raw === undefined) return null;
	return markdownResponse(raw);
}
