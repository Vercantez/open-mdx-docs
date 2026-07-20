import type { Config } from '@react-router/dev/config';

function normalizeBasename(value: string | undefined): string | undefined {
	if (!value || value === '/') return undefined;
	const withSlash = value.startsWith('/') ? value : `/${value}`;
	return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

export default {
	ssr: true,
	appDirectory: 'app',
	// e.g. BASE_PATH=/docs when serving at camelai.com/docs
	basename: normalizeBasename(process.env.BASE_PATH),
	future: {
		v8_viteEnvironmentApi: true,
	},
} satisfies Config;
