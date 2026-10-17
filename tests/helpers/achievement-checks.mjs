import assert from 'node:assert/strict';
import { expect } from 'playwright/test';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { achievementLabel, celebrationCopy, experiences } from '../../src/achievement/experiences.mjs';

export const celebration = { source: 'chushoks.kakomonn.com', date: '2026-08-13', achievement: 'daily-study-quota' };
export async function observePage(page, origin) {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('requestfailed', request => errors.push(`${request.failure()?.errorText} ${request.url()}`));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) { errors.push(`External request: ${url}`); await route.abort(); }
    else await route.continue();
  });
  return errors;
}
export async function assertNoOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Horizontal overflow');
}

export async function interactWithExperience(page, experience, touch, details = celebration) {
  const activate = async locator => {
    if (touch) await locator.tap();
    else { await locator.focus(); await page.keyboard.press('Enter'); }
  };
  const button = name => page.getByRole('button', { name, exact: true });
  const slider = page.getByRole('slider').first();
  const received = () => page.getByRole('status').filter({ hasText: celebrationCopy(details).message }).first().waitFor();
  if (await slider.count()) {
    if (touch) {
      const control = page.locator('.mantine-Slider-root').first();
      await control.scrollIntoViewIfNeeded();
      const box = await control.boundingBox();
      await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2);
    } else { await slider.focus(); await page.keyboard.press('End'); }
    await expect(slider).toHaveAccessibleName(/.+/);
    await expect.poll(async () => Number(await slider.getAttribute('aria-valuenow'))).toBeGreaterThan(35);
  }
  switch (experience.id) {
    case 'aperture-lab':
      await activate(button('日付を入れる')); await expect(button('日付を入れる')).toBeDisabled();
      await page.getByRole('status').getByText(details.date, { exact: false }).waitFor(); break;
    case 'conche':
      await activate(button('このあとは'));
      await page.getByText('すぐに続きを始めなくても大丈夫です. 少し休憩しましょう.', { exact: true }).waitFor(); break;
    case 'driftline-ocean': await page.getByRole('status').getByText('大きな波').waitFor(); break;
    case 'fathom': await activate(button('休憩する')); await received(); break;
    case 'formwork-chroma': break;
    case 'formwork-contour':
      await activate(button('旗を立てる')); await expect(button('旗を立てる')).toBeDisabled(); await received(); break;
    case 'formwork-heliodon':
      await activate(button('ひとこと読む'));
      await page.getByText('すぐに次のことを始めなくても大丈夫です. まずは, おつかれさまでした.').waitFor(); break;
    case 'formwork-isometria': {
      const toggle = page.getByRole('switch', { name: '夜の灯台' });
      if (touch) await toggle.tap(); else { await toggle.focus(); await page.keyboard.press('Space'); }
      await expect(toggle).toBeChecked(); break;
    }
    case 'formwork-meridian':
      await activate(button('休憩する')); await received(); await expect(slider).toHaveAttribute('aria-valuenow', '100'); break;
    case 'formwork-nebula':
      await activate(page.getByRole('tab', { name: '再開するときは' }));
      await page.getByText('次に取り組むことを, 一つずつ決めていきましょう.').waitFor(); break;
    case 'formwork-neon': await activate(button('お祝いする')); await received(); break;
    case 'glyphica': {
      const option = page.getByRole('radio', { name: 'ひと休み', exact: true });
      if (touch) await page.getByText('ひと休み', { exact: true }).tap();
      else { await option.focus(); await page.keyboard.press('Space'); }
      await expect(option).toBeChecked(); await page.getByText('ひと休み.', { exact: true }).waitFor(); break;
    }
    case 'halcyon-ring': await activate(button('休憩する')); await received(); break;
    case 'halfstep': {
      const option = page.getByRole('radio', { name: '少し歩く', exact: true });
      if (touch) await page.getByText('少し歩く', { exact: true }).tap();
      else { await option.focus(); await page.keyboard.press('Space'); }
      await expect(option).toBeChecked();
      await page.getByRole('status').getByText('座っていたなら, 少し立ち上がっても.').waitFor();
      await activate(button('休憩する')); break;
    }
    case 'northbound-ev':
      await activate(button('再開するときは'));
      await page.getByText('休んでから, 次に取り組むことを考えても大丈夫です.').waitFor(); break;
    case 'perigee-astro': await activate(button('ひとこと読む')); await received(); break;
    default: assert.fail(`Untested interaction: ${experience.id}`);
  }
}

