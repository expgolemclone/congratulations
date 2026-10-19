import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium, webkit } from 'playwright';
import { expect } from 'playwright/test';
import { expectCanvasAnimation, expectCanvasStill } from '../helpers/graphics-checks.mjs';

for (const engine of [chromium, webkit]) {
  test(`${engine.name()} motion verification waits for presented pixels, not a fixed delay`, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent('<canvas width="64" height="64"></canvas>');
      const canvas = page.locator('canvas');
      const before = await canvas.screenshot();
      await canvas.evaluate(node => {
        setTimeout(() => {
          const context = node.getContext('2d');
          context.fillStyle = 'red';
          context.fillRect(0, 0, node.width, node.height);
        }, 900);
      });
      await expectCanvasAnimation(canvas, before, 'delayed scene');
    } finally { await browser.close(); }
  });

  test(`${engine.name()} motion verification rejects repeated draws with unchanged pixels`, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent('<canvas width="64" height="64"></canvas>');
      const canvas = page.locator('canvas');
      await canvas.evaluate(node => {
        const context = node.getContext('2d');
        const draw = () => {
          context.fillStyle = 'red';
          context.fillRect(0, 0, node.width, node.height);
          node.__draws = (node.__draws || 0) + 1;
          requestAnimationFrame(draw);
        };
        draw();
      });
      const before = await canvas.screenshot();
      await assert.rejects(expectCanvasAnimation(canvas, before, 'frozen scene'), /frozen scene must keep its native animation/);
      assert(await canvas.evaluate(node => node.__draws) > 1);
    } finally { await browser.close(); }
  });

  test(`${engine.name()} static verification waits for finite layout transitions without changing them`, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1024, height: 768 } });
      await page.setContent(`<style>
        body { margin: 0; }
        header { position: fixed; top: 0; left: 0; width: 32px; height: 32px; background: blue;
          transform: translateX(0); transition: transform 900ms linear; }
        @media (max-width: 900px) { header { transform: translateX(96px); } }
      </style><canvas width="128" height="128"></canvas><header></header>`);
      await page.locator('header').boundingBox();
      await page.setViewportSize({ width: 820, height: 700 });
      await expectCanvasStill(page.locator('canvas'), 'resized static scene');
      assert.equal(await page.locator('header').evaluate(node => getComputedStyle(node).transitionDuration), '0.9s');
    } finally { await browser.close(); }
  });

  test(`${engine.name()} static verification rejects continuously changing presented pixels`, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ reducedMotion: 'reduce' });
      await page.setContent('<canvas width="64" height="64"></canvas>');
      const canvas = page.locator('canvas');
      await canvas.evaluate(node => {
        const context = node.getContext('2d');
        let frame = 0;
        const draw = () => {
          context.fillStyle = `rgb(${++frame % 256}, 0, 0)`;
          context.fillRect(0, 0, node.width, node.height);
          requestAnimationFrame(draw);
        };
        draw();
      });
      await assert.rejects(expectCanvasStill(canvas, 'moving scene'), /moving scene must not animate in reduced motion/);
    } finally { await browser.close(); }
  });

  test(`${engine.name()} screenshots retain presented WebGL pixels after drawing-buffer resize`, async () => {
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 664 } });
      await page.setContent('<body style="margin:0"><canvas width="390" height="664"></canvas></body>');
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas'), gl = canvas.getContext('webgl');
        if (!gl) throw Error('WebGL context required');
        addEventListener('resize', () => {
          canvas.width = innerWidth; canvas.height = innerHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
        });
        const draw = () => {
          gl.clearColor(1, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
          requestAnimationFrame(draw);
        };
        draw();
      });
      const presentedPixel = async () => page.evaluate(async base64 => {
        const image = new Image(); image.src = 'data:image/png;base64,' + base64;
        await image.decode();
        const sample = document.createElement('canvas'); sample.width = image.width; sample.height = image.height;
        const context = sample.getContext('2d'); context.drawImage(image, 0, 0);
        return [...context.getImageData(image.width >> 1, image.height >> 1, 1, 1).data];
      }, (await page.screenshot()).toString('base64'));
      await expect.poll(presentedPixel, { message: 'Initial WebGL pixels must be presented' }).toEqual([255, 0, 0, 255]);
      for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 700 }]) {
        await page.setViewportSize(viewport);
        await expect.poll(() => page.locator('canvas').evaluate(node => [node.width, node.height])).toEqual([viewport.width, viewport.height]);
        // Playwright #42885: live GPU output alone cannot prove that resized pixels are visible.
        await expect.poll(presentedPixel, { message: 'Resized WebGL pixels must still be presented' }).toEqual([255, 0, 0, 255]);
      }
    } finally { await browser.close(); }
  });
}
