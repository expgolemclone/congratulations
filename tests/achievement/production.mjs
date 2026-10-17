import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { experiences } from '../../src/achievement/experiences.mjs';
import { celebration, verifyExperience } from '../helpers/experience-checks.mjs';
import { verifyGraphics } from '../helpers/graphics-checks.mjs';

const origin = 'https://kakomonn-congratulations.kakomonn.workers.dev';
const dist = new URL('../../dist/', import.meta.url);
const response = await fetch(origin);
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'no-cache');
assert.equal(await response.text(), await readFile(new URL('index.html', dist), 'utf8'));
const etag = response.headers.get('etag');
assert.notEqual(etag, null);
assert.equal((await fetch(origin, { headers: { 'if-none-match': etag } })).status, 304);

// Compare every deployed file, including native scripts, shaders, fonts and licenses.
const entries = await readdir(dist, { recursive: true, withFileTypes: true });
const paths = entries.filter(entry => entry.isFile() && !entry.name.startsWith('.') && entry.name !== '_headers')
  .map(entry => `${relative(fileURLToPath(dist), entry.parentPath).replaceAll('\\', '/')}/${entry.name}`.replace(/^\//, ''));
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < paths.length) {
    const path = paths[next++];
    const deployed = await fetch(`${origin}/${path}`);
    assert.equal(deployed.status, 200, path);
    const immutable = path.startsWith('assets/') || path.startsWith('vendor/');
    assert.equal(deployed.headers.get('cache-control'), immutable ? 'public, max-age=31536000, immutable' : 'no-cache', path);
    assert.deepEqual(Buffer.from(await deployed.arrayBuffer()), await readFile(new URL(path, dist)), path);
  }
}));
for (const path of ['/experiences/nope/', '/vendor/old.js']) assert.equal((await fetch(`${origin}${path}`)).status, 404);

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    try {
      await page.goto(`${origin}/?${celebrationSearch(celebration)}`);
      await page.waitForSelector('html[data-state="ready"]');
      assert(experiences.some(item => item.id === new URL(page.url()).pathname.split('/')[2]));
    } finally { await page.close(); }
    for (const experience of experiences) {
      console.log(`Production ${engine.name()} ${experience.id}`);
      await verifyExperience(browser, origin, experience, { viewport: { width: 390, height: 844 } });
    }
    await verifyGraphics(browser, origin);
  } finally { await browser.close(); }
}
console.log(`Production native designs, interaction, motion, reduced motion and all ${paths.length} deployed files verified`);
