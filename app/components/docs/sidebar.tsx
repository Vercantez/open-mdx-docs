import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import { NavLink } from 'react-router';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import type { NavNode } from '~/lib/docs-types';
import { cn } from '~/lib/utils';

function slugInTree(nodes: NavNode[], slug: string): boolean {
	return nodes.some((node) =>
		node.type === 'page' ? node.slug === slug : slugInTree(node.pages, slug),
	);
}

function SidebarNodes({ nodes, activeSlug, depth = 0 }: { nodes: NavNode[]; activeSlug: string; depth?: number }) {
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
					<SidebarGroup key={node.group} node={node} activeSlug={activeSlug} depth={depth} />
				),
			)}
		</ul>
	);
}

function SidebarGroup({ node, activeSlug, depth }: { node: Extract<NavNode, { type: 'group' }>; activeSlug: string; depth: number }) {
	const containsActive = slugInTree(node.pages, activeSlug);
	const [open, setOpen] = React.useState(true);
	React.useEffect(() => {
		if (containsActive) setOpen(true);
	}, [containsActive]);

	return (
		<li>
			<Collapsible open={open} onOpenChange={setOpen}>
				<CollapsibleTrigger
					className={cn(
						'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent',
						containsActive ? 'text-foreground' : 'text-foreground/80',
					)}
				>
					{node.group}
					<ChevronRight
						className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-90')}
					/>
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-0.5">
					<SidebarNodes nodes={node.pages} activeSlug={activeSlug} depth={depth + 1} />
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
}

export function SidebarNav({ nodes, activeSlug }: { nodes: NavNode[]; activeSlug: string }) {
	return (
		<nav className="docs-sidebar-scroll sticky top-16 max-h-[calc(100svh-4rem)] overflow-y-auto pr-3 pb-10">
			<SidebarNodes nodes={nodes} activeSlug={activeSlug} />
		</nav>
	);
}
