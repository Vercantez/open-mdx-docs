import { Menu } from 'lucide-react';
import * as React from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { ClientOnly } from '~/components/client-only';
import { SearchDialog } from '~/components/docs/search-dialog';
import { SidebarNav } from '~/components/docs/sidebar';
import { ThemeToggle } from '~/components/docs/theme-toggle';
import { Button } from '~/components/ui/button';
import { withBase } from '~/lib/base';
import { docsConfig, navTabs } from '~/lib/docs';

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
				{logo.light ? (
					<img src={assetUrl(logo.light)} alt={name} className="h-6 dark:hidden" />
				) : null}
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
	activeSlug,
	multiTab,
}: {
	tabs: ReturnType<typeof navTabs>;
	activeSlug: string;
	multiTab: boolean;
}) {
	const [open, setOpen] = React.useState(false);
	const location = useLocation();
	React.useEffect(() => {
		setOpen(false);
	}, [location.pathname]);

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
						{tabs.map((tab) => (
							<div key={tab.tab} className="mb-6">
								{multiTab ? (
									<p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
										{tab.tab}
									</p>
								) : null}
								<SidebarNav nodes={tab.nodes} activeSlug={activeSlug} />
							</div>
						))}
					</aside>
				</div>
			) : null}
		</>
	);
}

export default function DocsLayout() {
	const location = useLocation();
	const activeSlug = location.pathname.replace(/^\/+|\/+$/g, '');
	const tabs = navTabs();
	const strict = docsConfig.appearance?.strict ?? false;
	const links = docsConfig.navbar?.links ?? [];
	const multiTab = tabs.length > 1;

	return (
		<div className="flex min-h-svh flex-col">
			<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
				<div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4 lg:px-6">
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
						<MobileNav tabs={tabs} activeSlug={activeSlug} multiTab={multiTab} />
					</ClientOnly>
					<Link to="/" className="flex items-center gap-2">
						<Logo />
					</Link>
					<div className="ml-auto flex items-center gap-1">
						{links.map((link) => (
							<Button
								key={link.href}
								variant="ghost"
								size="sm"
								className="hidden md:inline-flex"
								onClick={() => {
									// Avoid raw mailto: in SSR HTML — Cloudflare Email Obfuscation
									// rewrites it and breaks React hydration on the zone.
									if (link.href.startsWith('mailto:')) {
										window.location.href = link.href;
										return;
									}
									window.open(link.href, '_blank', 'noopener,noreferrer');
								}}
							>
								{link.label}
							</Button>
						))}
						<SearchDialog />
						<ClientOnly fallback={<span className="size-9" />}>
							<ThemeToggle strict={strict} />
						</ClientOnly>
					</div>
				</div>
			</header>
			<div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-8 px-4 lg:px-6">
				<aside className="hidden w-60 shrink-0 py-8 lg:block">
					{tabs.map((tab) => (
						<div key={tab.tab} className="mb-6">
							{multiTab ? (
								<p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
									{tab.tab}
								</p>
							) : null}
							<SidebarNav nodes={tab.nodes} activeSlug={activeSlug} />
						</div>
					))}
				</aside>
				<main className="min-w-0 flex-1 py-8">
					<Outlet />
				</main>
			</div>
			<footer className="border-t py-6">
				<div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 text-sm text-muted-foreground lg:px-6">
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
