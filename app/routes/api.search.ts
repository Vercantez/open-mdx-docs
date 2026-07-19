import { aiSearch, localSearch } from '~/lib/search';
import type { Route } from './+types/api.search';

export async function loader({ request, context }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const query = (url.searchParams.get('q') ?? '').trim();
	const limit = Math.min(Number(url.searchParams.get('limit')) || 10, 25);

	if (!query) {
		return Response.json({ query, source: 'none', results: [] });
	}

	const env = (context as { cloudflare?: { env?: Env } }).cloudflare?.env;
	if (env?.AI_SEARCH) {
		try {
			const results = await aiSearch(env, query, limit);
			if (results) {
				return Response.json({ query, source: 'ai-search', results });
			}
		} catch {
			// fall back to the local index below
		}
	}

	return Response.json({ query, source: 'local', results: localSearch(query, limit) });
}
