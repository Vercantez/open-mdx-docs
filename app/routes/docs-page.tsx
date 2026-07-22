import * as React from 'react';
import { useLoaderData } from 'react-router';
import { Pager } from '~/components/docs/pager';
import { TableOfContents } from '~/components/docs/toc';
import { withBase } from '~/lib/base';
import { adjacentPages, docsConfig, getPage, groupOf, navTabs } from '~/lib/docs';
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
	const articleRef = React.useRef<HTMLElement>(null);

	React.useEffect(() => {
		const article = articleRef.current;
		if (!article) return;
		const onClick = (event: MouseEvent) => {
			if (!(event.target instanceof Element)) return;
			const anchor = event.target.closest<HTMLAnchorElement>('.heading-anchor');
			if (!anchor || !article.contains(anchor)) return;
			const id = anchor.parentElement?.id;
			if (!id) return;
			const url = `${window.location.origin}${withBase(`/${slug}`)}#${id}`;
			void navigator.clipboard?.writeText(url).then(() => {
				anchor.setAttribute('data-copied', '');
				setTimeout(() => anchor.removeAttribute('data-copied'), 1500);
			});
		};
		article.addEventListener('click', onClick);
		return () => article.removeEventListener('click', onClick);
	}, [slug]);

	const page = getPage(slug);
	if (!page) return null;
	const { Component, toc } = page;
	const { prev, next } = adjacentPages(slug);
	const group = groupOf(slug);
	const multiTab = navTabs().length > 1;

	return (
		<div className="flex gap-8">
			<article ref={articleRef} className="prose prose-zinc prose-docs min-w-0 max-w-3xl flex-1 dark:prose-invert">
				<header className="mb-8 not-prose">
					{group ? <p className="mb-2 text-sm font-semibold text-primary">{group}</p> : null}
					<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
					{description ? (
						<p className="mt-2 text-lg text-muted-foreground">{description}</p>
					) : null}
				</header>
				<Component components={mdxComponents} />
				<Pager prev={prev} next={next} />
			</article>
			<TableOfContents toc={toc} multiTab={multiTab} />
		</div>
	);
}
