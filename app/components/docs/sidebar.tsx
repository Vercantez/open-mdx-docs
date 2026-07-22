import { Link, NavLink } from 'react-router';
import { globalAnchors } from '~/lib/docs';
import type { NavAnchor, NavGroup, NavNode, NavPage } from '~/lib/docs-types';
import { resolveIcon } from '~/lib/icons';
import { cn } from '~/lib/utils';

function SidebarPage({ page, activeSlug }: { page: NavPage; activeSlug: string }) {
	return (
		<li>
			<NavLink
				to={`/${page.slug}`}
				className={cn(
					'block rounded-lg px-2 py-1.5 text-sm transition-colors',
					page.slug === activeSlug
						? 'bg-primary/10 font-medium text-primary'
						: 'text-muted-foreground hover:text-foreground',
				)}
			>
				{page.title}
			</NavLink>
		</li>
	);
}

function SidebarGroup({
	group,
	activeSlug,
	depth,
}: {
	group: NavGroup;
	activeSlug: string;
	depth: number;
}) {
	return (
		<li>
			<p
				className={cn(
					depth === 0
						? 'px-2 pb-1.5 text-sm font-semibold text-foreground'
						: 'px-2 pt-3 pb-1 text-[13px] font-semibold text-foreground',
				)}
			>
				{group.group}
			</p>
			<SidebarItems nodes={group.pages} activeSlug={activeSlug} depth={depth + 1} />
		</li>
	);
}

function SidebarItems({
	nodes,
	activeSlug,
	depth,
}: {
	nodes: NavNode[];
	activeSlug: string;
	depth: number;
}) {
	return (
		<ul className={cn('flex flex-col gap-0.5', depth > 1 && 'pl-4')}>
			{nodes.map((node) =>
				node.type === 'page' ? (
					<SidebarPage key={node.slug} page={node} activeSlug={activeSlug} />
				) : (
					<SidebarGroup key={node.group} group={node} activeSlug={activeSlug} depth={depth} />
				),
			)}
		</ul>
	);
}

function SidebarNodes({ nodes, activeSlug }: { nodes: NavNode[]; activeSlug: string }) {
	return (
		<ul className="flex flex-col gap-7">
			{nodes.map((node) =>
				node.type === 'page' ? (
					<SidebarPage key={node.slug} page={node} activeSlug={activeSlug} />
				) : (
					<SidebarGroup key={node.group} group={node} activeSlug={activeSlug} depth={0} />
				),
			)}
		</ul>
	);
}

function AnchorRow({ anchor }: { anchor: NavAnchor }) {
	const AnchorIcon = resolveIcon(anchor.icon);
	const external = /^(https?:)?\/\//.test(anchor.href);
	const className =
		'group flex items-center gap-2.5 px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';
	const contents = (
		<>
			<span className="flex size-6 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
				<AnchorIcon className="size-3.5" />
			</span>
			<span>{anchor.anchor}</span>
		</>
	);
	return external ? (
		<a href={anchor.href} target="_blank" rel="noreferrer" className={className}>
			{contents}
		</a>
	) : (
		<Link to={anchor.href} className={className}>
			{contents}
		</Link>
	);
}

export function SidebarNav({
	nodes,
	activeSlug,
	multiTab = false,
	sticky = true,
}: {
	nodes: NavNode[];
	activeSlug: string;
	multiTab?: boolean;
	sticky?: boolean;
}) {
	const anchors = globalAnchors();
	return (
		<nav
			className={cn(
				'docs-sidebar-scroll pr-3 pb-10',
				sticky && 'fixed w-60 overflow-y-auto pt-8',
				sticky &&
					(multiTab
						? 'top-[6.25rem] max-h-[calc(100svh-7.25rem)]'
						: 'top-14 max-h-[calc(100svh-4.5rem)]'),
			)}
		>
			{anchors.length > 0 ? (
				<div className="mb-6 flex flex-col">
					{anchors.map((anchor) => (
						<AnchorRow key={`${anchor.anchor}-${anchor.href}`} anchor={anchor} />
					))}
				</div>
			) : null}
			<SidebarNodes nodes={nodes} activeSlug={activeSlug} />
		</nav>
	);
}
