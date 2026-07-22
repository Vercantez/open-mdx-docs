import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mdxDocsPlugin } from './vite/mdx-docs-plugin';

function viteBase(): string {
	const raw = process.env.BASE_PATH?.trim();
	if (!raw || raw === '/') return '/';
	const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
	return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

export default defineConfig({
	base: viteBase(),
	plugins: [
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
