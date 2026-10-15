import { CORRECT_CHIME_SAMPLE_RATE, CORRECT_FEEDBACK_VARIANTS } from './variants.mjs';

function createWave(sampleCount) {
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const text = (offset, value) => {
    for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
  };
  text(0, 'RIFF');
  view.setUint32(4, buffer.byteLength - 8, true);
  text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, CORRECT_CHIME_SAMPLE_RATE, true);
  view.setUint32(28, CORRECT_CHIME_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, sampleCount * 2, true);
  return buffer;
}

export function createSilentWave() {
  return createWave(Math.ceil(CORRECT_CHIME_SAMPLE_RATE * 0.1));
}

export function createCorrectChimeWave(variant) {
  if (!CORRECT_FEEDBACK_VARIANTS.includes(variant)) throw new TypeError('Feedback variant is invalid.');
  const { duration, gain, tones } = variant.chime;
  const sampleCount = Math.ceil(CORRECT_CHIME_SAMPLE_RATE * duration);
  const buffer = createWave(sampleCount);
  const view = new DataView(buffer);
  for (let index = 0; index < sampleCount; index++) {
    const time = index / CORRECT_CHIME_SAMPLE_RATE;
    let sample = 0;
    for (const tone of tones) {
      const toneTime = time - tone.start;
      if (toneTime < 0 || toneTime >= tone.duration) continue;
      const progress = toneTime / tone.duration;
      const attack = Math.min(1, toneTime / 0.008);
      const release = (1 - progress) ** 2;
      sample += Math.sin(2 * Math.PI * tone.frequency * toneTime) * attack * release * gain;
    }
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
  }
  return buffer;
}
