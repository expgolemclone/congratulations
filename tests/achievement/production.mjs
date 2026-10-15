import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { verifyCelebration } from '../helpers/achievement-checks.mjs';

const origin = 'https://kakomonn-congratulations.kakomonn.workers.dev';
const root = new URL('../../', import.meta.url);
const response = await fetch(origin);
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'no-cache');
assert.equal(await response.text(), await readFile(new URL('dist/index.html', root), 'utf8'));
const etag = response.headers.get('etag');
assert.notEqual(etag, null);
assert.equal((await fetch(origin, { headers: { 'if-none-match': etag } })).status, 304);

for (const asset of await readdir(new URL('dist/assets/', root))) {
  const deployed = await fetch(`${origin}/assets/${asset}`);
  assert.equal(deployed.status, 200);
  assert.equal(deployed.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.deepEqual(Buffer.from(await deployed.arrayBuffer()), await readFile(new URL(`dist/assets/${asset}`, root)));
}
const licenses = await fetch(`${origin}/licenses.txt`);
assert.equal(licenses.status, 200);
assert.equal(await licenses.text(), await readFile(new URL('dist/licenses.txt', root), 'utf8'));
// Old product pages must not survive the deployment.
assert.equal((await fetch(`${origin}/experiences/northbound-ev/`)).status, 404);

const browser = await chromium.launch({ headless: true });
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await verifyCelebration(browser, origin, { viewport: { width: 390, height: 844 }, reducedMotion });
  }
} finally {
  await browser.close();
}
console.log('Production celebration, motion preferences and exact deployed assets verified');
