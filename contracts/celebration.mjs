export const CELEBRATION_ORIGIN = 'https://kakomonn-congratulations.kakomonn.workers.dev';
export const READY_MESSAGE = 'celebration:ready';
const keys = ['achievement', 'date', 'source'];
const identifier = /^[a-z0-9](?:[a-z0-9.-]{0,126}[a-z0-9])?$/;

export function isCelebration(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join(',') !== keys.join(',') ||
      typeof value.source !== 'string' || !identifier.test(value.source) ||
      typeof value.achievement !== 'string' || !identifier.test(value.achievement) ||
      typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return false;
  const date = new Date(`${value.date}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value.date;
}

export function celebrationSearch(celebration) {
  if (!isCelebration(celebration)) throw new TypeError('Celebration parameters are invalid.');
  return new URLSearchParams(keys.map(key => [key, celebration[key]])).toString();
}

export function parseCelebration(search) {
  const parameters = new URLSearchParams(search);
  if ([...parameters.keys()].sort().join(',') !== keys.join(',')) {
    throw new TypeError('Celebration parameters are invalid.');
  }
  const celebration = Object.fromEntries(parameters);
  if (!isCelebration(celebration)) throw new TypeError('Celebration parameters are invalid.');
  return celebration;
}

export function celebrationURL(celebration) {
  return `${CELEBRATION_ORIGIN}/?${celebrationSearch(celebration)}`;
}
