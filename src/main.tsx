import { ToastProvider, TooltipProvider } from '@repo/ui';
import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router';
import { App } from './App';
import { TourProvider } from './components/DemoTour';
import { StoreProvider } from './data/store';
import { LocaleProvider } from './i18n/LocaleProvider';
import './styles/app.css';

// GitHub Pages serves 404.html for deep links; it is a copy of index.html, so
// the router takes over from here with the real path. The single-page
// artifact build can't own its URL, so it keeps the route in memory.
const Router =
  import.meta.env.MODE === 'artifact'
    ? ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>
    : ({ children }: { children: ReactNode }) => <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>{children}</BrowserRouter>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <Router>
        <StoreProvider>
          <TooltipProvider>
            <ToastProvider>
              <TourProvider>
                <App />
              </TourProvider>
            </ToastProvider>
          </TooltipProvider>
        </StoreProvider>
      </Router>
    </LocaleProvider>
  </StrictMode>,
);
