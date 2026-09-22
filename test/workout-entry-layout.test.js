import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const stylesFile = () => readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('gives current-workout number inputs room at normal iPhone widths', async () => {
  const styles = await stylesFile();

  assert.match(styles, /\.set-row\s*\{[^}]*grid-template-columns:\s*46px\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\);/s);
  assert.match(styles, /\.numeric-control\s*\{[^}]*grid-template-columns:\s*36px\s+minmax\(0,\s*1fr\)\s+36px;/s);
  assert.match(styles, /\.set-row input\s*\{[^}]*padding:\s*8px\s+4px;/s);
});

test('keeps the 320px fallback as a one-row layout', async () => {
  const styles = await stylesFile();

  assert.match(styles, /@media\s*\(max-width:\s*380px\)\s*\{[\s\S]*?\.set-row\s*\{[^}]*grid-template-columns:\s*42px\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\);/s);
  assert.match(styles, /@media\s*\(max-width:\s*380px\)\s*\{[\s\S]*?\.numeric-control\s*\{[^}]*grid-template-columns:\s*30px\s+minmax\(0,\s*1fr\)\s+30px;/s);
});
