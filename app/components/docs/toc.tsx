import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { TocEntry } from '~/lib/docs-types';
import { cn } from '~/lib/utils';

export function TableOfContents({ toc, multiTab = false }: { toc: TocEntry[]; multiTab?: boolean }) {
	const items = toc.filter((entry) => entry.depth === 2 || entry.depth === 3);
	const [activeId, setActiveId] = useState<string>();

	useEffect(() => {
		let frame = 0;
		const updateActiveHeading = () => {
			frame = 0;
			let nextActiveId = items[0]?.id;
			for (const item of items) {
				const heading = document.getElementById(item.id);
				if (!heading || heading.getBoundingClientRect().top > (multiTab ? 148 : 112)) break;
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
	}, [toc, multiTab]);

	if (items.length === 0) return null;
	return (
		<div className="hidden w-56 shrink-0 xl:block">
			<nav
				className={cn(
					'docs-sidebar-scroll fixed w-56 overflow-y-auto pt-8 pb-4 pl-6',
					multiTab
						? 'top-[6.25rem] max-h-[calc(100svh-7.25rem)]'
						: 'top-14 max-h-[calc(100svh-4.5rem)]',
				)}
			>
				<p className="mb-3 text-[13px] font-semibold">On this page</p>
				<ul className="flex flex-col gap-2.5 text-[13px]">
					{items.map((entry) => (
						<li key={entry.id}>
							<Link
								to={`#${entry.id}`}
								className={cn(
									'block text-muted-foreground transition-colors hover:text-foreground',
									entry.depth === 3 && 'pl-3',
									activeId === entry.id && 'font-medium text-primary',
								)}
							>
								{entry.text}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
}
