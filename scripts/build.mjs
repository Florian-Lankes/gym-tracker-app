import { cp, mkdir, rm } from 'node:fs/promises';
const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of ['index.html', 'manifest.webmanifest', 'sw.js', 'src', 'icons']) await cp(new URL(`../${entry}`, import.meta.url), new URL(entry, out), { recursive: true });
console.log('Static PWA built in dist/');
