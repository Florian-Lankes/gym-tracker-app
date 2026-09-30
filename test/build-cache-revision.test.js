import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { contentRevision, renderServiceWorker } from '../scripts/build-utils.mjs';

test('content revision changes when a shipped source asset changes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'lift-log-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'app.js'), 'export const screen = "old";\n');

  const before = await contentRevision(root, ['app.js']);
  await writeFile(join(root, 'app.js'), 'export const screen = "current";\n');
  const after = await contentRevision(root, ['app.js']);

  assert.notEqual(after, before);
});

test('generated service worker uses its content revision and precaches migration code', () => {
  const serviceWorker = renderServiceWorker("const CACHE = 'lift-log-__REVISION__';\nconst ASSETS = ['./src/exercise-migration.js'];\n", 'abc123');

  assert.match(serviceWorker, /lift-log-abc123/);
  assert.match(serviceWorker, /\.\/src\/exercise-migration\.js/);
  assert.doesNotMatch(serviceWorker, /__REVISION__/);
});
