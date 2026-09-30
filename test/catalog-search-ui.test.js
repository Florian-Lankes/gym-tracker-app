import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appFile = () => readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const htmlFile = () => readFile(new URL('../index.html', import.meta.url), 'utf8');

test('keeps selected template rows above the search-first exercise library', async () => {
  const html = await htmlFile();
  const selectedRows = html.indexOf('id="template-exercises"');
  const library = html.indexOf('class="exercise-catalog"');

  assert.ok(selectedRows >= 0);
  assert.ok(library >= 0);
  assert.ok(selectedRows < library);
});

test('does not render catalog result buttons until a query or category is chosen', async () => {
  const app = await appFile();

  assert.match(app, /if\s*\(!query\.trim\(\)\s*&&\s*!category\)\s*\{[\s\S]*?Search or choose a category to browse the exercise library\.[\s\S]*?return;/);
});

test('keeps the 320px template exercise controls within their row', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /@media\s*\(max-width:\s*380px\)\s*\{[\s\S]*?\.template-exercise\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+72px\s+102px;/s);
  assert.match(styles, /@media\s*\(max-width:\s*380px\)\s*\{[\s\S]*?\.template-exercise-actions\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*32px\);/s);
});
