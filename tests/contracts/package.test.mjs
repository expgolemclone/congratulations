import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { celebrationURL } from '@expgolemclone/congratulations/celebration';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

test('the congratulations package exposes only its two public entries', async () => {
  assert.equal(manifest.name, '@expgolemclone/congratulations');
  assert.deepEqual(manifest.exports, {
    './celebration': './src/contracts/celebration.mjs', './feedback': './src/feedback/index.mjs',
  });
  assert.equal(celebrationURL({ source: 'workout', date: '2026-10-03', achievement: 'daily-goal' }),
    'https://kakomonn-congratulations.kakomonn.workers.dev/?achievement=daily-goal&date=2026-10-03&source=workout');
  for (const entry of ['@expgolemclone/congratulations',
    '@expgolemclone/congratulations/src/contracts/celebration.mjs']) {
    await assert.rejects(import(entry), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
  }
  const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
  assert.equal(lock.name, manifest.name);
  assert.equal(lock.version, manifest.version);
  assert.equal(lock.packages[''].name, manifest.name);
  assert.equal(lock.packages[''].version, manifest.version);
});

test('the published archive excludes site snapshots, vendors and private implementation', () => {
  assert(process.env.npm_execpath, 'Run package verification through npm test');
  const result = spawnSync(process.execPath,
    [process.env.npm_execpath, 'pack', '--dry-run', '--json'],
    { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const [archive] = JSON.parse(result.stdout);
  assert.equal(archive.name, manifest.name);
  assert.equal(archive.version, manifest.version);
  assert.equal(archive.filename, `expgolemclone-congratulations-${manifest.version}.tgz`);
  assert.deepEqual(archive.files.map(file => file.path).sort(),
    ['LICENSE', 'README.md', 'package.json', 'src/contracts/celebration.mjs',
      ...['audio.mjs', 'chime.mjs', 'index.mjs', 'player.mjs', 'styles.mjs', 'variants.mjs', 'view.mjs',
        'audio/correct-normal.mp3', 'audio/correct-rare.mp3', 'audio/correct-super-rare.mp3',
        'audio/correct-ssr.mp3', 'audio/incorrect.mp3'].map(name => `src/feedback/${name}`)].sort());
});
