export const experiences = Object.freeze([
  { id: 'aperture-lab', label: 'Aperture Lab', color: 'orange', scheme: 'light', background: '#f5f0e8' },
  { id: 'conche', label: 'Conche', color: 'orange', scheme: 'light', background: '#f6efe3' },
  { id: 'driftline-ocean', label: 'Driftline Ocean', color: 'teal', scheme: 'dark', background: '#061a2b' },
  { id: 'fathom', label: 'Fathom', color: 'cyan', scheme: 'dark', background: '#081c2c' },
  { id: 'formwork-chroma', label: 'Chroma', color: 'violet', scheme: 'dark', background: '#050507' },
  { id: 'formwork-contour', label: 'Contour', color: 'orange', scheme: 'light', background: '#e9e2d0' },
  { id: 'formwork-heliodon', label: 'Heliodon', color: 'gray', scheme: 'dark', background: '#111114' },
  { id: 'formwork-isometria', label: 'Isometria', color: 'green', scheme: 'light', background: '#e4f6fc' },
  { id: 'formwork-meridian', label: 'Meridian', color: 'orange', scheme: 'dark', background: '#171512' },
  { id: 'formwork-nebula', label: 'Nebula Drift', color: 'grape', scheme: 'dark', background: '#05060a' },
  { id: 'formwork-neon', label: 'Neon Sprawl', color: 'pink', scheme: 'dark', background: '#170d2b' },
  { id: 'glyphica', label: 'Glyphica', color: 'dark', scheme: 'light', background: '#f4f1e8' },
  { id: 'halcyon-ring', label: 'Halcyon Ring', color: 'violet', scheme: 'dark', background: '#141026' },
  { id: 'halfstep', label: 'Halfstep', color: 'lime', scheme: 'light', background: '#ece7dd' },
  { id: 'northbound-ev', label: 'Northbound', color: 'green', scheme: 'dark', background: '#12180f' },
  { id: 'perigee-astro', label: 'Perigee', color: 'indigo', scheme: 'dark', background: '#0a0d18' },
].map(Object.freeze));

const UINT32_RANGE = 0x1_0000_0000;
export function randomIndex(length, cryptoSource = globalThis.crypto) {
  if (!Number.isSafeInteger(length) || length <= 0 || length > UINT32_RANGE) throw new RangeError('Invalid selection size.');
  const accepted = UINT32_RANGE - UINT32_RANGE % length;
  const value = new Uint32Array(1);
  do { cryptoSource.getRandomValues(value); } while (value[0] >= accepted);
  return value[0] % length;
}
export function chooseExperience(exclude, cryptoSource = globalThis.crypto) {
  const choices = experiences.filter(experience => experience.id !== exclude);
  return choices[randomIndex(choices.length, cryptoSource)];
}
export function experienceForPath(path) {
  if (path === '/' || path === '/index.html') return null;
  const id = /^\/experiences\/([a-z0-9-]+)\/(?:index\.html)?$/.exec(path)?.[1];
  const experience = experiences.find(item => item.id === id);
  if (!experience) throw new TypeError('この祝福ページは見つかりません.');
  return experience;
}
export function achievementLabel(achievement) {
  if (achievement === 'daily-study-quota') return '今日の学習ノルマ';
  return achievement[0].toUpperCase() + achievement.slice(1).replace(/[.-]+/g, ' ');
}
export function celebrationCopy(celebration) {
  const study = celebration.achievement === 'daily-study-quota';
  return {
    title: study ? '今日のノルマ達成.' : '目標達成.',
    message: study ? '勉強, おつかれさまでした.' : 'おつかれさまでした.',
    closing: 'ひと区切りです. 少し休憩しませんか.',
  };
}
