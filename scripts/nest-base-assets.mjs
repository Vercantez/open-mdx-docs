import fs from 'node:fs';
import path from 'node:path';

const clientDir = path.resolve('build/client');
const base = (process.env.BASE_PATH || '').replace(/\/+$/, '').replace(/^\//, '');
if (!base) {
	console.log('No BASE_PATH; skipping asset nest');
	process.exit(0);
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
console.log(`Nested client assets under build/client/${base}/`);
