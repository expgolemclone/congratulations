import assert from 'node:assert/strict';
import { expect } from 'playwright/test';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { celebration, observePage } from './experience-checks.mjs';

const canvases = {
  'aperture-lab': '.grain', 'driftline-ocean': '.wavefield', fathom: '#caustics',
  'formwork-chroma': '#chrome', 'formwork-contour': '#topo', 'formwork-heliodon': '#stage',
  'formwork-isometria': '#world', 'formwork-meridian': '#gauge', 'formwork-nebula': '#sky',
  'formwork-neon': '#grid', 'halcyon-ring': '#dusk', 'northbound-ev': '#terrain canvas', 'perigee-astro': '.sky',
};

export async function verifyGraphics(browser, origin) {
  for (const [id, selector] of Object.entries(canvases)) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      console.log(`Native graphics ${browser.browserType().name()} ${id} ${reducedMotion}`);
      const page = await browser.newPage({ reducedMotion, viewport: { width: 1024, height: 768 } });
      const errors = await observePage(page, origin);
      await page.addInitScript(() => {
        for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
          for (const name of ['drawArrays', 'drawElements']) {
            const native = prototype[name];
            prototype[name] = function (...args) { this.canvas.__draws = (this.canvas.__draws || 0) + 1; return native.apply(this, args); };
          }
        }
        for (const name of ['clearRect', 'putImageData', 'fillRect']) {
          const native = CanvasRenderingContext2D.prototype[name];
          CanvasRenderingContext2D.prototype[name] = function (...args) {
            this.canvas.__draws = (this.canvas.__draws || 0) + 1; return native.apply(this, args);
          };
        }
      });
      try {
        await page.goto(`${origin}/experiences/${id}/?${celebrationSearch(celebration)}`);
        await page.waitForSelector('html[data-state="ready"]');
        // These two upstream designs intentionally use CSS/SVG scenery in reduced motion.
        if (reducedMotion === 'reduce' && id === 'northbound-ev') {
          assert.equal(await page.locator('#terrain canvas').count(), 0);
          await expect(page.locator('#terrain')).toBeVisible();
        } else {
          const canvas = page.locator(reducedMotion === 'reduce' && id === 'perigee-astro' ? '#scope' : selector).first();
          await canvas.scrollIntoViewIfNeeded();
          await expect.poll(() => canvas.evaluate(node => node.__draws || 0)).toBeGreaterThan(0);
          await page.waitForTimeout(500);
          const before = await canvas.screenshot();
          await page.waitForTimeout(300);
          const after = await canvas.screenshot();
          if (reducedMotion === 'reduce') {
            assert.deepEqual(after, before, `${id} must not animate in reduced motion`);
            const size = await canvas.evaluate(node => ({ width: node.width, height: node.height, draws: node.__draws }));
            await page.setViewportSize({ width: 820, height: 700 });
            await page.waitForTimeout(300);
            const resized = await canvas.evaluate(node => ({ width: node.width, height: node.height, draws: node.__draws }));
            if (resized.width !== size.width || resized.height !== size.height) {
              assert(resized.draws > size.draws, `${id} must redraw its static scene after resize`);
            }
          } else assert.notDeepEqual(after, before, `${id} must keep its native animation`);
        }
        assert.deepEqual(errors, [], id);
      } finally { await page.close(); }
    }
  }
}
