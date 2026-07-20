import { Menu } from 'lucide-react';
import * as React from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { SearchDialog } from '~/components/docs/search-dialog';
import { SidebarNav } from '~/components/docs/sidebar';
import { ThemeToggle } from '~/components/docs/theme-toggle';
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

export default function DocsLayout() {
	const location = useLocation();
	const activeSlug = location.pathname.replace(/^\/+|\/+$/g, '');
	const tabs = navTabs();
	const strict = docsConfig.appearance?.strict ?? false;
	const links = docsConfig.navbar?.links ?? [];
	const [mobileOpen, setMobileOpen] = React.useState(false);

	React.useEffect(() => {
		setMobileOpen(false);
	}, [location.pathname]);

	const multiTab = tabs.length > 1;

	return (
		<div className="flex min-h-svh flex-col">
			<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
				<div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4 lg:px-6">
					<Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
						<DialogTrigger asChild>
							<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
								<Menu />
							</Button>
						</DialogTrigger>
						<DialogContent
							className="top-0 left-0 h-svh max-h-svh w-72 max-w-xs translate-x-0 translate-y-0 overflow-y-auto rounded-none border-r p-4 sm:max-w-xs"
							showCloseButton
						>
							<DialogTitle className="sr-only">Navigation</DialogTitle>
							<div className="mb-4">
								<Link to="/">
									<Logo />
								</Link>
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
						</DialogContent>
					</Dialog>
					<Link to="/" className="flex items-center gap-2">
						<Logo />
					</Link>
					<div className="ml-auto flex items-center gap-1">
						{links.map((link) => (
							<Button key={link.href} variant="ghost" size="sm" asChild className="hidden md:inline-flex">
								<a href={link.href} target="_blank" rel="noreferrer">
									{link.label}
								</a>
							</Button>
						))}
						<SearchDialog />
						<ThemeToggle strict={strict} />
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
							<a key={label} href={href} target="_blank" rel="noreferrer" className="hover:text-foreground">
								{label}
							</a>
						))}
					</span>
				</div>
			</footer>
		</div>
	);
}
