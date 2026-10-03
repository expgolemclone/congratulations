import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CORRECT_FEEDBACK_VARIANTS, CORRECT_CHIME_SAMPLE_RATE, createCorrectChimeWave,
  FEEDBACK_AUDIO_URLS, playCorrectFeedbackAudio } from '@expgolemclone/congratulations/feedback';

test('every tier has a bounded PCM chime and a nonempty local MP3', async () => {
  for (const variant of CORRECT_FEEDBACK_VARIANTS) {
    const wave = createCorrectChimeWave(variant);
    const view = new DataView(wave);
    assert.equal(new TextDecoder().decode(wave.slice(0, 4)), 'RIFF');
    assert.equal(view.getUint32(24, true), CORRECT_CHIME_SAMPLE_RATE);
    assert.equal(wave.byteLength, 44 + 2 * Math.ceil(CORRECT_CHIME_SAMPLE_RATE * variant.chime.duration));
    const samples = new Int16Array(wave.slice(44));
    assert(samples.some(sample => sample !== 0));
    assert((await readFile(new URL(FEEDBACK_AUDIO_URLS[variant.id]))).length > 1000);
  }
  assert((await readFile(new URL(FEEDBACK_AUDIO_URLS.incorrect))).length > 1000);
  assert.throws(() => createCorrectChimeWave({}), /invalid/);
});

test('the shared sequence plays only chime then the matching fixed voice', async () => {
  const variant = CORRECT_FEEDBACK_VARIANTS[1];
  const calls = [];
  assert.equal(await playCorrectFeedbackAudio(variant, async (source, label) => {
    calls.push({ source, label }); return true;
  }), true);
  assert.equal(calls[0].source.type, 'audio/wav');
  assert.equal(calls[1].source, FEEDBACK_AUDIO_URLS.rare);
  assert.equal(calls[1].label, variant.speechText);
  let count = 0;
  assert.equal(await playCorrectFeedbackAudio(variant, async () => { count++; return false; }), false);
  assert.equal(count, 1);
  await assert.rejects(playCorrectFeedbackAudio(variant, async () => { throw Error('blocked'); }), /blocked/);
});
