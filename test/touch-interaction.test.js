import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('requests disabled page zoom while retaining scoped touch interaction styling', async () => {
  const [html, styles] = await Promise.all([
    projectFile('index.html'),
    projectFile('src/styles.css'),
  ]);

  const viewport = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i)?.[1] ?? '';
  assert.match(viewport, /(?:^|,)\s*maximum-scale\s*=\s*1\s*(?:,|$)/i);
  assert.match(viewport, /(?:^|,)\s*user-scalable\s*=\s*no\s*(?:,|$)/i);
  assert.match(styles, /\.app-shell\s*\{[^}]*touch-action\s*:\s*manipulation\s*;/s);
});

test('does not install broad JavaScript touch suppression', async () => {
  const app = await projectFile('src/app.js');

  assert.doesNotMatch(app, /addEventListener\(\s*["']touch(?:start|move|end)["'][\s\S]{0,500}?preventDefault\s*\(/);
});
