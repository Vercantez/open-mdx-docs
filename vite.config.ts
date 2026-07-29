import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mdxDocsPlugin } from './vite/mdx-docs-plugin';

function viteBase(): string {
	const raw = process.env.BASE_PATH?.trim();
	if (!raw || raw === '/') return '/';
	const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
	return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

function bareBasePathRedirect(): Plugin {
	const base = viteBase();
	return {
		name: 'open-mdx-docs:bare-base-path-redirect',
		configureServer(server) {
			if (base === '/') return;
			const bareBase = base.slice(0, -1);
			server.middlewares.use((request, response, next) => {
				const url = new URL(request.url ?? '/', 'http://localhost');
				if (url.pathname !== bareBase) return next();
				response.statusCode = 308;
				response.setHeader('Location', `${base}${url.search}`);
				response.end();
			});
		},
	};
}

export default defineConfig({
	base: viteBase(),
	plugins: [
		bareBasePathRedirect(),
		cloudflare({
			configPath: './wrangler.jsonc',
			viteEnvironment: { name: 'ssr' },
		}),
		tailwindcss(),
		mdxDocsPlugin({
			contentDir: process.env.DOCS_DIR ?? 'docs',
			basePath: process.env.BASE_PATH,
		}),
		reactRouter(),
		tsconfigPaths(),
	],
	environments: {
		ssr: {
			build: {
				rollupOptions: {
					input: 'virtual:cloudflare/worker-entry',
				},
			},
		},
	},
	build: {
		target: 'esnext',
	},
	server: {
		port: 3000,
		fs: {
			allow: [process.cwd(), process.env.DOCS_DIR ?? process.cwd()],
		},
	},
});
