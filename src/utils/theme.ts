import type { ThemeMode } from '../domain';

const STORAGE_KEY = 'workout-diary-theme';

export function readStoredTheme(): ThemeMode {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}
