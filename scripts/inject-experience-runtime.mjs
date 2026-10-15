import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../src/achievement/selection.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const marker = 'data-celebration-runtime';

export function injectExperienceRuntime(source, id) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new TypeError('Experience ID is invalid.');
  if (source.includes(marker) || source.includes('/shared/experience-runtime.js')) return source;
  const closingBody = source.lastIndexOf('</body>');
  if (closingBody === -1) throw Error(`${id} does not contain a closing body tag.`);
  const runtime = `<script type="module" ${marker}>\n` +
    '  import { announceCelebration } from "/shared/experience-runtime.js";\n' +
    `  announceCelebration(${JSON.stringify(id)});\n</script>\n`;
  return `${source.slice(0, closingBody)}${runtime}${source.slice(closingBody)}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = validateManifest(JSON.parse(await readFile(resolve(projectRoot, 'src/achievement/experiences.json'), 'utf8')));
  for (const experience of manifest.experiences) {
    const entryPath = resolve(projectRoot, experience.entry, 'index.html');
    const source = await readFile(entryPath, 'utf8');
    const updated = injectExperienceRuntime(source, experience.id);
    if (updated !== source) await writeFile(entryPath, updated, 'utf8');
  }
}
