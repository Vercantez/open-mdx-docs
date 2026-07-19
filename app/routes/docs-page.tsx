import { useLoaderData } from 'react-router';
import { Pager } from '~/components/docs/pager';
import { TableOfContents } from '~/components/docs/toc';
import { adjacentPages, docsConfig, getPage } from '~/lib/docs';
import { mdxComponents } from '~/lib/mdx-components';
import type { Route } from './+types/docs-page';

export function loader({ params }: Route.LoaderArgs) {
	const slug = (params['*'] ?? '').replace(/\/+$/g, '');
	const page = getPage(slug);
	if (!page) {
		throw new Response('Not found', { status: 404 });
	}
	return {
		slug,
		title: page.frontmatter.title ?? slug,
		description: page.frontmatter.description ?? '',
	};
}

export function meta({ data }: Route.MetaArgs) {
	if (!data) return [{ title: docsConfig.name ?? 'Docs' }];
	const siteName = docsConfig.name ?? 'Docs';
	return [
		{ title: `${data.title} | ${siteName}` },
		...(data.description ? [{ name: 'description', content: data.description }] : []),
	];
}

export default function DocsPage() {
	const { slug, title, description } = useLoaderData<typeof loader>();
	const page = getPage(slug);
	if (!page) return null;
	const { Component, toc } = page;
	const { prev, next } = adjacentPages(slug);

	return (
		<div className="flex gap-8">
			<article className="prose prose-zinc prose-docs min-w-0 max-w-3xl flex-1 dark:prose-invert">
				<header className="mb-8 not-prose">
					<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
					{description ? (
						<p className="mt-2 text-lg text-muted-foreground">{description}</p>
					) : null}
				</header>
				<Component components={mdxComponents} />
				<Pager prev={prev} next={next} />
			</article>
			<TableOfContents toc={toc} />
		</div>
	);
}
