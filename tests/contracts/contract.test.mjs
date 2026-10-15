import assert from 'node:assert/strict';
import test from 'node:test';
import { celebrationSearch, celebrationURL, isCelebration, parseCelebration } from '@expgolemclone/congratulations/celebration';

test('arbitrary applications and achievements share the same contract', () => {
  for (const source of ['chushoks.kakomonn.com', 'smec-second', 'workout']) {
    const value = { source, date: '2026-10-03', achievement: 'daily-goal' };
    assert.deepEqual(parseCelebration(celebrationSearch(value)), value);
    assert.equal(new URL(celebrationURL(value)).hostname, 'kakomonn-congratulations.kakomonn.workers.dev');
  }
});

test('rejects invalid dates, duplicated or unknown parameters and the old KPI contract', () => {
  const value = { source: 'smec-second', date: '2026-10-03', achievement: 'daily-study-quota' };
  for (const invalid of [ { ...value, date: '2026-02-30' }, { ...value, source: '<script>' },
    { ...value, achievement: '' }, { ...value, token: 'secret' } ]) assert.equal(isCelebration(invalid), false);
  for (const query of ['', 'site=chushoks.kakomonn.com&date=2026-10-03&dailyKpiCompleted=true',
    `${celebrationSearch(value)}&source=other`, `${celebrationSearch(value)}&extra=1`]) {
    assert.throws(() => parseCelebration(query), /invalid/);
  }
});
