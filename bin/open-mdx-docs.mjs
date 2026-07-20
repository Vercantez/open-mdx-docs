#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, resolveBasePath, resolveDocsDir } from './lib/config.mjs';
import { binPathEnv, findBin, pkgRoot, run } from './lib/run.mjs';

const USAGE = `
open-mdx-docs — Mintlify-style MDX docs (Cloudflare or Node)

Usage:
  open-mdx-docs <command> [options]

Commands:
  dev       Start the dev server (content = current directory)
  build     Production build into .open-mdx-docs/
  start     Serve the production build (Node)
  deploy    Build and deploy to Cloudflare Workers
  doctor    Check content + environment
  init      Scaffold config + package scripts in the current repo

Options:
  --docs <dir>       Content directory (default: auto-detect)
  --base-path <path> URL mount path, e.g. /docs
  --port <n>         Dev/start port (default 3000)
  --name <worker>    Cloudflare Worker name
  --help             Show help

Example (inside your MDX docs repo):
  bun add -d open-mdx-docs
  bunx open-mdx-docs init
  bunx open-mdx-docs dev
  bunx open-mdx-docs deploy
`.trim();

function parseArgs(argv) {
	const args = {
		command: '',
		docs: undefined,
		basePath: undefined,
		port: undefined,
		name: undefined,
		help: false,
		rest: [],
	};
	const positional = [];
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--help' || a === '-h') args.help = true;
		else if (a === '--docs') args.docs = argv[++i];
		else if (a === '--base-path') args.basePath = argv[++i];
		else if (a === '--port') args.port = Number(argv[++i]);
		else if (a === '--name') args.name = argv[++i];
		else if (a.startsWith('-')) args.rest.push(a);
		else positional.push(a);
	}
	args.command = positional[0] || '';
	args.rest.push(...positional.slice(1));
	return args;
}

function outDir(contentRoot) {
	return path.join(contentRoot, '.open-mdx-docs');
}

function buildContext(contentRoot, config, args) {
	const docsDir = args.docs
		? path.resolve(contentRoot, args.docs)
		: resolveDocsDir(contentRoot, config);
	const basePath = args.basePath ?? resolveBasePath(config);
	const out = outDir(contentRoot);
	const workerName =
		args.name || config.name || path.basename(contentRoot).replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'open-mdx-docs';
	const port = args.port || config.port || 3000;
	const env = {
		...binPathEnv(contentRoot),
		DOCS_DIR: docsDir,
		BASE_PATH: basePath || '',
		OPEN_MDX_DOCS_CONTENT: contentRoot,
		OPEN_MDX_DOCS_PKG: pkgRoot,
		OPEN_MDX_DOCS_OUT: out,
		PORT: String(port),
	};
	return { docsDir, basePath, out, workerName, port, env };
}

function requireBin(name, contentRoot) {
	const bin = findBin(name, [contentRoot, pkgRoot]);
	if (!bin) {
		throw new Error(
			`Could not find \`${name}\`. From your content repo run:\n  bun add -d open-mdx-docs`,
		);
	}
	return bin;
}

function rmrf(dir) {
	fs.rmSync(dir, { recursive: true, force: true });
}

function copyBuildToContent(out) {
	const pkgBuild = path.join(pkgRoot, 'build');
	if (!fs.existsSync(pkgBuild)) {
		throw new Error(`Package build missing at ${pkgBuild}`);
	}
	rmrf(out);
	fs.cpSync(pkgBuild, out, { recursive: true });
}

