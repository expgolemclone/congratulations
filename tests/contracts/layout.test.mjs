import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { injectExperienceRuntime } from '../../scripts/inject-experience-runtime.mjs';

const root = new URL('../../', import.meta.url);
test('source categories have no stale root copies and all runtime injection paths resolve', async () => {
  for (const old of ['contracts/', 'shared/', 'router.js', 'shell.css', 'celebration-selection.mjs', 'celebrations.json']) {
    assert.equal(existsSync(new URL(old, root)), false, old);
  }
  const manifest = JSON.parse(await readFile(new URL('src/achievement/experiences.json', root), 'utf8'));
  for (const experience of manifest.experiences) {
    const source = await readFile(new URL(`${experience.entry}index.html`, root), 'utf8');
    assert.equal(injectExperienceRuntime(source, experience.id), source, experience.id);
  }
});
test('runtime injection is strict, idempotent and inserts before the closing body', () => {
  const source = '<body><h1>Goal</h1></body>';
  const injected = injectExperienceRuntime(source, 'example');
  assert(injected.includes('announceCelebration("example")'));
  assert(injected.endsWith('</body>'));
  assert.equal(injectExperienceRuntime(injected, 'example'), injected);
  assert.throws(() => injectExperienceRuntime(source, '../unsafe'), /invalid/);
  assert.throws(() => injectExperienceRuntime('<h1>Goal</h1>', 'example'), /closing body/);
});
