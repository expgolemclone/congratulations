import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';
import { experiences } from '../../src/achievement/experiences.mjs';

const root = new URL('../../', import.meta.url);
test('native designs keep their own assets and license notices', async () => {
  for (const { id } of experiences) {
    const directory = new URL(`experiences/${id}/`, root);
    assert(existsSync(new URL('index.html', directory)), id);
    assert.match(await readFile(new URL('LICENSE', directory), 'utf8'), /Permission is hereby granted/);
    const html = await readFile(new URL('index.html', directory), 'utf8');
    assert.match(html, /<main[\s>]/);
    function inspect(node) {
      if (node.tagName === 'input') {
        const attrs = Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
        assert(!['email', 'password'].includes(attrs.type), `${id} must not collect credentials`);
      }
      for (const child of node.childNodes || []) inspect(child);
    }
    inspect(parse(html));
  }
});

test('shared integration does not replace native artwork or unify section design', () => {
  for (const removed of ['src/achievement/Experience.jsx', 'src/achievement/Artwork.jsx', 'src/achievement/artwork/']) {
    assert.equal(existsSync(new URL(removed, root)), false, removed);
  }
  assert(existsSync(new URL('src/achievement/experience-runtime.js', root)));
});
