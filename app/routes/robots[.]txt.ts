import { withBase } from '~/lib/base';
import type { Route } from './+types/robots[.]txt';

export function loader({ request }: Route.LoaderArgs) {
	const origin = new URL(request.url).origin;
	const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}${withBase('/sitemap.xml')}\n`;
	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
}
