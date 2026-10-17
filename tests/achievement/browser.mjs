import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { achievementLabel, celebrationCopy, experiences } from '../../src/achievement/experiences.mjs';
import { startStaticServer } from '../helpers/server-helper.mjs';
import { assertNoOverflow, celebration, interactWithExperience, observePage, verifyCelebration, verifyMotion } from '../helpers/achievement-checks.mjs';

const search = celebrationSearch(celebration);
async function verifyInvalidParameters(browser, origin) {
  for (const path of ['/', '/experiences/conche/']) {
    for (const query of ['', `${search}&extra=1`, `${search}&source=other`, search.replace('2026-08-13', '2026-02-30')]) {
      const page = await browser.newPage();
      const errors = await observePage(page, origin);
      try {
        await page.goto(`${origin}${path}?${query}`);
        await page.getByRole('alert').waitFor();
        assert.equal(await page.locator('html').getAttribute('data-state'), 'error');
        assert.equal(await page.locator('canvas, iframe, button').count(), 0);
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    }
  }
  for (const path of ['/experiences/nope/', '/experiences/conche/guide/', '/vendor/old.js']) {
    assert.equal((await fetch(`${origin}${path}`)).status, 404);
  }
}

async function verifyGenericCallers(browser, origin) {
  for (const experience of experiences) {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce', hasTouch: true });
    const errors = await observePage(page, origin);
    const source = 'a'.repeat(128), achievement = 'b'.repeat(128);
    try {
      await page.goto(`${origin}/experiences/${experience.id}/?${celebrationSearch({ source, date: '2026-10-03', achievement })}`);
      await page.waitForSelector('html[data-state="ready"]');
      const art = page.locator('canvas[data-artwork]');
      if (await art.count()) await page.waitForSelector('canvas[data-art-state="ready"]');
      assert.equal(await page.locator('h2').getAttribute('title'), achievementLabel(achievement));
      assert.equal(await page.getByTitle(source, { exact: true }).count(), 1);
      assert.doesNotMatch(await page.locator('main').innerText(), /今日の学習ノルマ|全問|満点|残り0|queue clear/i);
      await assertNoOverflow(page);
      await interactWithExperience(page, experience, true, { source, date: '2026-10-03', achievement });
      await assertNoOverflow(page); assert.deepEqual(errors, [], experience.id);
    } finally { await page.close(); }
  }
}

async function verifyRandomEntry(browser, origin) {
  for (let index = 0; index < experiences.length; index++) {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    try {
      await page.addInitScript(index => {
        const native = crypto.getRandomValues.bind(crypto);
        let first = true;
        crypto.getRandomValues = array => {
          if (first && array instanceof Uint32Array) { array[0] = index; first = false; return array; }
          return native(array);
        };
      }, index);
      await page.goto(`${origin}/?${search}`);
      await page.waitForSelector(`html[data-experience-id="${experiences[index].id}"]`);
    } finally { await page.close(); }
  }
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = await observePage(page, origin);
  try {
    await page.goto(`${origin}/experiences/conche/?${search}`);
    await page.getByRole('button', { name: '別の祝福を見る' }).click();
    await page.waitForFunction(() => document.documentElement.dataset.state === 'ready' &&
      document.documentElement.dataset.experienceId !== 'conche');
    assert.equal(new URL(page.url()).search.slice(1), search);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
}

async function verifySuspension(browser, origin) {
  const page = await browser.newPage({ viewport: { width: 390, height: 240 }, reducedMotion: 'no-preference' });
  const errors = await observePage(page, origin);
  await page.addInitScript(() => {
    window.__draws = 0;
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) {
      const context = native.call(this, type, options);
      if (type === '2d' && context && !context.__observed) {
        context.__observed = true;
        const clear = context.clearRect.bind(context);
        context.clearRect = (...args) => { window.__draws++; return clear(...args); };
      }
      return context;
    };
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => Boolean(window.__hidden) });
  });
  try {
    await page.goto(`${origin}/experiences/driftline-ocean/?${search}`);
    const canvas = page.locator('canvas[data-artwork]');
    await page.waitForSelector('canvas[data-art-state="ready"]');
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForSelector('canvas[data-motion="running"]');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForSelector('canvas[data-motion="suspended"]');
    const offscreen = await page.evaluate(() => window.__draws);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__draws), offscreen);
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForSelector('canvas[data-motion="running"]');
    await page.evaluate(() => { window.__hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForSelector('canvas[data-motion="suspended"]');
    const hidden = await page.evaluate(() => window.__draws);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__draws), hidden);
    await page.evaluate(() => { window.__hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForSelector('canvas[data-motion="running"]');
    await page.waitForFunction(previous => window.__draws > previous, hidden);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
}

async function verifyDrawingFailure(browser, origin) {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  try {
    await page.route('**/assets/three-*.js', route => route.fulfill({ status: 503, body: 'Unavailable' }));
    await page.goto(`${origin}/experiences/formwork-isometria/?${search}`);
    await page.getByRole('alert').getByText('祝福の光景を描画できませんでした').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-experience-id'), 'formwork-isometria');
    assert.equal(await page.locator('canvas[data-art-state="error"]').count(), 1);
    assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), celebrationCopy(celebration).title);
  } finally { await page.close(); }
}

const server = await startStaticServer();
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const experience of experiences) {
        for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
          console.log(`${engine.name()} ${experience.id} ${viewport.width}`);
          await verifyCelebration(browser, server.origin, { experience, viewport,
            screenshot: engine === chromium ? fileURLToPath(new URL(`../../../${experience.id}-${viewport.width}.png`, import.meta.url)) : undefined });
        }
      }
      await verifyInvalidParameters(browser, server.origin);
      await verifyGenericCallers(browser, server.origin);
      await verifyRandomEntry(browser, server.origin);
      for (const experience of experiences) {
        console.log(`${engine.name()} animation ${experience.id}`);
        await verifyMotion(browser, server.origin, experience, {
          sustained: ['driftline-ocean', 'formwork-chroma', 'formwork-neon'].includes(experience.id),
          touch: ['aperture-lab', 'halfstep'].includes(experience.id),
        });
      }
      await verifySuspension(browser, server.origin);
      await verifyDrawingFailure(browser, server.origin);
    } finally { await browser.close(); }
  }
  console.log('All sixteen celebrations passed mobile touch, desktop keyboard, random entry, motion, failure and contract checks in Chromium and WebKit');
} finally { await server.stop(); assert.equal(server.getStderr(), ''); }
