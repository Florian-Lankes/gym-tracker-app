const supportedThemes = new Set(['system', 'light', 'dark']);

export function normalizeTheme(value) {
  return supportedThemes.has(value) ? value : 'system';
}

export function resolveTheme(preference, systemPrefersDark) {
  const theme = normalizeTheme(preference);
  return theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
}
