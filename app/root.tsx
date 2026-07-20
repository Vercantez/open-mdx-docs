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
import { withBase } from '~/lib/base';
import { docsConfig, primaryColors } from '~/lib/docs';
import './app.css';

export function loader() {
	const colors = primaryColors();
	const faviconRaw = docsConfig.favicon ?? '/favicon.svg';
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
		colors,
	};
}

const themeInitScript = `try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
	const data = useLoaderData<typeof loader>();
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{data?.favicon ? <link rel="icon" href={data.favicon} /> : null}
				{data?.colors ? (
					<style
						dangerouslySetInnerHTML={{
							__html: `:root{--docs-primary:${data.colors.primary};--docs-primary-light:${data.colors.light};--docs-primary-dark:${data.colors.dark}}`,
						}}
					/>
				) : null}
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
				<Meta />
				<Links />
			</head>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme={data?.appearance.default ?? 'system'}
					enableSystem={!data?.appearance.strict || data?.appearance.default === 'system'}
					forcedTheme={
						data?.appearance.strict && data.appearance.default !== 'system'
							? data.appearance.default
							: undefined
					}
					storageKey="theme"
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
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
			<a href="/" className="text-sm font-medium text-primary hover:underline">
				Back to docs
			</a>
		</main>
	);
}
