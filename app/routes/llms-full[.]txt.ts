import { rawMarkdown } from 'virtual:mdx-docs/raw';
import { docsConfig, flattenedPageSlugs, pageTitle } from '~/lib/docs';

export function loader() {
	const name = docsConfig.name ?? 'Documentation';
	const parts: string[] = [`# ${name}`, ''];
	for (const slug of flattenedPageSlugs()) {
		const raw = rawMarkdown[slug];
		if (!raw) continue;
		parts.push(`\n---\n\n<!-- Source: /${slug}.md -->\n`);
		parts.push(raw.trim(), '');
	}
	return new Response(parts.join('\n'), {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
}