export async function verifyMotion(browser, origin, experience, { sustained = false, touch = false } = {}) {
  const page = await browser.newPage({ reducedMotion: 'no-preference', hasTouch: touch,
    viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  const errors = await observePage(page, origin);
  const activate = async locator => {
    if (touch) await locator.tap(); else { await locator.focus(); await page.keyboard.press('Enter'); }
  };
  try {
    await page.goto(`${origin}/experiences/${experience.id}/?${celebrationSearch(celebration)}`);
    const canvases = await page.locator('canvas[data-artwork]').all();
    for (let index = 0; index < canvases.length; index++) {
      const canvas = canvases[index], context = `${experience.id} artwork ${index + 1}`;
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await canvas.scrollIntoViewIfNeeded();
      await expect(canvas).toHaveAttribute('data-art-state', 'ready');
      await expect(canvas).toHaveAttribute('data-motion', 'running');
      const first = await canvas.screenshot();
      await page.waitForTimeout(sustained && index === 0 ? 5300 : 200);
      assert.notDeepEqual(await canvas.screenshot(), first, `${context} must keep animating`);
      await activate(page.getByRole('button', { name: '動きを一時停止', exact: true }));
      await expect(canvas).toHaveAttribute('data-motion', 'paused');
      await expect(page.getByRole('button', { name: '祝福をもう一度' })).toBeDisabled();
      const paused = await canvas.screenshot(); await page.waitForTimeout(200);
      assert.deepEqual(await canvas.screenshot(), paused, `${context} must pause`);
      await activate(page.getByRole('button', { name: '動きを再開', exact: true }));
      await canvas.scrollIntoViewIfNeeded();
      await expect(canvas).toHaveAttribute('data-motion', 'running');
      const resumed = await canvas.screenshot(); await page.waitForTimeout(200);
      assert.notDeepEqual(await canvas.screenshot(), resumed, `${context} must resume`);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(canvas).toHaveAttribute('data-motion', 'static');
      assert.equal(await page.getByRole('button', { name: /動きを一時停止|動きを再開|祝福をもう一度/ }).count(), 0);
      assert.equal(await page.locator('canvas:not([data-artwork])').count(), 0);
      const reduced = await canvas.screenshot(); await page.waitForTimeout(200);
      assert.deepEqual(await canvas.screenshot(), reduced, `${context} must respect reduced motion`);
    }
    assert.deepEqual(errors, [], experience.id);
  } finally { await page.close(); }
}

export async function verifyLongPage(page, experience) {
  const chapters = page.locator('[data-chapter]');
  assert.deepEqual(await chapters.evaluateAll(nodes => nodes.map(node => node.dataset.chapter)),
    ['hero', ...experience.chapters, 'closing']);
  const { width } = page.viewportSize();
  assert(await page.evaluate(() => document.documentElement.scrollHeight) >= (width >= 600 ? 3000 : 3300),
    `${experience.id} must be a substantial landing page, not a single screen`);
  for (const chapter of await chapters.all()) {
    await chapter.scrollIntoViewIfNeeded();
    await expect(chapter).toBeVisible();
    const canvas = chapter.locator('canvas[data-artwork]');
    if (await canvas.count()) {
      await canvas.scrollIntoViewIfNeeded();
      await expect(canvas).toHaveAttribute('data-art-state', 'ready');
    }
    await assertNoOverflow(page);
  }
  const exhibit = page.locator('[data-chapter="exhibit"]');
  const canvas = exhibit.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const zoom = page.getByRole('slider', { name: 'ビジュアルの拡大率', exact: true });
  if (width < 600) {
    const control = exhibit.locator('.mantine-Slider-root');
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2);
    // Mantine batches touch movement into an animation frame. Finish it before switching to keyboard input.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect.poll(async () => Number(await zoom.getAttribute('aria-valuenow'))).toBeGreaterThan(100);
    await expect.poll(async () => Number(await zoom.getAttribute('aria-valuenow'))).toBeLessThan(175);
  }
  await zoom.focus(); await page.keyboard.press('Home');
  await expect(zoom).toHaveAttribute('aria-valuenow', '100');
  const normal = await canvas.screenshot();
  await zoom.focus(); await page.keyboard.press('End');
  await expect(zoom).toHaveAttribute('aria-valuenow', '175');
  assert.notDeepEqual(await canvas.screenshot(), normal, `${experience.id} zoom must change the actual artwork`);
}

export async function verifyCelebration(browser, origin, { experience = experiences[0], viewport = { width: 390, height: 844 },
  reducedMotion = 'reduce', screenshot, interact = true } = {}) {
  const touch = viewport.width < 600;
  const page = await browser.newPage({ viewport, reducedMotion, hasTouch: touch });
  const errors = await observePage(page, origin);
  await page.addInitScript(() => {
    window.__readyMessages = [];
    window.addEventListener('message', event => { if (event.data?.type === 'celebration:ready') window.__readyMessages.push(event.data); });
  });
  try {
    const response = await page.goto(`${origin}/experiences/${experience.id}/?${celebrationSearch(celebration)}`, { waitUntil: 'load' });
    assert.equal(response.status(), 200, experience.id);
    assert.equal(response.headers()['cache-control'], 'no-cache');
    assert.match(response.headers()['content-security-policy'], /frame-src 'none'/);
    await page.waitForSelector(`html[data-state="ready"][data-experience-id="${experience.id}"]`);
    await page.getByRole('heading', { level: 1, name: celebrationCopy(celebration).title, exact: true }).waitFor();
    await page.getByRole('heading', { level: 2, name: achievementLabel(celebration.achievement), exact: true }).waitFor();
    assert.equal(await page.locator('time').first().getAttribute('datetime'), celebration.date);
    assert.match(await page.locator('time').first().innerText(), /2026年8月13日/);
    assert.equal(await page.getByTitle(celebration.source, { exact: true }).count(), 1);
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    assert.equal(await page.locator('iframe, nav, a, audio, video, form, input[type="email"]').count(), 0);
    assert.doesNotMatch(await page.locator('main').innerText(), /your achievement|your goal|dueCardsRemaining|pre-?order|shop|contact|100%|軌跡|あなたの光|あなたへの拍手|合格確実/iu);
    await page.waitForFunction(() => window.__readyMessages.length === 1);
    assert.deepEqual(await page.evaluate(() => window.__readyMessages[0]), { type: 'celebration:ready', experienceId: experience.id, celebration });
    const artwork = page.locator('canvas[data-artwork]').first();
    assert.equal(await page.locator('canvas[data-artwork]').count(), 3);
    await artwork.scrollIntoViewIfNeeded();
    await page.waitForSelector('canvas[data-art-state="ready"]', { timeout: 30_000 });
    if (reducedMotion === 'reduce') {
      assert.equal(await artwork.getAttribute('data-motion'), 'static');
      assert.equal(await page.getByRole('button', { name: /動きを一時停止|動きを再開/ }).count(), 0);
      const before = await artwork.screenshot(); await page.waitForTimeout(150);
      assert.deepEqual(await artwork.screenshot(), before, `Reduced motion changed: ${experience.id}`);
    }
    await assertNoOverflow(page);
    if (interact) await interactWithExperience(page, experience, touch);
    await verifyLongPage(page, experience);
    await assertNoOverflow(page);
    if (screenshot) await page.screenshot({ path: screenshot, fullPage: true });
    assert.deepEqual(errors, [], experience.id);
  } finally { await page.close(); }
}
