export const experiences = Object.freeze([
  ['aperture-lab', 'Aperture Lab'], ['conche', 'Conche'], ['driftline-ocean', 'Driftline Ocean'],
  ['fathom', 'Fathom'], ['formwork-chroma', 'Chroma'], ['formwork-contour', 'Contour'],
  ['formwork-heliodon', 'Heliodon'], ['formwork-isometria', 'Isometria'], ['formwork-meridian', 'Meridian'],
  ['formwork-nebula', 'Nebula Drift'], ['formwork-neon', 'Neon Sprawl'], ['glyphica', 'Glyphica'],
  ['halcyon-ring', 'Halcyon Ring'], ['halfstep', 'Halfstep'], ['northbound-ev', 'Northbound'], ['perigee-astro', 'Perigee'],
].map(([id, label]) => Object.freeze({ id, label })));

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
  if (achievement === 'daily-study-quota') return 'Daily study goal';
  return achievement[0].toUpperCase() + achievement.slice(1).replace(/[.-]+/g, ' ');
}
