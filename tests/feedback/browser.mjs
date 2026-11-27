import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { CORRECT_FEEDBACK_VARIANTS } from '@expgolemclone/congratulations/feedback';
import { startStaticServer } from '../helpers/server-helper.mjs';

const fixture = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}body{margin:0;padding:12px}button{min-height:44px}</style>
<button id="play">Play</button><button id="stop">Stop</button><p id="status" role="status">Loading</p><div id="feedback" hidden></div>
<script type="module">import { createFeedbackPlayer } from '/__feedback/index.mjs';
window.player = createFeedbackPlayer(document.querySelector('#feedback'));
document.querySelector('#status').textContent='Ready';
document.querySelector('#play').onclick=async()=>{player.prepare();document.querySelector('#status').textContent='Playing';try{await player.play();document.querySelector('#status').textContent='Completed';}catch(error){window.feedbackError={code:error.code,name:error.name,cause:error.cause?.message,causeName:error.cause?.name,sources:window.audioStarts,support:['audio/wav','audio/mpeg'].map(t=>document.createElement('audio').canPlayType(t))};document.querySelector('#status').textContent=typeof error.code==='string'?error.code:error.name;}};
document.querySelector('#stop').onclick=()=>player.stop();</script>`;

const server = await startStaticServer();
try {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [bucket, variant] of [[111, CORRECT_FEEDBACK_VARIANTS[0]], [11, CORRECT_FEEDBACK_VARIANTS[1]],
      [1, CORRECT_FEEDBACK_VARIANTS[2]], [0, CORRECT_FEEDBACK_VARIANTS[3]]]) {
      const page = await browser.newPage({ viewport: { width: 320, height: 736 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/__feedback/**', async route => {
        const file = new URL(route.request().url()).pathname.slice('/__feedback/'.length);
        assert(!file.includes('..'));
        await route.fulfill({ contentType: file.endsWith('.mp3') ? 'audio/mpeg' : 'application/javascript',
          body: await readFile(new URL(`../../src/feedback/${file}`, import.meta.url)) });
      });
      await page.route('**/__feedback-test', route => route.fulfill({ contentType: 'text/html', body: fixture }));
      await page.addInitScript(({ bucket }) => {
        const native = Crypto.prototype.getRandomValues;
        Crypto.prototype.getRandomValues = function (array) {
          if (array instanceof Uint16Array && array.length === 1) { array[0] = bucket; return array; }
          return native.call(this, array);
        };
        window.audioStarts = [];
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          window.audioStarts.push(this.src);
          return play.call(this);
        };
      }, { bucket });
      await page.goto(`${server.origin}/__feedback-test`);
      await page.waitForFunction(() => document.querySelector('#status').textContent === 'Ready');
      await page.locator('#play').click();
      await page.locator('#feedback').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#feedback').getAttribute('data-rarity'), variant.id);
      assert.equal(await page.locator('.congratulations-feedback-message').innerText(), variant.displayText);
      assert.equal(await page.locator('#feedback').getAttribute('role'), 'status');
      assert.equal(await page.locator('#feedback').evaluate(el => getComputedStyle(el).animationName), 'none');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.waitForFunction(() => document.querySelector('#status').textContent !== 'Playing', null, { timeout: 15000 });
      assert.equal(await page.locator('#status').innerText(), 'Completed', JSON.stringify(await page.evaluate(() => window.feedbackError)));
      const sources = await page.evaluate(() => audioStarts);
      assert.equal(sources.length, 3);
      assert(sources[1].startsWith('blob:'));
      assert(sources[2].endsWith(new URL((await import('../../src/feedback/audio.mjs')).FEEDBACK_AUDIO_URLS[variant.id]).pathname.split('/').pop()));
      await page.locator('#play').click();
      await page.locator('#feedback').waitFor({ state: 'visible' });
      await page.locator('#stop').click();
      await page.waitForFunction(() => document.querySelector('#status').textContent === 'AbortError');
      assert.equal(await page.locator('#feedback').isVisible(), false);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('Shared feedback all tiers, 320px, reduced motion, cancellation and real audio passed: chromium');
  } finally { await browser.close(); }
} finally { await server.stop(); }
