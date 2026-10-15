import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the static celebration revalidates HTML and caches content-addressed assets', async () => {
  const source = (await readFile(new URL('../../public/_headers', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  assert.match(source, /^\/\*\n  Cache-Control: no-cache\n/);
  assert.match(source, /\/assets\/\*\n  ! Cache-Control\n  Cache-Control: public, max-age=31536000, immutable/);
  assert.match(source, /frame-ancestors 'self'/);
  assert.match(source, /frame-src 'none'/);
  assert.match(source, /script-src 'self';/);
  assert.match(source, /object-src 'none'/);
  assert.doesNotMatch(source, /experiences|vendor/);
  const worker = JSON.parse(await readFile(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(worker.observability.enabled, false);
  assert.equal(worker.assets.run_worker_first, undefined);
  assert.equal(worker.main, undefined);
});
