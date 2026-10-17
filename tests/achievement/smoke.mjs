import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { experiences } from '../../src/achievement/experiences.mjs';

const root = new URL('../../dist/', import.meta.url);
assert.deepEqual((await readdir(root)).sort(), ['_headers', 'assets', 'experiences', 'index.html', 'licenses.txt']);
const licenses = await readFile(new URL('licenses.txt', root), 'utf8');
for (const dependency of ['react', '@mantine/core', 'canvas-confetti', 'three', 'Parable', 'bswxyz']) {
  assert(licenses.includes(dependency), `Bundled license missing: ${dependency}`);
}
const html = await readFile(new URL('index.html', root), 'utf8');
assert.doesNotMatch(html, /iframe|vendor\//);
assert.match(html, /lang="ja"/);
assert.match(html, /src="\/assets\/index-[\w-]+\.js"/);
assert.deepEqual((await readdir(new URL('experiences/', root))).sort(), experiences.map(item => item.id).sort());
for (const experience of experiences) {
  const directory = new URL(`experiences/${experience.id}/`, root);
  assert.deepEqual(await readdir(directory), ['index.html']);
  assert.equal(await readFile(new URL('index.html', directory), 'utf8'), html);
}
const assets = await readdir(new URL('assets/', root));
assert(assets.some(name => /^three-[\w-]+\.js$/.test(name)), '3D scenes must be loaded on demand');
for (const name of assets) assert.match(name, /-[\w-]+\.(?:js|css|svg|jpg)$/);
console.log('Sixteen static routes, one shared app, content-addressed artwork and retained licenses verified');
