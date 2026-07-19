import type { ComponentType } from 'react';

export interface DocsFrontmatter {
	title?: string;
	description?: string;
	icon?: string;
	[key: string]: unknown;
}

export interface TocEntry {
	depth: number;
	text: string;
	id: string;
}

export interface DocsPageModule {
	slug: string;
	frontmatter: DocsFrontmatter;
	toc: TocEntry[];
	Component: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
}

export interface NavPage {
	type: 'page';
	slug: string;
	title: string;
}

export interface NavGroup {
	type: 'group';
	group: string;
	icon?: string;
	pages: NavNode[];
}

export type NavNode = NavPage | NavGroup;

export interface NavTab {
	tab: string;
	icon?: string;
	nodes: NavNode[];
}

export interface DocsConfig {
	name?: string;
	description?: string;
	logo?: string | { light?: string; dark?: string };
	favicon?: string;
	colors?: {
		primary?: string;
		light?: string;
		dark?: string;
	};
	appearance?: {
		default?: 'light' | 'dark' | 'system';
		strict?: boolean;
	};
	navigation?: {
		tabs?: Array<{
			tab: string;
			icon?: string;
			groups?: Array<{ group: string; icon?: string; pages: NavEntryRaw[] }>;
			pages?: NavEntryRaw[];
		}>;
		groups?: Array<{ group: string; icon?: string; pages: NavEntryRaw[] }>;
		pages?: NavEntryRaw[];
	};
	navbar?: {
		links?: Array<{ label: string; href: string }>;
		primary?: { type?: string; label?: string; href?: string };
	};
	footer?: {
		socials?: Record<string, string>;
	};
	url?: string;
	[key: string]: unknown;
}

export type NavEntryRaw = string | { group: string; icon?: string; pages: NavEntryRaw[] };

export interface SearchIndexEntry {
	slug: string;
	title: string;
	description: string;
	headings: string[];
	text: string;
}

export interface SearchResult {
	slug: string;
	title: string;
	description?: string;
	excerpt?: string;
	score?: number;
}
