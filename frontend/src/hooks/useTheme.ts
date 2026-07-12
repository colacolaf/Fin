/**
 * useTheme — applies the active theme to document.documentElement.dataset.theme
 * and listens to `prefers-color-scheme` only when `localStorage.fin.settings.theme === 'system'`.
 *
 * Phase 37 a11y baseline. Matches TopBar's existing `writeSetting('theme', ...)`
 * helper which writes to `fin.settings.*` (NOT the prompt's literal `fin.theme`
 * — that would drift from the established codebase).
 */
import { useCallback, useEffect, useState } from 'react';

type ThemeValue = 'system' | 'dark' | 'light';
type EffectiveTheme = 'dark' | 'light';

const STORAGE_KEY = 'fin.settings.theme';
const ATTR_KEY = 'theme';

function readEnabled(): ThemeValue {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ThemeValue | null;
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch {
    /* noop */
  }
  return 'system';
}

function setDocTheme(theme: EffectiveTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset[ATTR_KEY] = theme;
}

export interface UseThemeReturn {
  theme: ThemeValue;
  effectiveTheme: EffectiveTheme;
  setTheme: (v: ThemeValue) => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeValue>(readEnabled);

  // Compute effective theme: explicit choice or system matchMedia.
  const effectiveTheme: EffectiveTheme =
    theme === 'dark'
      ? 'dark'
      : theme === 'light'
        ? 'light'
        : typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';

  const setTheme = useCallback((v: ThemeValue) => {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* noop */
    }
    setThemeState(v);
  }, []);

  // Apply document theme on change.
  useEffect(() => {
    setDocTheme(effectiveTheme);
  }, [effectiveTheme]);

  // Listen to prefers-color-scheme only when on system.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => {
      setDocTheme(mql.matches ? 'dark' : 'light');
    };
    if ('addEventListener' in mql) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // Safari < 14 fallback
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [theme]);

  return { theme, effectiveTheme, setTheme };
}
