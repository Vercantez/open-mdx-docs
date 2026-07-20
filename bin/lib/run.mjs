import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * @param {string} name
 * @param {string[]} searchRoots
 */
export function findBin(name, searchRoots) {
	const exts = process.platform === 'win32' ? ['.cmd', '.exe', ''] : [''];
	for (const root of searchRoots) {
		for (const ext of exts) {
			const candidate = path.join(root, 'node_modules', '.bin', name + ext);
			if (fs.existsSync(candidate)) return candidate;
		}
	}
	// walk up from pkgRoot (hoisted installs)
	let dir = pkgRoot;
	for (let i = 0; i < 6; i++) {
		for (const ext of exts) {
			const candidate = path.join(dir, 'node_modules', '.bin', name + ext);
			if (fs.existsSync(candidate)) return candidate;
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv }} [opts]
 */
export function run(command, args, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: opts.cwd ?? process.cwd(),
			env: opts.env ?? process.env,
			stdio: 'inherit',
			shell: process.platform === 'win32',
		});
		child.on('error', reject);
		child.on('exit', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'null'}`));
		});
	});
}

/**
 * @param {string} contentRoot
 * @param {string[]} extraRoots
 */
export function binPathEnv(contentRoot, extraRoots = []) {
	const bins = [
		path.join(contentRoot, 'node_modules', '.bin'),
		path.join(pkgRoot, 'node_modules', '.bin'),
		...extraRoots.map((r) => path.join(r, 'node_modules', '.bin')),
	].filter((p) => fs.existsSync(p));
	return {
		...process.env,
		PATH: [...bins, process.env.PATH ?? ''].join(path.delimiter),
	};
}
