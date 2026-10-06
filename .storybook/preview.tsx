import type { Preview } from '@storybook/react-vite';
import { useLayoutEffect, useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, TooltipProvider, ToastProvider } from '../src/ui';
import { LocaleProvider, useLocale } from '../src/i18n/LocaleProvider';
import { StoreProvider } from '../src/data/store';
import { TourProvider } from '../src/components/DemoTour';
import { storyState } from '../src/stories/fixtures';
import '../src/styles/app.css';
import './storybook.css';

function Appearance({ theme, locale, children }: { theme: string; locale: 'en' | 'km'; children: ReactNode }) {
  const { setLocale } = useLocale();
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    document.documentElement.classList.add('an-workspace-theme');
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setLocale(locale);
    setReady(true);
  }, [theme, locale, setLocale]);
  return ready ? children : null;
}
const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: { theme: 'light', locale: 'en' },
  globalTypes: {
    theme: { description: 'Anumat theme', toolbar: { icon: 'circlehollow', dynamicTitle: true, items: ['light', 'dark'] } },
    locale: { description: 'Interface language', toolbar: { icon: 'globe', dynamicTitle: true, items: [{ value: 'en', title: 'English' }, { value: 'km', title: 'ខ្មែរ' }] } },
  },
  parameters: {
    layout: 'padded',
    controls: { expanded: true, matchers: { color: /(background|color)$/i, date: /Date$/ } },
    options: { storySort: { order: ['Welcome', 'Foundations', 'Components', 'Patterns', 'Apps'] } },
    a11y: { test: 'todo' },
    docs: { toc: true },
  },
  decorators: [(Story, context) => {
    const key = `${context.id}-${context.globals.locale}-${context.parameters.role ?? 'admin'}`;
    return <ThemeProvider><LocaleProvider><Appearance key={`${context.globals.theme}-${context.globals.locale}`} theme={context.globals.theme} locale={context.globals.locale}>
      <MemoryRouter key={key} initialEntries={[context.parameters.route ?? '/tasks']}>
        <StoreProvider initialState={storyState(context.parameters.role, context.parameters.empty, context.parameters.hr, context.parameters.recruitmentDemo)} persist={false}>
          <TooltipProvider><ToastProvider><TourProvider><Story /></TourProvider></ToastProvider></TooltipProvider>
        </StoreProvider>
      </MemoryRouter>
    </Appearance></LocaleProvider></ThemeProvider>;
  }],
};
export default preview;
