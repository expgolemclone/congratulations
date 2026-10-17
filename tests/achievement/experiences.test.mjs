import assert from 'node:assert/strict';
import test from 'node:test';
import { achievementLabel, celebrationCopy, chooseExperience, experienceForPath, experiences, randomIndex } from '../../src/achievement/experiences.mjs';

const cryptoWith = (...values) => ({ getRandomValues(array) {
  assert(values.length, 'Unexpected random draw'); array[0] = values.shift(); return array;
} });

test('all sixteen original identities share factual copy, not sixteen forced metaphors', () => {
  assert.deepEqual(experiences.map(item => item.id), ['aperture-lab', 'conche', 'driftline-ocean', 'fathom',
    'formwork-chroma', 'formwork-contour', 'formwork-heliodon', 'formwork-isometria', 'formwork-meridian',
    'formwork-nebula', 'formwork-neon', 'glyphica', 'halcyon-ring', 'halfstep', 'northbound-ev', 'perigee-astro']);
  for (const key of ['id', 'label']) assert.equal(new Set(experiences.map(item => item[key])).size, 16, key);
  for (const experience of experiences) {
    assert.match(experience.background, /^#[a-f0-9]{6}$/);
    assert(Object.isFrozen(experience));
    assert.equal(new Set(experience.chapters).size, 4);
    assert.deepEqual([...experience.chapters].sort(), ['exhibit', 'note', 'panorama', 'record']);
    assert.equal(experience.chapters.at(-1), 'panorama');
    assert(Object.isFrozen(experience.chapters));
    assert.match(experience.artwork, /^[a-z]+$/);
    assert(experience.exhibit.length > 0);
    assert(['editorial', 'receipt', 'center', 'reverse'].includes(experience.layout));
    assert.equal(experienceForPath(`/experiences/${experience.id}/`), experience);
    assert.equal(experienceForPath(`/experiences/${experience.id}/index.html`), experience);
  }
});

test('random selection gives every experience an equal set of buckets', () => {
  const counts = new Map(experiences.map(item => [item.id, 0]));
  for (let i = 0; i < 1024; i++) {
    const selected = chooseExperience(undefined, cryptoWith(i));
    counts.set(selected.id, counts.get(selected.id) + 1);
  }
  assert.deepEqual([...counts.values()], Array(16).fill(64));
  for (const previous of experiences) {
    const choices = new Set(Array.from({ length: 15 }, (_, i) => chooseExperience(previous.id, cryptoWith(i)).id));
    assert.equal(choices.size, 15);
    assert.equal(choices.has(previous.id), false);
  }
});

test('rejection sampling avoids modulo bias and validates sizes', () => {
  assert.equal(randomIndex(15, cryptoWith(0xffff_ffff, 14)), 14);
  assert.equal(randomIndex(1, cryptoWith(0xffff_ffff)), 0);
  assert.equal(randomIndex(0x1_0000_0000, cryptoWith(0xffff_ffff)), 0xffff_ffff);
  for (const size of [0, -1, 1.5, NaN, Infinity, 0x1_0000_0001]) assert.throws(() => randomIndex(size), RangeError);
});

test('unknown routes fail explicitly instead of selecting a substitute', () => {
  assert.equal(experienceForPath('/'), null);
  assert.equal(experienceForPath('/index.html'), null);
  for (const path of ['/experiences/nope/', '/experiences/conche/guide/', '/nope/', '/experiences/conche/extra']) {
    assert.throws(() => experienceForPath(path), TypeError);
  }
});

test('achievement labels use supplied identifiers, not invented learning results', () => {
  assert.equal(achievementLabel('daily-study-quota'), '今日の学習ノルマ');
  assert.equal(achievementLabel('daily-goal'), 'Daily goal');
  assert.equal(achievementLabel('a'.repeat(128)), 'A' + 'a'.repeat(127));
  assert.deepEqual(celebrationCopy({ achievement: 'daily-study-quota' }), {
    title: '今日のノルマ達成.', message: '勉強, おつかれさまでした.', closing: 'ひと区切りです. 少し休憩しませんか.',
  });
  const generic = celebrationCopy({ achievement: 'daily-goal' });
  assert.equal(generic.title, '目標達成.');
  assert.doesNotMatch(Object.values(generic).join(' '), /勉強|合格|全問|満点|あなたの光|軌跡|島/);
});
