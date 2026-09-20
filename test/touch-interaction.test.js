import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('preserves pinch zoom while suppressing double-tap zoom on the app shell', async () => {
  const [html, styles] = await Promise.all([
    projectFile('index.html'),
    projectFile('src/styles.css'),
  ]);

  const viewport = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i)?.[1] ?? '';
  assert.doesNotMatch(viewport, /(?:maximum-scale|user-scalable)\s*=/i);
  assert.match(styles, /\.app-shell\s*\{[^}]*touch-action\s*:\s*manipulation\s*;/s);
});

test('does not install broad JavaScript touch suppression', async () => {
  const app = await projectFile('src/app.js');

  assert.doesNotMatch(app, /addEventListener\(\s*["']touch(?:start|move|end)["'][\s\S]{0,500}?preventDefault\s*\(/);
});
