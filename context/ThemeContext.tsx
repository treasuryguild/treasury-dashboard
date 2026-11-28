import React, { createContext, useContext, useEffect, useState } from 'react';

export type ResolvedTheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'treasury-theme';

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }

    const initialPref: ThemePreference =
      saved === 'light' || saved === 'dark' ? saved : 'system';
    const initialResolved: ResolvedTheme =
      initialPref === 'system' ? getSystemTheme() : initialPref;

    setThemeState(initialPref);
    setResolvedTheme(initialResolved);
    document.documentElement.setAttribute('data-theme', initialResolved);

    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      let currentSaved: string | null = null;
      try {
        currentSaved = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        currentSaved = null;
      }
      if (currentSaved !== 'light' && currentSaved !== 'dark') {
        const next: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(next);
        document.documentElement.setAttribute('data-theme', next);
      }
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handleSystemChange);
      return () => mq.removeEventListener('change', handleSystemChange);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(handleSystemChange);
      return () => mq.removeListener(handleSystemChange);
    }
  }, []);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    const resolved: ResolvedTheme = next === 'system' ? getSystemTheme() : next;
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    try {
      if (next === 'system') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // ignore storage errors
    }
  };

  const toggleTheme = () => {
    const next: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
