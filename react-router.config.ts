import type { Config } from '@react-router/dev/config';

function normalizeBasename(value: string | undefined): string | undefined {
	if (!value || value === '/') return undefined;
	const withSlash = value.startsWith('/') ? value : `/${value}`;
	return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

const buildDirectory = process.env.OPEN_MDX_DOCS_OUT || 'build';

export default {
	ssr: true,
	appDirectory: 'app',
	buildDirectory,
	// e.g. BASE_PATH=/docs when serving at camelai.com/docs
	basename: normalizeBasename(process.env.BASE_PATH),
	future: {
		v8_viteEnvironmentApi: true,
	},
} satisfies Config;
