import { Link } from 'react-router';
import type { TocEntry } from '~/lib/docs-types';
import { cn } from '~/lib/utils';

export function TableOfContents({ toc }: { toc: TocEntry[] }) {
	const items = toc.filter((entry) => entry.depth === 2 || entry.depth === 3);
	if (items.length === 0) return null;
	return (
		<nav className="docs-sidebar-scroll sticky top-16 hidden max-h-[calc(100svh-4rem)] w-56 shrink-0 overflow-y-auto pb-10 pl-6 xl:block">
			<p className="mb-3 text-sm font-medium">On this page</p>
			<ul className="flex flex-col gap-2 border-l text-sm">
				{items.map((entry) => (
					<li key={entry.id}>
						<Link
							to={`#${entry.id}`}
							className={cn(
								'-ml-px block border-l border-transparent pl-4 text-muted-foreground transition-colors hover:border-primary hover:text-foreground',
							)}
						>
							{entry.text}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
