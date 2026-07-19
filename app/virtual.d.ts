declare module 'virtual:mdx-docs/config' {
	const config: import('~/lib/docs-types').DocsConfig;
	export default config;
}

declare module 'virtual:mdx-docs/pages' {
	export const pages: Record<string, import('~/lib/docs-types').DocsPageModule>;
	export const pageSlugs: string[];
}

declare module 'virtual:mdx-docs/raw' {
	export const rawMarkdown: Record<string, string>;
	export function getRawMarkdown(slug: string): string | undefined;
}

declare module 'virtual:mdx-docs/search-index' {
	const index: import('~/lib/docs-types').SearchIndexEntry[];
	export default index;
}
