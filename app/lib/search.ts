import searchIndex from 'virtual:mdx-docs/search-index';
import { pageTitle } from '~/lib/docs';
import type { SearchIndexEntry, SearchResult } from '~/lib/docs-types';

function tokenize(query: string): string[] {
	return query
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
}

function scoreEntry(entry: SearchIndexEntry, terms: string[]): number {
	const title = entry.title.toLowerCase();
	const headings = entry.headings.join(' ').toLowerCase();
	const text = entry.text.toLowerCase();
	let score = 0;
	for (const term of terms) {
		if (!term) continue;
		if (title.includes(term)) score += 10;
		if (headings.includes(term)) score += 4;
		const matches = text.split(term).length - 1;
		score += Math.min(matches, 10);
	}
	return score;
}

export function localSearch(query: string, limit = 10): SearchResult[] {
	const terms = tokenize(query);
	if (terms.length === 0) return [];
	return searchIndex
		.map((entry: SearchIndexEntry) => ({ entry, score: scoreEntry(entry, terms) }))
		.filter(({ score }: { score: number }) => score > 0)
		.sort((a: { score: number }, b: { score: number }) => b.score - a.score)
		.slice(0, limit)
		.map(({ entry, score }: { entry: SearchIndexEntry; score: number }) => ({
			slug: entry.slug,
			title: entry.title,
			description: entry.description,
			excerpt: entry.description || entry.text.slice(0, 160),
			score,
		}));
}

function keyToSlug(key: string): string | null {
	let value = key.trim();
	if (!value) return null;
	try {
		if (/^https?:\/\//.test(value)) {
			value = new URL(value).pathname;
		}
	} catch {
		return null;
	}
	value = value.replace(/^\/+|\/+$/g, '');
	value = value.replace(/\.(mdx?|html?|txt)$/i, '');
	return value || null;
}

function chunkTitle(chunk: AiSearchChunk, slug: string | null): string {
	const metadata = chunk.item.metadata ?? {};
	for (const key of ['title', 'heading', 'section']) {
		const value = metadata[key];
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	if (slug) return pageTitle(slug);
	const firstLine = chunk.text.split('\n').find((line) => line.trim());
	return firstLine?.trim().slice(0, 80) || 'Result';
}

export async function aiSearch(env: Env, query: string, limit = 10): Promise<SearchResult[] | null> {
	const namespace = env.AI_SEARCH;
	if (!namespace) return null;
	const instanceName = env.AI_SEARCH_INSTANCE ?? 'open-mdx-docs';
	const instance = namespace.get(instanceName);
	const response = await instance.search({
		query,
		ai_search_options: {
			retrieval: { max_num_results: Math.min(Math.max(limit * 2, 5), 50) },
			query_rewrite: { enabled: true },
		},
	});
	const bySlug = new Map<string, SearchResult>();
	for (const chunk of response.chunks ?? []) {
		const slug = keyToSlug(chunk.item?.key ?? '');
		const key = slug ?? chunk.id;
		const existing = bySlug.get(key);
		if (existing && (existing.score ?? 0) >= chunk.score) continue;
		bySlug.set(key, {
			slug: slug ?? '',
			title: chunkTitle(chunk, slug),
			excerpt: chunk.text.replace(/\s+/g, ' ').trim().slice(0, 200),
			score: chunk.score,
		});
	}
	return [...bySlug.values()]
		.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
		.slice(0, limit)
		.filter((result) => result.slug);
}
