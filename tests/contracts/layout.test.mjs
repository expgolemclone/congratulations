import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
test('celebrations share React/Mantine instead of restoring vendor apps and iframe infrastructure', () => {
  for (const old of ['experiences/', 'public/vendor/', 'scripts/', 'src/achievement/router.js',
    'src/achievement/experience-runtime.js', 'src/achievement/shell.css']) {
    assert.equal(existsSync(new URL(old, root)), false, old);
  }
  for (const source of ['src/achievement/main.jsx', 'src/achievement/experiences.mjs', 'src/achievement/Experience.jsx']) {
    assert.equal(existsSync(new URL(source, root)), true, source);
  }
});
