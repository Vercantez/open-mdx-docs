import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mdxDocsPlugin } from './vite/mdx-docs-plugin';

export default defineConfig({
	plugins: [
		cloudflare({
			configPath: './wrangler.jsonc',
			viteEnvironment: { name: 'ssr' },
		}),
		tailwindcss(),
		mdxDocsPlugin({ contentDir: process.env.DOCS_DIR ?? 'docs' }),
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
	},
});
