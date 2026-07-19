import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
	index('routes/index.tsx'),
	route('api/search', 'routes/api.search.ts'),
	route('llms.txt', 'routes/llms[.]txt.ts'),
	route('llms-full.txt', 'routes/llms-full[.]txt.ts'),
	route('sitemap.xml', 'routes/sitemap[.]xml.ts'),
	route('robots.txt', 'routes/robots[.]txt.ts'),
	layout('routes/docs-layout.tsx', [route('*', 'routes/docs-page.tsx')]),
] satisfies RouteConfig;
