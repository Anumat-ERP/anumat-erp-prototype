import { ToastProvider, TooltipProvider } from '@repo/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { StoreProvider } from './data/store';
import './styles/app.css';

// GitHub Pages serves 404.html for deep links; it is a copy of index.html, so
// the router takes over from here with the real path.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <StoreProvider>
        <TooltipProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </TooltipProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
