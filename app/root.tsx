import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useLoaderData,
} from 'react-router';
import { ThemeProvider } from 'next-themes';
import type { Route } from './+types/root';
import { ClientOnly } from '~/components/client-only';
import { withBase } from '~/lib/base';
import { docsConfig } from '~/lib/docs';
import './app.css';
import 'virtual:mdx-docs/theme.css';

export function loader() {
	const fonts = docsConfig.fonts;
	const faviconRaw = docsConfig.favicon ?? '/open-mdx-docs-favicon.svg';
	const favicon =
		/^(https?:)?\/\//.test(faviconRaw) || faviconRaw.startsWith('data:')
			? faviconRaw
			: withBase(faviconRaw.startsWith('/') ? faviconRaw : `/${faviconRaw}`);
	return {
		name: docsConfig.name ?? 'Docs',
		description: docsConfig.description ?? '',
		favicon,
		appearance: {
			default: docsConfig.appearance?.default ?? 'system',
			strict: docsConfig.appearance?.strict ?? false,
		},
		fonts,
	};
}

const themeInitScript = `try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
	const data = useLoaderData<typeof loader>();
	const sansFamily = data?.fonts?.family?.trim();
	const monoFamily = data?.fonts?.mono?.trim();
	const googleFontFamilies = [
		sansFamily ? `${encodeURIComponent(sansFamily).replace(/%20/g, '+')}:wght@400..700` : '',
		monoFamily ? encodeURIComponent(monoFamily).replace(/%20/g, '+') : '',
	].filter(Boolean);
	const googleFontsHref =
		googleFontFamilies.length > 0 && data?.fonts?.source !== 'none'
			? `https://fonts.googleapis.com/css2?${googleFontFamilies
					.map((family) => `family=${family}`)
					.join('&')}&display=swap`
			: undefined;
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{data?.favicon ? <link rel="icon" href={data.favicon} /> : null}
				{googleFontsHref ? <link rel="preconnect" href="https://fonts.googleapis.com" /> : null}
				{googleFontsHref ? (
					<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				) : null}
				{googleFontsHref ? <link rel="stylesheet" href={googleFontsHref} /> : null}
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
				<Meta />
				<Links />
			</head>
			<body suppressHydrationWarning>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function ThemedApp({
	defaultTheme,
	strict,
}: {
	defaultTheme: 'light' | 'dark' | 'system';
	strict: boolean;
}) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme={defaultTheme}
			enableSystem={!strict || defaultTheme === 'system'}
			forcedTheme={strict && defaultTheme !== 'system' ? defaultTheme : undefined}
			storageKey="theme"
			disableTransitionOnChange
			enableColorScheme={false}
		>
			<Outlet />
		</ThemeProvider>
	);
}

export default function App() {
	const data = useLoaderData<typeof loader>();
	const defaultTheme = data?.appearance.default ?? 'system';
	const strict = data?.appearance.strict ?? false;
	return (
		<ClientOnly fallback={<Outlet />}>
			<ThemedApp defaultTheme={defaultTheme} strict={strict} />
		</ClientOnly>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let title = 'Something went wrong';
	let detail = 'An unexpected error occurred.';
	if (isRouteErrorResponse(error)) {
		title = error.status === 404 ? 'Page not found' : `Error ${error.status}`;
		detail =
			error.status === 404
				? 'The page you are looking for does not exist.'
				: error.statusText || detail;
	}
	return (
		<main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-4 px-6">
			<p className="text-sm font-medium text-primary">Error</p>
			<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
			<p className="text-muted-foreground">{detail}</p>
			<a href={withBase('/')} className="text-sm font-medium text-primary hover:underline">
				Back to docs
			</a>
		</main>
	);
}
