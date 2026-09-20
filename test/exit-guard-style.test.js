import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('keeps hidden workout exit guards out of the layout despite the guard display rule', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.guard\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/);
});
