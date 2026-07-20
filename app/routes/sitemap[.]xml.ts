import { withBase } from '~/lib/base';
import { docsConfig, flattenedPageSlugs } from '~/lib/docs';
import type { Route } from './+types/sitemap[.]xml';

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function loader({ request }: Route.LoaderArgs) {
	const origin = docsConfig.url ?? new URL(request.url).origin;
	const urls = flattenedPageSlugs()
		.map((slug) => {
			const loc = `${origin}${withBase(`/${slug}`)}`;
			return `  <url><loc>${escapeXml(loc)}</loc></url>`;
		})
		.join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	return new Response(xml, {
		headers: { 'content-type': 'application/xml; charset=utf-8' },
	});
}
