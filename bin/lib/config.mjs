import fs from 'node:fs';
import path from 'node:path';

const CONFIG_NAMES = [
	'open-mdx-docs.config.json',
	'open-mdx-docs.config.jsonc',
	'.open-mdx-docs.json',
];

/**
 * @typedef {object} OpenMdxDocsConfig
 * @property {string} [docsDir]
 * @property {string} [basePath]
 * @property {string} [name]
 * @property {string} [aiSearchInstance]
 * @property {Array<{ pattern: string, zone_name?: string, zone_id?: string }>} [routes]
 * @property {number} [port]
 * @property {Record<string, unknown>} [wrangler]
 */

/**
 * @param {string} contentRoot
 * @returns {OpenMdxDocsConfig}
 */
export function loadConfig(contentRoot) {
	for (const name of CONFIG_NAMES) {
		const file = path.join(contentRoot, name);
		if (!fs.existsSync(file)) continue;
		const raw = fs.readFileSync(file, 'utf8');
		// strip // line comments for jsonc
		const json = raw.replace(/^\s*\/\/.*$/gm, '');
		try {
			return JSON.parse(json);
		} catch (error) {
			throw new Error(`Failed to parse ${file}: ${error.message}`);
		}
	}

	// package.json "openMdxDocs" field
	const pkgFile = path.join(contentRoot, 'package.json');
	if (fs.existsSync(pkgFile)) {
		try {
			const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
			if (pkg.openMdxDocs && typeof pkg.openMdxDocs === 'object') {
				return pkg.openMdxDocs;
			}
		} catch {
			// ignore
		}
	}

	return {};
}

/**
 * @param {string} contentRoot
 * @param {OpenMdxDocsConfig} config
 */
export function resolveDocsDir(contentRoot, config) {
	if (config.docsDir) {
		return path.resolve(contentRoot, config.docsDir);
	}
	for (const candidate of [
		contentRoot,
		path.join(contentRoot, 'docs'),
	]) {
		if (
			fs.existsSync(path.join(candidate, 'docs.json')) ||
			fs.existsSync(path.join(candidate, 'mint.json'))
		) {
			return candidate;
		}
	}
	// fallback: content root even if empty (doctor will warn)
	return contentRoot;
}

/**
 * @param {OpenMdxDocsConfig} config
 */
export function resolveBasePath(config) {
	const raw = (config.basePath ?? process.env.BASE_PATH ?? '').trim();
	if (!raw || raw === '/') return '';
	const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
	return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}
