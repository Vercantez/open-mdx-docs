/** App base path without trailing slash. "" at site root, "/docs" when mounted under /docs. */
export function basePath(): string {
	const raw = import.meta.env.BASE_URL || '/';
	if (raw === '/') return '';
	return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

/** Prefix an app-absolute path with the base path. */
export function withBase(path: string): string {
	const base = basePath();
	if (!path.startsWith('/')) path = `/${path}`;
	if (!base) return path;
	if (path === '/') return `${base}/`;
	return `${base}${path}`;
}

/** Strip the base path from a URL pathname for slug matching. */
export function stripBase(pathname: string): string {
	const base = basePath();
	if (!base) return pathname;
	if (pathname === base || pathname === `${base}/`) return '/';
	if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/';
	return pathname;
}
