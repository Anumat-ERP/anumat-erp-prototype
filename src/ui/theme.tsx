import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Mode = 'light' | 'dark';

const ThemeContext = createContext<Mode>('light');

const readMode = (): Mode =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

/**
 * Exposes the current light/dark mode. The mode itself lives on
 * `<html data-theme>` (set before first paint and by the account menu);
 * every colour comes from CSS variables, so portals follow it automatically.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(readMode);
  useEffect(() => {
    const observer = new MutationObserver(() => setMode(readMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return <ThemeContext.Provider value={mode}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

/** @deprecated Kept for older imports; use ThemeProvider. */
export const MaterialProvider = ThemeProvider;
