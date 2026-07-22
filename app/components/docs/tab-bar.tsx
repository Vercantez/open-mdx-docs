import { Link } from 'react-router';
import { flattenNodes } from '~/lib/docs';
import type { NavTab } from '~/lib/docs-types';
import { cn } from '~/lib/utils';

export function TabBar({ tabs, activeTabName }: { tabs: NavTab[]; activeTabName: string }) {
	return (
		<div className="border-b">
			<nav className="docs-tab-bar-scroll mx-auto flex h-11 max-w-screen-2xl items-center gap-7 overflow-x-auto px-4 lg:px-6">
				{tabs.map((tab) => {
					const firstSlug = flattenNodes(tab.nodes)[0];
					if (!firstSlug) return null;
					const isActive = tab.tab === activeTabName;
					return (
						<Link
							key={tab.tab}
							to={`/${firstSlug}`}
							aria-current={isActive ? 'page' : undefined}
							className={cn(
								'relative flex h-11 shrink-0 items-center text-sm font-medium transition-colors',
								isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
							)}
						>
							{tab.tab}
							{isActive ? (
								<span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-primary" />
							) : null}
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
