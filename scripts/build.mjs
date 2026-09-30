import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { contentRevision, renderServiceWorker } from './build-utils.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = new URL('../dist/', import.meta.url);
const entries = ['index.html', 'manifest.webmanifest', 'src', 'icons'];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of entries) await cp(new URL(`../${entry}`, import.meta.url), new URL(entry, out), { recursive: true });

const revision = await contentRevision(root, [...entries, 'sw.js']);
const serviceWorker = renderServiceWorker(await readFile(new URL('../sw.js', import.meta.url), 'utf8'), revision);
await writeFile(new URL('sw.js', out), serviceWorker);
console.log(`Static PWA built in dist/ (revision ${revision})`);
