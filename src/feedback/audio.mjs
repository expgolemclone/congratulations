import { createCorrectChimeWave, createSilentWave } from './chime.mjs';

export const FEEDBACK_AUDIO_URLS = Object.freeze({
  normal: new URL('./audio/correct-normal.mp3', import.meta.url).href,
  rare: new URL('./audio/correct-rare.mp3', import.meta.url).href,
  'super-rare': new URL('./audio/correct-super-rare.mp3', import.meta.url).href,
  ssr: new URL('./audio/correct-ssr.mp3', import.meta.url).href,
  incorrect: new URL('./audio/incorrect.mp3', import.meta.url).href,
});
export function createFeedbackSilence() {
  return new Blob([createSilentWave()], { type: 'audio/wav' });
}

// The caller owns gesture activation, cancellation and any subsequent speech.
export async function playCorrectFeedbackAudio(variant, playAudio) {
  if (!await playAudio(new Blob([createCorrectChimeWave(variant)], { type: 'audio/wav' }), 'Correct chime')) return false;
  return playAudio(FEEDBACK_AUDIO_URLS[variant.id], variant.speechText);
}
