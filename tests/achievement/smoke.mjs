import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
await access(new URL('dist/index.html', root));
const entries = await readdir(new URL('dist/', root));
assert.deepEqual(entries.sort(), ['_headers', 'assets', 'index.html', 'licenses.txt']);
const licenses = await readFile(new URL('dist/licenses.txt', root), 'utf8');
for (const dependency of ['react', '@mantine/core', 'canvas-confetti']) {
  assert(licenses.includes(dependency), `Bundled license missing: ${dependency}`);
}
assert.match(licenses, /Permission is hereby granted/);
const html = await readFile(new URL('dist/index.html', root), 'utf8');
assert.doesNotMatch(html, /iframe|experiences\//);
assert.match(html, /assets\/index-[\w-]+\.js/);
const assets = await readdir(new URL('dist/assets/', root));
assert(assets.some(name => /^index-[\w-]+\.js$/.test(name)));
assert(assets.some(name => /^index-[\w-]+\.css$/.test(name)));
console.log('Achievement build contains only the celebration and its bundled assets');
