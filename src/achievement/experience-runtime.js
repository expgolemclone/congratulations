import { celebrationSearch, parseCelebration, READY_MESSAGE } from '../contracts/celebration.mjs';
import { achievementLabel, chooseExperience, experienceForPath } from './experiences.mjs';

async function start() {
  let celebration;
  const experience = experienceForPath(location.pathname);
  try {
    celebration = parseCelebration(location.search);
  } catch {
    // Invalid direct entries use the same error screen as the random entry.
    // No substitute experience is selected or announced.
    location.replace(`/${location.search}`);
    return;
  }
  if (document.readyState !== 'complete') await new Promise(resolve => addEventListener('DOMContentLoaded', resolve, { once: true }));
  if (experience.id === 'glyphica' && !window.glyphicaReady) {
    await new Promise(resolve => addEventListener('glyphica:ready', resolve, { once: true }));
  }
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.getAttribute('href'), location.href);
    if (url.origin === location.origin && url.pathname === location.pathname && !url.search) {
      url.search = celebrationSearch(celebration);
      link.href = url.href;
    }
  }
  // Integrate only after native initialization and hydration have completed.
  const record = document.createElement('div');
  record.className = 'foot-bottom';
  record.id = 'celebration-record';
  record.setAttribute('aria-label', 'Achievement record');
  const title = document.createElement('p');
  const goal = document.createElement('strong');
  goal.append('Goal achieved: ');
  for (const piece of achievementLabel(celebration.achievement).match(/.{1,16}/gu)) {
    goal.append(document.createTextNode(piece), document.createElement('wbr'));
  }
  title.append(goal);
  const details = document.createElement('p');
  const date = document.createElement('time');
  date.dateTime = celebration.date;
  date.textContent = celebration.date;
  const source = document.createElement('span');
  source.title = celebration.source;
  // Break long caller identifiers without truncating or changing their text.
  for (const piece of celebration.source.match(/.{1,16}/gu)) {
    source.append(document.createTextNode(piece), document.createElement('wbr'));
  }
  details.append(date, ' / ', source);
  const note = document.createElement('p');
  note.textContent = 'An illustrated celebration, not a score or a reconstruction of your activity.';
  const next = document.createElement('a');
  next.textContent = 'See another celebration';
  next.href = `/experiences/${chooseExperience(experience.id).id}/?${celebrationSearch(celebration)}`;
  const credit = document.createElement('a');
  credit.textContent = `${experience.label} / upstream design`;
  credit.href = `https://github.com/bswxyz/${experience.id}`;
  record.append(title, details, note, next, document.createTextNode(' / '), credit);
  document.querySelector('footer').append(record);
  document.title = `${experience.label} | Goal achieved`;
  document.documentElement.dataset.state = 'ready';
  document.documentElement.dataset.experienceId = experience.id;
  window.parent.postMessage({ type: READY_MESSAGE, experienceId: experience.id, celebration }, location.origin);
}

start().catch(error => {
  document.documentElement.dataset.state = 'error';
  const alert = document.createElement('p');
  alert.setAttribute('role', 'alert');
  alert.textContent = error.message;
  document.body.prepend(alert);
});
