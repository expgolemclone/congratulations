import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { experiences } from './src/achievement/experiences.mjs';

export default defineConfig({
  base: '/',
  plugins: [react(), {
    name: 'native-celebrations',
    async closeBundle() {
      const dist = new URL('./dist/', import.meta.url);
      await cp(new URL('./experiences/', import.meta.url), new URL('experiences/', dist), { recursive: true });
      const hashes = new Set();
      const entries = new Set(experiences.map(({ id }) => `${id}/index.html`));
      const snapshots = new URL('experiences/', dist);
      for (const path of (await readdir(snapshots, { recursive: true })).filter(path => path.endsWith('.html'))) {
        const entry = new URL(path.replaceAll('\\', '/'), snapshots);
        let html = await readFile(entry, 'utf8');
        const removals = [];
        const visit = node => {
          if (node.tagName === 'script') {
            const text = node.childNodes.map(child => child.value || '').join('');
            if (text.includes('announceCelebration')) {
              const { startOffset, endOffset } = node.sourceCodeLocation;
              removals.push([startOffset, endOffset]);
            } else if (text.trim()) {
              hashes.add(`'sha256-${createHash('sha256').update(text).digest('base64')}'`);
            }
          }
          for (const child of node.childNodes || []) visit(child);
        };
        visit(parse(html, { sourceCodeLocationInfo: true }));
        for (const [start, end] of removals.reverse()) html = html.slice(0, start) + html.slice(end);
        if (entries.has(path.replaceAll('\\', '/'))) {
          html = html.replace('</body>', '<script type="module" src="/shared/experience-runtime.js"></script>\n</body>');
        }
        await writeFile(entry, html);
      }
      const headers = await readFile(new URL('public/_headers', import.meta.url), 'utf8');
      await writeFile(new URL('_headers', dist), headers.replace("script-src 'self';", `script-src 'self' ${[...hashes].join(' ')};`));
    },
  }],
  build: {
    target: 'es2020', license: { fileName: 'licenses.txt' },
    rollupOptions: {
      input: { shell: fileURLToPath(new URL('./index.html', import.meta.url)),
        'experience-runtime': fileURLToPath(new URL('./src/achievement/experience-runtime.js', import.meta.url)) },
      output: { entryFileNames: chunk => chunk.name === 'experience-runtime' ? 'shared/experience-runtime.js' : 'assets/[name]-[hash].js' },
    },
  },
  server: { host: '127.0.0.1', port: 4173 },
  preview: { host: '127.0.0.1', port: 4173 },
});
