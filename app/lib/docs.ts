import rawConfig from 'virtual:mdx-docs/config';
import { pages, pageSlugs } from 'virtual:mdx-docs/pages';
import type {
	DocsConfig,
	DocsPageModule,
	NavEntryRaw,
	NavGroup,
	NavNode,
	NavPage,
	NavTab,
} from '~/lib/docs-types';

export const docsConfig: DocsConfig = rawConfig;

export const allPages: Record<string, DocsPageModule> = pages;
export const allPageSlugs: string[] = pageSlugs;

export function getPage(slug: string): DocsPageModule | undefined {
	return allPages[slug];
}

export function pageTitle(slug: string): string {
	const page = allPages[slug];
	return page?.frontmatter.title ?? slug.split('/').pop() ?? slug;
}

function resolveNode(raw: NavEntryRaw): NavNode | null {
	if (typeof raw === 'string') {
		if (!allPages[raw]) return null;
		const page: NavPage = { type: 'page', slug: raw, title: pageTitle(raw) };
		return page;
	}
	const group: NavGroup = {
		type: 'group',
		group: raw.group,
		icon: raw.icon,
		pages: raw.pages
			.map(resolveNode)
			.filter((node): node is NavNode => node !== null),
	};
	return group.pages.length > 0 ? group : null;
}

function resolveGroup(raw: {
	group: string;
	icon?: string;
	pages?: NavEntryRaw[];
	openapi?: string;
}): NavGroup | null {
	const pages = (raw.pages ?? [])
		.map(resolveNode)
		.filter((node): node is NavNode => node !== null);
	// Skip OpenAPI-only groups (not rendered yet) and empty groups.
	if (pages.length === 0) return null;
	return {
		type: 'group',
		group: raw.group,
		icon: raw.icon,
		pages,
	};
}

export function navTabs(): NavTab[] {
	const navigation = docsConfig.navigation;
	if (!navigation) {
		return [
			{
				tab: 'Docs',
				nodes: allPageSlugs
					.map((slug) => resolveNode(slug))
					.filter((node): node is NavNode => node !== null),
			},
		];
	}
	if (navigation.tabs?.length) {
		return navigation.tabs
			.map((tab) => ({
				tab: tab.tab,
				icon: tab.icon,
				nodes: [
					...(tab.groups ?? []).map(resolveGroup).filter((g): g is NavGroup => g !== null),
					...(tab.pages ?? [])
						.map(resolveNode)
						.filter((node): node is NavNode => node !== null),
				],
			}))
			.filter((tab) => tab.nodes.length > 0);
	}
	const nodes: NavNode[] = [
		...(navigation.groups ?? []).map(resolveGroup).filter((g): g is NavGroup => g !== null),
		...(navigation.pages ?? [])
			.map(resolveNode)
			.filter((node): node is NavNode => node !== null),
	];
	return [{ tab: 'Docs', nodes }];
}

function flattenNodes(nodes: NavNode[], out: string[]) {
	for (const node of nodes) {
		if (node.type === 'page') out.push(node.slug);
		else flattenNodes(node.pages, out);
	}
}

export function flattenedPageSlugs(): string[] {
	const out: string[] = [];
	for (const tab of navTabs()) flattenNodes(tab.nodes, out);
	return out;
}

export function firstPageSlug(): string {
	return flattenedPageSlugs()[0] ?? allPageSlugs[0] ?? 'index';
}

export function adjacentPages(slug: string): {
	prev?: { slug: string; title: string };
	next?: { slug: string; title: string };
} {
	const flat = flattenedPageSlugs();
	const index = flat.indexOf(slug);
	if (index === -1) return {};
	const prev = flat[index - 1];
	const next = flat[index + 1];
	return {
		prev: prev ? { slug: prev, title: pageTitle(prev) } : undefined,
		next: next ? { slug: next, title: pageTitle(next) } : undefined,
	};
}

export function primaryColor(): string {
	return docsConfig.colors?.primary ?? '#0d9373';
}

export function primaryColors(): { primary: string; light: string; dark: string } {
	const primary = primaryColor();
	return {
		primary,
		light: docsConfig.colors?.light ?? primary,
		dark: docsConfig.colors?.dark ?? primary,
	};
}