async function nestAssets(clientDir, basePath) {
	const base = (basePath || '').replace(/\/+$/, '').replace(/^\//, '');
	if (!base) {
		console.log('No BASE_PATH; skip asset nesting');
		return;
	}
	if (!fs.existsSync(clientDir)) {
		throw new Error(`Missing client build at ${clientDir}`);
	}
	const target = path.join(clientDir, base);
	if (fs.existsSync(path.join(target, 'assets'))) {
		console.log(`Assets already nested under ${base}/`);
		return;
	}
	fs.mkdirSync(target, { recursive: true });
	for (const name of fs.readdirSync(clientDir)) {
		if (name === base) continue;
		fs.renameSync(path.join(clientDir, name), path.join(target, name));
	}
	console.log(`Nested client assets under client/${base}/`);
}

function writeDeployWrangler(config, ctx) {
	const { out, workerName } = ctx;
	const routes = config.routes ?? [];
	const wrangler = {
		name: workerName,
		main: 'server/index.js',
		compatibility_date: '2026-07-01',
		compatibility_flags: ['nodejs_compat'],
		no_bundle: true,
		workers_dev: true,
		preview_urls: true,
		assets: {
			binding: 'ASSETS',
			directory: 'client',
		},
		observability: { enabled: true },
		vars: {
			AI_SEARCH_INSTANCE: config.aiSearchInstance || workerName,
		},
		...(routes.length ? { routes } : {}),
		...(config.wrangler && typeof config.wrangler === 'object' ? config.wrangler : {}),
	};

	if (config.enableAiSearch) {
		wrangler.ai_search_namespaces = [
			{
				binding: 'AI_SEARCH',
				namespace: config.aiSearchNamespace || 'default',
				remote: true,
			},
		];
	}

	fs.mkdirSync(out, { recursive: true });
	const file = path.join(out, 'wrangler.json');
	fs.writeFileSync(file, JSON.stringify(wrangler, null, '\t') + '\n');
	return file;
}

async function cmdDoctor(contentRoot, config, args) {
	const ctx = buildContext(contentRoot, config, args);
	const rows = [
		[fs.existsSync(ctx.docsDir), `Content directory: ${ctx.docsDir}`],
		[
			fs.existsSync(path.join(ctx.docsDir, 'docs.json')) ||
				fs.existsSync(path.join(ctx.docsDir, 'mint.json')),
			'docs.json / mint.json present',
		],
		[fs.existsSync(path.join(pkgRoot, 'app')), `Package app/ (${pkgRoot})`],
		[!!findBin('react-router', [contentRoot, pkgRoot]), 'react-router CLI'],
		[!!findBin('wrangler', [contentRoot, pkgRoot]), 'wrangler CLI'],
		[true, `basePath: ${ctx.basePath || '(site root)'}`],
		[true, `output: ${ctx.out}`],
		[true, `worker: ${ctx.workerName}`],
	];
	if (config.routes?.length) {
		rows.push([true, `routes: ${config.routes.map((r) => r.pattern).join(', ')}`]);
	}
	for (const [ok, msg] of rows) console.log(`${ok ? '✓' : '✗'} ${msg}`);
	if (rows.some(([ok]) => !ok)) process.exit(1);
}

async function cmdInit(contentRoot) {
	const pkgPath = path.join(contentRoot, 'package.json');
	let pkg = {
		name: path.basename(contentRoot),
		private: true,
		type: 'module',
		scripts: {},
	};
	if (fs.existsSync(pkgPath)) {
		pkg = { ...pkg, ...JSON.parse(fs.readFileSync(pkgPath, 'utf8')) };
	}
	pkg.scripts = {
		...pkg.scripts,
		dev: 'open-mdx-docs dev',
		build: 'open-mdx-docs build',
		start: 'open-mdx-docs start',
		deploy: 'open-mdx-docs deploy',
		doctor: 'open-mdx-docs doctor',
	};
	pkg.devDependencies = {
		...pkg.devDependencies,
		'open-mdx-docs':
			pkg.devDependencies?.['open-mdx-docs'] || 'github:Vercantez/open-mdx-docs',
	};
	fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);

	const configPath = path.join(contentRoot, 'open-mdx-docs.config.json');
	if (!fs.existsSync(configPath)) {
		const hasRootDocs =
			fs.existsSync(path.join(contentRoot, 'docs.json')) ||
			fs.existsSync(path.join(contentRoot, 'mint.json'));
		const sample = {
			basePath: '',
			docsDir: hasRootDocs ? '.' : 'docs',
			name: path
				.basename(contentRoot)
				.replace(/[^a-z0-9-]/gi, '-')
				.toLowerCase() || 'docs',
			aiSearchInstance: 'open-mdx-docs',
			routes: [],
		};
		fs.writeFileSync(configPath, `${JSON.stringify(sample, null, '\t')}\n`);
	}

	const gitignore = path.join(contentRoot, '.gitignore');
	const ignoreLine = '.open-mdx-docs';
	if (fs.existsSync(gitignore)) {
		const text = fs.readFileSync(gitignore, 'utf8');
		if (!text.includes(ignoreLine)) fs.appendFileSync(gitignore, `\n${ignoreLine}\n`);
	} else {
		fs.writeFileSync(gitignore, `node_modules\n.open-mdx-docs\n`);
	}

	console.log(`Initialized open-mdx-docs in ${contentRoot}`);
	console.log('  package.json scripts + open-mdx-docs.config.json');
	console.log('\nNext:\n  bun install\n  bunx open-mdx-docs doctor\n  bunx open-mdx-docs dev');
}

