import fs from 'node:fs';
import path from 'node:path';

const out = process.env.OPEN_MDX_DOCS_OUT
	? path.resolve(process.env.OPEN_MDX_DOCS_OUT)
	: path.resolve('build');
const clientDir = path.join(out, 'client');
const base = (process.env.BASE_PATH || '').replace(/\/+$/, '').replace(/^\//, '');

if (!base) {
	console.log('No BASE_PATH; skipping asset nest');
	process.exit(0);
}
if (!fs.existsSync(clientDir)) {
	console.error(`Missing client build at ${clientDir}`);
	process.exit(1);
}
const target = path.join(clientDir, base);
if (fs.existsSync(path.join(target, 'assets'))) {
	console.log(`Already nested under ${base}/`);
	process.exit(0);
}
fs.mkdirSync(target, { recursive: true });
for (const name of fs.readdirSync(clientDir)) {
	if (name === base) continue;
	fs.renameSync(path.join(clientDir, name), path.join(target, name));
}
console.log(`Nested client assets under ${target}/`);
