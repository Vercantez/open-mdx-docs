import { ArrowRight, Menu } from 'lucide-react';
import * as React from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { ClientOnly } from '~/components/client-only';
import { SearchDialog } from '~/components/docs/search-dialog';
import { SidebarNav } from '~/components/docs/sidebar';
import { TabBar } from '~/components/docs/tab-bar';
import { ThemeToggle } from '~/components/docs/theme-toggle';
import { Button } from '~/components/ui/button';
import { stripBase, withBase } from '~/lib/base';
import { activeTab as resolveActiveTab, docsConfig, flattenNodes, navTabs } from '~/lib/docs';
import type { NavTab } from '~/lib/docs-types';
import { cn } from '~/lib/utils';

function assetUrl(path: string): string {
	if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
	return withBase(path.startsWith('/') ? path : `/${path}`);
}

function Logo() {
	const logo = docsConfig.logo;
	const name = docsConfig.name ?? 'Docs';
	if (typeof logo === 'string') {
		return <img src={assetUrl(logo)} alt={name} className="h-6" />;
	}
	if (logo && (logo.light || logo.dark)) {
		return (
			<>
				{logo.light ? <img src={assetUrl(logo.light)} alt={name} className="h-6 dark:hidden" /> : null}
				{logo.dark ? (
					<img src={assetUrl(logo.dark)} alt={name} className="hidden h-6 dark:block" />
				) : null}
			</>
		);
	}
	return <span className="text-base font-semibold tracking-tight">{name}</span>;
}

function MobileNav({
	tabs,
	currentTab,
	activeSlug,
	multiTab,
}: {
	tabs: NavTab[];
	currentTab: NavTab;
	activeSlug: string;
	multiTab: boolean;
}) {
	const [open, setOpen] = React.useState(false);
	const location = useLocation();
	React.useEffect(() => setOpen(false), [location.pathname]);
	React.useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		document.addEventListener('keydown', onKey);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				className="lg:hidden"
				aria-label="Open navigation"
				aria-expanded={open}
				onClick={() => setOpen(true)}
			>
				<Menu />
			</Button>
			{open ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						type="button"
						className="absolute inset-0 bg-black/50"
						aria-label="Close navigation"
						onClick={() => setOpen(false)}
					/>
					<aside className="absolute top-0 left-0 flex h-svh w-[min(20rem,100vw)] flex-col overflow-y-auto border-r bg-background p-4 shadow-lg">
						<div className="mb-4 flex items-center justify-between gap-2">
							<Link to="/" onClick={() => setOpen(false)}>
								<Logo />
							</Link>
							<Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
								Close
							</Button>
						</div>
						{multiTab ? (
							<>
								<nav className="flex flex-col gap-1">
									{tabs.map((tab) => {
										const firstSlug = flattenNodes(tab.nodes)[0];
										if (!firstSlug) return null;
										return (
											<Link
												key={tab.tab}
												to={`/${firstSlug}`}
												className={cn(
													'rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
													tab.tab === currentTab.tab
														? 'text-primary'
														: 'text-muted-foreground hover:text-foreground',
												)}
											>
												{tab.tab}
											</Link>
										);
									})}
								</nav>
								<div className="my-4 border-t" />
							</>
						) : null}
						<SidebarNav nodes={currentTab.nodes} activeSlug={activeSlug} sticky={false} />
					</aside>
				</div>
			) : null}
		</>
	);
}

function openNavbarHref(href: string) {
	if (href.startsWith('mailto:')) {
		window.location.href = href;
		return;
	}
	window.open(href, '_blank', 'noopener,noreferrer');
}

export default function DocsLayout() {
	const location = useLocation();
	const activeSlug = stripBase(location.pathname).replace(/^\/+|\/+$/g, '');
	const tabs = navTabs();
	const resolvedTab = resolveActiveTab(activeSlug);
	const currentTab = tabs.find((tab) => tab.tab === resolvedTab.tab) ?? tabs[0];
	const strict = docsConfig.appearance?.strict ?? false;
	const links = docsConfig.navbar?.links ?? [];
	const primary = docsConfig.navbar?.primary;
	const multiTab = tabs.length > 1;

	return (
		<div className="flex min-h-svh flex-col">
			<header
				className={cn(
					'sticky top-0 z-40 bg-background/85 backdrop-blur',
					!multiTab && 'border-b',
				)}
			>
				<div className="mx-auto flex h-14 max-w-screen-2xl items-center px-4 lg:px-6">
					<div className="flex items-center gap-3">
						<ClientOnly
							fallback={
								<Button
									variant="ghost"
									size="icon"
									className="lg:hidden"
									aria-label="Open navigation"
									disabled
								>
									<Menu />
								</Button>
							}
						>
							<MobileNav
								tabs={tabs}
								currentTab={currentTab}
								activeSlug={activeSlug}
								multiTab={multiTab}
							/>
						</ClientOnly>
						<Link to="/" className="flex items-center gap-2">
							<Logo />
						</Link>
					</div>
					<div className="hidden flex-1 justify-center px-6 md:flex">
						<SearchDialog variant="bar" />
					</div>
					<div className="ml-auto flex items-center gap-2">
						{links.map((link) => (
							<Button
								key={link.href}
								variant="ghost"
								size="sm"
								className="hidden md:inline-flex"
								onClick={() => openNavbarHref(link.href)}
							>
								{link.label}
							</Button>
						))}
						{primary?.type === 'button' && primary.label && primary.href ? (
							<Button
								size="sm"
								className="hidden rounded-full px-4 sm:inline-flex"
								onClick={() => openNavbarHref(primary.href as string)}
							>
								{primary.label}
								<ArrowRight className="size-3.5" />
							</Button>
						) : null}
						<div className="md:hidden">
							<SearchDialog variant="icon" />
						</div>
						<ClientOnly fallback={<span className="size-9" />}>
							<ThemeToggle strict={strict} />
						</ClientOnly>
					</div>
				</div>
				{multiTab ? <TabBar tabs={tabs} activeTabName={currentTab.tab} /> : null}
			</header>
			<div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-8 px-4 lg:px-6">
				<aside className="hidden w-60 shrink-0 lg:block">
					<SidebarNav
						nodes={currentTab.nodes}
						activeSlug={activeSlug}
						multiTab={multiTab}
					/>
				</aside>
				<main className="min-w-0 flex-1 py-8">
					<Outlet />
				</main>
			</div>
			<footer className="border-t py-6">
				<div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 text-[13px] text-muted-foreground lg:px-6">
					<span>{docsConfig.name ?? 'Docs'}</span>
					<span className="flex gap-4">
						{Object.entries(docsConfig.footer?.socials ?? {}).map(([label, href]) => (
							<a
								key={label}
								href={href}
								target="_blank"
								rel="noreferrer"
								className="hover:text-foreground"
							>
								{label}
							</a>
						))}
					</span>
				</div>
			</footer>
		</div>
	);
}