async function cmdDev(contentRoot, config, args) {
	const ctx = buildContext(contentRoot, config, args);
	const rr = requireBin('react-router', contentRoot);
	// Dev builds inside the package; point content via DOCS_DIR only.
	const env = { ...ctx.env };
	delete env.OPEN_MDX_DOCS_OUT;
	console.log('open-mdx-docs dev');
	console.log(`  package: ${pkgRoot}`);
	console.log(`  content: ${ctx.docsDir}`);
	console.log(`  base:    ${ctx.basePath || '/'}`);
	await run(rr, ['dev', '--port', String(ctx.port), '--clearScreen=false'], {
		cwd: pkgRoot,
		env,
	});
}

async function cmdBuild(contentRoot, config, args) {
	const ctx = buildContext(contentRoot, config, args);
	const rr = requireBin('react-router', contentRoot);
	// Always build into the package's ./build (vite/wrangler paths stay stable),
	// then copy artifacts into the content repo's .open-mdx-docs/
	const env = { ...ctx.env };
	delete env.OPEN_MDX_DOCS_OUT;

	console.log('open-mdx-docs build');
	console.log(`  content → ${ctx.docsDir}`);
	console.log(`  base    → ${ctx.basePath || '/'}`);
	console.log(`  output  → ${ctx.out}`);

	rmrf(path.join(pkgRoot, 'build'));
	await run(rr, ['build'], { cwd: pkgRoot, env });
	await nestAssets(path.join(pkgRoot, 'build', 'client'), ctx.basePath);
	copyBuildToContent(ctx.out);
	writeDeployWrangler(config, ctx);
	console.log(`Build complete: ${ctx.out}`);
}

async function cmdStart(contentRoot, config, args) {
	const ctx = buildContext(contentRoot, config, args);
	const server = path.join(pkgRoot, 'server', 'node-server.mjs');
	if (!fs.existsSync(path.join(ctx.out, 'server', 'index.js'))) {
		throw new Error(`No build at ${ctx.out}. Run: open-mdx-docs build`);
	}
	console.log(`open-mdx-docs start → http://localhost:${ctx.port}`);
	await run(process.execPath, [server], { cwd: pkgRoot, env: ctx.env });
}

async function cmdDeploy(contentRoot, config, args) {
	await cmdBuild(contentRoot, config, args);
	const ctx = buildContext(contentRoot, config, args);
	const wranglerConfig = writeDeployWrangler(config, ctx);
	const wrangler = requireBin('wrangler', contentRoot);
	console.log(`open-mdx-docs deploy (${ctx.workerName})`);
	console.log('  tip: use a real Node binary on PATH for wrangler (not a bun node shim)');
	await run(wrangler, ['deploy', '-c', wranglerConfig, '--keep-vars', ...args.rest], {
		cwd: ctx.out,
		env: ctx.env,
	});
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help || !args.command) {
		console.log(USAGE);
		process.exit(0);
	}

	const contentRoot = process.cwd();
	const config = loadConfig(contentRoot);

	try {
		switch (args.command) {
			case 'dev':
				await cmdDev(contentRoot, config, args);
				break;
			case 'build':
				await cmdBuild(contentRoot, config, args);
				break;
			case 'start':
				await cmdStart(contentRoot, config, args);
				break;
			case 'deploy':
				await cmdDeploy(contentRoot, config, args);
				break;
			case 'doctor':
				await cmdDoctor(contentRoot, config, args);
				break;
			case 'init':
				await cmdInit(contentRoot);
				break;
			default:
				console.error(`Unknown command: ${args.command}\n`);
				console.log(USAGE);
				process.exit(1);
		}
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
