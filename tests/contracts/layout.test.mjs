import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
test('the achievement screen has no product snapshots or iframe infrastructure', () => {
  for (const old of ['experiences/', 'public/vendor/', 'scripts/', 'src/achievement/experiences.json',
    'src/achievement/router.js', 'src/achievement/experience-runtime.js', 'src/achievement/selection.mjs',
    'src/achievement/shell.css']) {
    assert.equal(existsSync(new URL(old, root)), false, old);
  }
  assert.equal(existsSync(new URL('src/achievement/main.jsx', root)), true);
});
