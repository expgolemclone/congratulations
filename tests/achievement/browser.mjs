import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { startStaticServer } from '../helpers/server-helper.mjs';
import { assertNoOverflow, celebration, observePage, verifyCelebration } from '../helpers/achievement-checks.mjs';

async function verifyInvalidParameters(browser, origin) {
  const valid = celebrationSearch(celebration);
  for (const query of ['', `${valid}&extra=1`, `${valid}&source=other`, valid.replace('2026-08-13', '2026-02-30')]) {
    const page = await browser.newPage();
    const errors = await observePage(page, origin);
    try {
      await page.goto(`${origin}/?${query}`);
      await page.getByRole('alert').waitFor();
      assert.equal(await page.locator('html').getAttribute('data-state'), 'error');
      assert.equal(await page.locator('canvas, iframe, button').count(), 0);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  }
}

async function verifyGenericCallers(browser, origin) {
  for (const source of ['smec-second', 'workout', 'a'.repeat(128)]) {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
    const errors = await observePage(page, origin);
    const achievement = source === 'workout' ? 'daily-goal' : 'a'.repeat(128);
    try {
      await page.goto(`${origin}/?${celebrationSearch({ source, date: '2026-10-03', achievement })}`);
      await page.waitForSelector('html[data-state="ready"]');
      assert.equal(await page.locator('h2').getAttribute('title'), achievement[0].toUpperCase() + achievement.slice(1).replaceAll('-', ' '));
      assert.equal(await page.getByTitle(source, { exact: true }).count(), 1);
      await assertNoOverflow(page);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  }
}

const server = await startStaticServer();
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
        for (const reducedMotion of ['no-preference', 'reduce']) {
          await verifyCelebration(browser, server.origin, {
            viewport, reducedMotion,
            screenshot: engine === chromium && reducedMotion === 'no-preference'
              ? fileURLToPath(new URL(`../../../celebration-${viewport.width}.png`, import.meta.url))
              : undefined,
          });
        }
      }
      await verifyInvalidParameters(browser, server.origin);
      await verifyGenericCallers(browser, server.origin);
    } finally {
      await browser.close();
    }
  }
  console.log('Achievement celebration passed Chromium and WebKit: mobile, desktop, replay, reduced motion and validation');
} finally {
  await server.stop();
  assert.equal(server.getStderr(), '');
}
