import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { experiences } from '../../src/achievement/experiences.mjs';
import { celebration, signatures } from '../helpers/experience-checks.mjs';
import { celebrationSearch } from '@expgolemclone/congratulations/celebration';
import { startStaticServer } from '../helpers/server-helper.mjs';

const server = await startStaticServer();
const browser = await chromium.launch({ headless: true });
try {
  for (const experience of experiences) {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    try {
      await page.goto(`${server.origin}/experiences/${experience.id}/?${celebrationSearch(celebration)}`);
      await page.waitForSelector('html[data-state="ready"]');
      for (const selector of signatures[experience.id]) assert(await page.locator(selector).count(), `${experience.id}: ${selector}`);
      assert.deepEqual(errors, [], experience.id);
      console.log(`Native smoke passed: ${experience.id}`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); await server.stop(); assert.equal(server.getStderr(), ''); }
