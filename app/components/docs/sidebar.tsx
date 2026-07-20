import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router';
import type { NavNode } from '~/lib/docs-types';
import { cn } from '~/lib/utils';

function slugInTree(nodes: NavNode[], slug: string): boolean {
	return nodes.some((node) =>
		node.type === 'page' ? node.slug === slug : slugInTree(node.pages, slug),
	);
}

function SidebarNodes({
	nodes,
	activeSlug,
	depth = 0,
}: {
	nodes: NavNode[];
	activeSlug: string;
	depth?: number;
}) {
	return (
		<ul className={cn('flex flex-col gap-0.5', depth > 0 && 'ml-3 border-l pl-3')}>
			{nodes.map((node) =>
				node.type === 'page' ? (
					<li key={node.slug}>
						<NavLink
							to={`/${node.slug}`}
							className={cn(
								'block rounded-md px-2 py-1.5 text-sm transition-colors',
								node.slug === activeSlug
									? 'bg-primary/10 font-medium text-primary'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground',
							)}
						>
							{node.title}
						</NavLink>
					</li>
				) : (
					<li key={node.group}>
						<details className="group" open={slugInTree(node.pages, activeSlug) || depth === 0}>
							<summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent [&::-webkit-details-marker]:hidden">
								{node.group}
								<ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
							</summary>
							<div className="pt-0.5">
								<SidebarNodes nodes={node.pages} activeSlug={activeSlug} depth={depth + 1} />
							</div>
						</details>
					</li>
				),
			)}
		</ul>
	);
}

export function SidebarNav({ nodes, activeSlug }: { nodes: NavNode[]; activeSlug: string }) {
	return (
		<nav className="docs-sidebar-scroll sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto pr-3 pb-10">
			<SidebarNodes nodes={nodes} activeSlug={activeSlug} />
		</nav>
	);
}
