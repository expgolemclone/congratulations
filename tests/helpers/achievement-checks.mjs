import assert from 'node:assert/strict';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';

export const celebration = {
  source: 'chushoks.kakomonn.com', date: '2026-08-13', achievement: 'daily-study-quota',
};

export async function observePage(page, origin) {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => errors.push(`${request.failure()?.errorText} ${request.url()}`));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      errors.push(`External request: ${url}`);
      await route.abort();
    } else {
      await route.continue();
    }
  });
  return errors;
}

export async function assertNoOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
}

export async function verifyCelebration(browser, origin, { viewport, reducedMotion = 'no-preference', screenshot } = {}) {
  const page = await browser.newPage({ viewport, reducedMotion });
  const errors = await observePage(page, origin);
  await page.addInitScript(() => {
    window.__readyMessages = [];
    window.addEventListener('message', event => {
      if (event.data?.type === 'celebration:ready') window.__readyMessages.push(event.data);
    });
  });
  try {
    const response = await page.goto(`${origin}/?${celebrationSearch(celebration)}`, { waitUntil: 'load' });
    assert.equal(response.status(), 200);
    assert.equal(response.headers()['cache-control'], 'no-cache');
    assert.match(response.headers()['content-security-policy'], /frame-ancestors 'self'/);
    await page.waitForSelector('html[data-state="ready"]');
    await page.getByRole('heading', { level: 1, name: 'You did it!' }).waitFor();
    await page.getByRole('heading', { level: 2, name: 'Daily study quota' }).waitFor();
    assert.equal(await page.locator('time').getAttribute('datetime'), celebration.date);
    assert.match(await page.locator('main').innerText(), /August 13, 2026/);
    assert.match(await page.locator('main').innerText(), /chushoks\.kakomonn\.com/);
    assert.equal(await page.locator('iframe, nav, a, audio, video').count(), 0);
    await page.waitForFunction(() => window.__readyMessages.length === 1);
    assert.deepEqual(await page.evaluate(() => window.__readyMessages[0].celebration), celebration);
    await assertNoOverflow(page);

    if (reducedMotion === 'reduce') {
      assert.equal(await page.locator('canvas').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Celebrate again' }).count(), 0);
    } else {
      // Screenshots verify changing pixels, including canvas-confetti's offscreen worker.
      const canvas = page.locator('canvas');
      await canvas.waitFor({ state: 'visible' });
      const firstFrame = await canvas.screenshot();
      const secondFrame = await canvas.screenshot();
      assert.notDeepEqual(firstFrame, secondFrame, 'Confetti must animate, not just create a canvas');
      if (screenshot) await page.screenshot({ path: screenshot, fullPage: true });
      await page.locator('canvas').waitFor({ state: 'detached', timeout: 15_000 });
      const replay = page.getByRole('button', { name: 'Celebrate again' });
      await replay.focus();
      await page.keyboard.press('Enter');
      await page.locator('canvas').waitFor({ state: 'attached' });
      // Motion preference changes stop an in-flight celebration as well.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('canvas').waitFor({ state: 'detached' });
      assert.equal(await page.getByRole('heading', { name: 'You did it!' }).isVisible(), true);
    }
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
}
