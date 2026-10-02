import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { createTranslator, isLocale, type Locale } from './locale';

const Context = createContext({
  locale: 'en' as Locale,
  setLocale: (_: Locale) => {},
  t: createTranslator('en'),
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('anumat-locale');
      return isLocale(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  const setLocale = useCallback((next: Locale) => {
    document.documentElement.lang = next;
    try { localStorage.setItem('anumat-locale', next); } catch { /* Preference still applies for this visit. */ }
    setLocaleState(next);
  }, []);
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem('anumat-locale', locale);
    } catch {
      /* Preference still applies for this visit. */
    }
  }, [locale]);
  const t = useMemo(() => createTranslator(locale), [locale]);
  return <Context.Provider value={{ locale, setLocale, t }}>{children}</Context.Provider>;
}

export const useLocale = () => useContext(Context);
