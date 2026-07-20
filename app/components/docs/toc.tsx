import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import type { TocEntry } from '~/lib/docs-types';
import { cn } from '~/lib/utils';

export function TableOfContents({ toc }: { toc: TocEntry[] }) {
	const items = toc.filter((entry) => entry.depth === 2 || entry.depth === 3);
	const [activeId, setActiveId] = useState<string>();

	useEffect(() => {
		let frame = 0;
		const updateActiveHeading = () => {
			frame = 0;
			let nextActiveId = items[0]?.id;
			for (const item of items) {
				const heading = document.getElementById(item.id);
				if (!heading || heading.getBoundingClientRect().top > 112) break;
				nextActiveId = item.id;
			}
			setActiveId(nextActiveId);
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(updateActiveHeading);
		};

		updateActiveHeading();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (frame) cancelAnimationFrame(frame);
		};
	}, [toc]);

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
								'-ml-px block border-l pl-4 transition-colors',
								activeId === entry.id
									? 'border-primary text-foreground'
									: 'border-transparent text-muted-foreground hover:border-primary hover:text-foreground',
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
