import assert from 'node:assert/strict';
import { expect } from 'playwright/test';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';

export const celebration = { source: 'chushoks.kakomonn.com', date: '2026-08-13', achievement: 'daily-study-quota' };
export const signatures = {
  'aperture-lab': ['#compare', '#sliders input', '#histo', '#lookRow .look'],
  conche: ['#origins .origin', '#temper', '#bars', '#wheel'],
  'driftline-ocean': ['canvas.wavefield', '#tideChart', '#programs', '#donate'],
  fathom: ['#caustics', '#depths', '#exhibits', '#tickets'],
  'formwork-chroma': ['#chrome', '.strip', '.work-list', '.studio'],
  'formwork-contour': ['#topo', '.ledger', '#routes', '#kit'],
  'formwork-heliodon': ['#stage', '#object', '#studio', '.statement'],
  'formwork-isometria': ['#world', '#daynight', '#games', '#studio'],
  'formwork-meridian': ['#gauge', '#method', '#process', '#machines'],
  'formwork-nebula': ['#sky', '#atlas', '#instrument', '.statement'],
  'formwork-neon': ['#grid', '#releases', '#label', '.statement'],
  glyphica: ['#instrument input[type="range"]', '.waterfall', '#in-use', '#letters'],
  'halcyon-ring': ['#dusk', '#stars', '#score', '#ring'],
  halfstep: ['#build', '#configure', '#range', '#reviews'],
  'northbound-ev': ['#plan', '#network', '#stops', '.route-tab'],
  'perigee-astro': ['#scope', '#scopeHit', '#nodeGrid', '#obsGrid'],
};

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

export async function interact(page, id, touch) {
  const activate = async locator => {
    if (touch) await locator.tap(); else { await locator.focus(); await page.keyboard.press('Enter'); }
  };
  switch (id) {
    case 'aperture-lab': {
      const handle = page.locator('#handle');
      await handle.focus(); await page.keyboard.press('End');
      await expect(handle).toHaveAttribute('aria-valuenow', '100');
      const before = await page.locator('#panelImg').evaluate(node => getComputedStyle(node).filter);
      await activate(page.locator('#autoBtn'));
      await expect(page.locator('#s-exposure')).toHaveValue('10');
      await expect.poll(() => page.locator('#panelImg').evaluate(node => getComputedStyle(node).filter)).not.toBe(before);
      await activate(page.locator('#lookRow .look').nth(1));
      await expect(page.locator('#s-saturation')).toHaveValue('-90'); break;
    }
    case 'conche':
      await activate(page.locator('.origin').first());
      await expect(page.locator('.origin').first()).toHaveAttribute('aria-pressed', 'true');
      assert(await page.locator('#wheel .note.lit').count(), 'Native wheel must highlight its segments'); break;
    case 'driftline-ocean':
      await activate(page.locator('.ev-join').first());
      await expect(page.locator('.ev-join').first()).toHaveAttribute('aria-pressed', 'true'); break;
    case 'fathom':
      await activate(page.locator('.tier').nth(1));
      await expect(page.locator('.tier').nth(1)).toHaveAttribute('aria-pressed', 'true'); break;
    case 'formwork-isometria': {
      const island = page.locator('#world');
      const day = await island.screenshot();
      await activate(page.locator('#daynight'));
      await expect(page.locator('body')).toHaveClass(/night/);
      assert.notDeepEqual(await island.screenshot(), day, 'Day/night must relight the native scene');
      const before = await island.screenshot();
      await island.focus();
      for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
      assert.notDeepEqual(await island.screenshot(), before, 'Keyboard must rotate the actual island'); break;
    }
    case 'formwork-meridian':
      await page.locator('#tab-espresso').focus(); await page.keyboard.press('ArrowRight');
      await expect(page.locator('#tab-pourover')).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('.brew-img[data-method="pourover"]')).toHaveClass(/is-active/);
      await activate(page.locator('.step[data-step="4"]'));
      await expect(page.locator('.walk-img[data-step="4"]')).toHaveClass(/is-active/); break;
    case 'glyphica': {
      await activate(page.locator('.preset').first());
      await expect(page.locator('.preset').first()).toHaveAttribute('aria-pressed', 'true');
      const slider = page.locator('#ax-wght');
      await slider.focus(); await page.keyboard.press('End');
      await expect(slider).toHaveValue('900');
      assert.match(await page.locator('.spec-word').evaluate(node => node.style.fontVariationSettings), /900/); break;
    }
    case 'halfstep': {
      const bicycle = page.locator('.cfg-sum svg');
      await bicycle.scrollIntoViewIfNeeded();
      const before = await bicycle.screenshot();
      const paint = page.locator('input[name="paint"][value="moss"]');
      if (touch) await page.locator('label').filter({ has: paint }).tap();
      else { await paint.focus(); await page.keyboard.press('Space'); }
      await expect(page.locator('input[name="paint"][value="moss"]')).toBeChecked();
      assert.match(await page.locator('#sumName').innerText(), /Moss/i);
      await expect(page.locator('html')).toHaveAttribute('data-paint', 'moss');
      assert.notDeepEqual(await bicycle.screenshot(), before, 'Paint must change the native bicycle'); break;
    }
    case 'northbound-ev':
      await activate(page.locator('.route-tab[data-route="coastal"]'));
      await expect(page.locator('.route-tab[data-route="coastal"]')).toHaveAttribute('aria-selected', 'true'); break;
    case 'perigee-astro': {
      const canvas = page.locator('#scope');
      await canvas.scrollIntoViewIfNeeded();
      const before = await canvas.screenshot();
      await page.locator('#scopeHit').focus();
      for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      assert.notDeepEqual(await canvas.screenshot(), before, 'Native reticle must respond to keyboard'); break;
    }
    // These experiences are visual/scroll instruments, not generic buttons or sliders.
    default:
      await page.locator('main section').last().scrollIntoViewIfNeeded();
  }
}

export async function verifyExperience(browser, origin, experience, { viewport, screenshot, details = celebration } = {}) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 600, reducedMotion: 'reduce' });
  const errors = await observePage(page, origin);
  await page.addInitScript(() => {
    window.__ready = [];
    addEventListener('message', event => { if (event.data?.type === 'celebration:ready') window.__ready.push(event.data); });
  });
  try {
    const response = await page.goto(`${origin}/experiences/${experience.id}/?${celebrationSearch(details)}`);
    assert.equal(response.status(), 200);
    assert.equal(response.headers()['cache-control'], 'no-cache');
    await page.waitForSelector(`html[data-state="ready"][data-experience-id="${experience.id}"]`);
    await expect(page.locator('h1').first()).toBeVisible();
    for (const selector of signatures[experience.id]) assert(await page.locator(selector).count(), `${experience.id}: ${selector}`);
    await expect(page.locator('#celebration-record time')).toHaveAttribute('datetime', details.date);
    assert.equal(await page.getByTitle(details.source, { exact: true }).textContent(), details.source);
    assert.deepEqual(await page.evaluate(() => window.__ready), [{ type: 'celebration:ready', experienceId: experience.id, celebration: details }]);
    assert.equal(await page.locator('input[type="email"], input[type="password"]').count(), 0);
    assert.doesNotMatch(await page.locator('main').innerText(), /dueCardsRemaining/);
    await interact(page, experience.id, viewport.width < 600);
    for (const section of await page.locator('main section').all()) {
      await section.scrollIntoViewIfNeeded();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${experience.id} horizontal overflow`);
    }
    if (screenshot) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: screenshot, fullPage: true }); }
    assert.deepEqual(errors, [], experience.id);
  } finally { await page.close(); }
}
