import { allPages, docsConfig, flattenedPageSlugs, pageTitle } from '~/lib/docs';

export function loader() {
	const name = docsConfig.name ?? 'Documentation';
	const description = docsConfig.description ?? '';
	const lines: string[] = [`# ${name}`, ''];
	if (description) lines.push(`> ${description}`, '');
	lines.push(
		'Every page is available as Markdown by appending `.md` to its URL or by sending `Accept: text/markdown`.',
		'',
		'## Pages',
		'',
	);
	for (const slug of flattenedPageSlugs()) {
		const page = allPages[slug];
		const desc = page?.frontmatter.description;
		lines.push(`- [${pageTitle(slug)}](/${slug}.md)${desc ? `: ${desc}` : ''}`);
	}
	return new Response(lines.join('\n') + '\n', {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
}
