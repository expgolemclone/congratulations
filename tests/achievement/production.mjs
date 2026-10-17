import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { experiences } from '../../src/achievement/experiences.mjs';
import { celebration, verifyCelebration, verifyMotion } from '../helpers/achievement-checks.mjs';

const origin = 'https://kakomonn-congratulations.kakomonn.workers.dev';
const root = new URL('../../', import.meta.url);
const html = await readFile(new URL('dist/index.html', root), 'utf8');
const response = await fetch(origin);
assert.equal(response.status, 200);
assert.equal(response.headers.get('cache-control'), 'no-cache');
assert.equal(await response.text(), html);
const etag = response.headers.get('etag');
assert.notEqual(etag, null);
assert.equal((await fetch(origin, { headers: { 'if-none-match': etag } })).status, 304);
for (const experience of experiences) {
  const deployed = await fetch(`${origin}/experiences/${experience.id}/`);
  assert.equal(deployed.status, 200, experience.id);
  assert.equal(deployed.headers.get('cache-control'), 'no-cache');
  assert.equal(await deployed.text(), html);
}
for (const asset of await readdir(new URL('dist/assets/', root))) {
  const deployed = await fetch(`${origin}/assets/${asset}`);
  assert.equal(deployed.status, 200);
  assert.equal(deployed.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.deepEqual(Buffer.from(await deployed.arrayBuffer()), await readFile(new URL(`dist/assets/${asset}`, root)));
}
const licenses = await fetch(`${origin}/licenses.txt`);
assert.equal(licenses.status, 200);
assert.equal(await licenses.text(), await readFile(new URL('dist/licenses.txt', root), 'utf8'));
for (const path of ['/experiences/conche/guide/', '/experiences/nope/', '/vendor/old.js']) {
  assert.equal((await fetch(`${origin}${path}`)).status, 404);
}
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  try {
    await page.goto(`${origin}/?${celebrationSearch(celebration)}`);
    await page.waitForSelector('html[data-state="ready"]');
    const id = await page.locator('html').getAttribute('data-experience-id');
    assert(experiences.some(item => item.id === id));
  } finally { await page.close(); }
  for (const experience of experiences) {
    console.log(`Production ${experience.id}`);
    await verifyCelebration(browser, origin, { experience });
  }
  for (const id of ['aperture-lab', 'driftline-ocean', 'formwork-chroma', 'formwork-neon']) {
    await verifyMotion(browser, origin, experiences.find(item => item.id === id), { touch: true, sustained: true });
  }
} finally { await browser.close(); }
console.log('Production random entry, all sixteen celebrations, sustained motion, touch controls and exact deployed assets verified');
