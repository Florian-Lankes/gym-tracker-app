import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function filesIn(root, entry) {
  const path = join(root, entry);
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const child of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const childEntry = join(entry, child.name);
    if (child.isDirectory()) files.push(...await filesIn(root, childEntry));
    else if (child.isFile()) files.push(childEntry);
  }
  return files;
}

export async function contentRevision(root, entries) {
  const files = [];
  for (const entry of entries) {
    const path = join(root, entry);
    const directoryEntries = await readdir(path, { withFileTypes: true }).catch(() => null);
    files.push(...(directoryEntries ? await filesIn(root, entry) : [entry]));
  }
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    hash.update(relative(root, join(root, file)));
    hash.update('\0');
    hash.update(await readFile(join(root, file)));
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 16);
}

export function renderServiceWorker(template, revision) {
  return template.replaceAll('__REVISION__', revision);
}
