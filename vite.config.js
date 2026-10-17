import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { appendFile, copyFile, mkdir, readFile } from 'node:fs/promises';
import { experiences } from './src/achievement/experiences.mjs';

export default defineConfig({
  base: '/',
  plugins: [react(), {
    name: 'celebration-pages',
    async closeBundle() {
      const dist = new URL('./dist/', import.meta.url);
      for (const experience of experiences) {
        const directory = new URL(`experiences/${experience.id}/`, dist);
        await mkdir(directory, { recursive: true });
        await copyFile(new URL('index.html', dist), new URL('index.html', directory));
      }
      await appendFile(new URL('licenses.txt', dist), '\n' + await readFile(new URL('./src/achievement/artwork/LICENSE.txt', import.meta.url), 'utf8'));
    },
  }],
  build: { target: 'es2020', license: { fileName: 'licenses.txt' } },
  server: { host: '127.0.0.1', port: 4173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
