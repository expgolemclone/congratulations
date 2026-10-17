import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { expect } from 'playwright/test';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { experiences } from '../../src/achievement/experiences.mjs';
import { startStaticServer } from '../helpers/server-helper.mjs';
import { celebration, verifyExperience } from '../helpers/experience-checks.mjs';
import { verifyGraphics } from '../helpers/graphics-checks.mjs';

const server = await startStaticServer();
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const experience of experiences) {
        for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
          console.log(`${engine.name()} ${experience.id} ${viewport.width}`);
          await verifyExperience(browser, server.origin, { ...experience }, { viewport,
            screenshot: engine === chromium ? fileURLToPath(new URL(`../../../${experience.id}-${viewport.width}.png`, import.meta.url)) : undefined });
        }
      }
      for (let index = 0; index < experiences.length; index++) {
        const page = await browser.newPage({ reducedMotion: 'reduce' });
        try {
          await page.addInitScript(index => {
            const native = crypto.getRandomValues.bind(crypto);
            let first = true;
            crypto.getRandomValues = array => {
              if (first && array instanceof Uint32Array) { first = false; array[0] = index; return array; }
              return native(array);
            };
          }, index);
          await page.goto(`${server.origin}/?${celebrationSearch(celebration)}`);
          await page.waitForSelector(`html[data-state="ready"][data-experience-id="${experiences[index].id}"]`);
        } finally { await page.close(); }
      }
      const page = await browser.newPage({ reducedMotion: 'reduce' });
      try {
        await page.goto(`${server.origin}/experiences/conche/?${celebrationSearch(celebration)}`);
        await page.getByRole('link', { name: 'See another celebration', exact: true }).click();
        await page.waitForFunction(() => document.documentElement.dataset.state === 'ready' && document.documentElement.dataset.experienceId !== 'conche');
        assert.equal(new URL(page.url()).search.slice(1), celebrationSearch(celebration));
        let blockedImage;
        await page.route('**/formwork-meridian/assets/hero.jpg', route => { blockedImage = route; });
        await page.goto(`${server.origin}/experiences/formwork-meridian/?${celebrationSearch(celebration)}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('html[data-state="ready"]');
        assert(blockedImage, 'Native readiness must not wait for illustration downloads');
        assert.notEqual(await page.evaluate(() => document.readyState), 'complete');
        await blockedImage.continue();
        await page.unroute('**/formwork-meridian/assets/hero.jpg');
        await page.locator('header a.brand').click();
        await page.waitForSelector('html[data-state="ready"]');
        assert.equal(new URL(page.url()).search.slice(1), celebrationSearch(celebration));
        for (const path of ['/', '/experiences/conche/']) {
          for (const query of ['', `${celebrationSearch(celebration)}&extra=1`, `${celebrationSearch(celebration)}&source=other`]) {
            await page.goto(`${server.origin}${path}?${query}`);
            await page.getByRole('alert').waitFor();
            await expect(page.locator('html')).toHaveAttribute('data-state', 'error');
            assert.equal(await page.locator('canvas').count(), 0);
          }
        }
      } finally { await page.close(); }
      await verifyExperience(browser, server.origin, experiences[0], { viewport: { width: 320, height: 568 },
        details: { source: 'a'.repeat(128), date: '2026-10-03', achievement: 'b'.repeat(128) } });
      await verifyGraphics(browser, server.origin);
      console.log(`Native experiences, contract, random entry, navigation and graphics passed: ${engine.name()}`);
    } finally { await browser.close(); }
  }
} finally { await server.stop(); assert.equal(server.getStderr(), ''); }
