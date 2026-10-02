import {
  CssBaseline,
  StyledEngineProvider,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { Check, Minus } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

/** Follow the existing account-menu preference, including portal surfaces. */
export function MaterialProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setMode(
        document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
      ),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  const theme = useMemo(
    () => {
      const styles = getComputedStyle(document.documentElement);
      const token = (name: string) => styles.getPropertyValue(name).trim();
      return createTheme({
        palette: {
          mode,
          primary: {
            main: token('--a-color-primary'),
            contrastText: token('--a-color-primary-fg'),
          },
          secondary: { main: token('--an-accent') },
          background: {
            default: token('--a-color-bg'),
            paper: token('--a-color-surface'),
          },
          text: {
            primary: token('--a-color-fg'),
            secondary: token('--a-color-fg-muted'),
          },
          divider: token('--a-color-border'),
          error: { main: token('--an-color-error') },
          success: { main: token('--an-color-success') },
          warning: { main: token('--an-accent') },
        },
        typography: {
          fontFamily:
            '"Inter Variable", Inter, "Kantumruy Pro", Battambang, "Noto Sans Khmer", system-ui, sans-serif',
          fontSize: 16,
          button: { textTransform: 'none', fontWeight: 600, lineHeight: 1.75 },
          h4: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.4 },
          h5: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
          h6: { fontFamily: '"Plus Jakarta Sans", "Kantumruy Pro", Battambang, "Noto Sans Khmer", sans-serif', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
          body1: { fontSize: '1rem', lineHeight: 1.75 },
          body2: { fontSize: '0.875rem', lineHeight: 1.75 },
          caption: { fontSize: '0.75rem', lineHeight: 1.75 },
        },
        breakpoints: {
          values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 },
        },
        shape: { borderRadius: 10 },
        components: {
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
              root: { minHeight: 'var(--an-control-height)', gap: 8, paddingInline: 20, borderRadius: 'var(--an-radius-pill)' },
              contained: ({ ownerState }) => ownerState.color === 'primary' ? { '&:hover': { backgroundColor: 'var(--a-color-primary-hover)' }, '&:active': { backgroundColor: 'var(--a-color-primary-active)' } } : {},
              outlined: { color: 'var(--a-color-fg)', borderColor: 'var(--a-color-border-input)', '&:hover': { borderColor: 'var(--a-color-border-strong)', backgroundColor: 'var(--a-color-surface-hover)' } },
              startIcon: { marginRight: 0 },
              endIcon: { marginLeft: 0 },
            },
          },
          MuiIconButton: { styleOverrides: { root: { borderRadius: 999 } } },
          MuiInputBase: {
            styleOverrides: { input: { '&::placeholder': { color: 'var(--a-color-fg-muted)', opacity: 1 } } },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: { backgroundColor: 'var(--a-color-surface)', borderRadius: 'var(--an-radius-field)' },
              notchedOutline: { borderColor: 'var(--a-color-border-input)' },
              input: { padding: '11px 14px' },
            },
          },
          MuiCard: {
            defaultProps: { variant: 'outlined' },
            styleOverrides: { root: { borderRadius: 'var(--an-radius-panel)', border: 0, boxShadow: 'none' } },
          },
          MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
          MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
          MuiTab: {
            styleOverrides: {
              root: { minHeight: 44, textTransform: 'none', fontWeight: 600 },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: { fontSize: '0.875rem', lineHeight: 1.75 },
              head: {
                fontWeight: 600,
                backgroundColor: 'var(--a-color-surface-muted)',
              },
            },
          },
          MuiCheckbox: { defaultProps: { icon: <span className="an-checkbox-icon" aria-hidden />, checkedIcon: <span className="an-checkbox-icon" data-checked aria-hidden><Check size={16} strokeWidth={3} /></span>, indeterminateIcon: <span className="an-checkbox-icon" data-checked aria-hidden><Minus size={16} strokeWidth={3} /></span> } },
          MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
          MuiMenuItem: {
            styleOverrides: { root: { minHeight: 44, fontSize: '0.875rem' } },
          },
          MuiCssBaseline: {
            styleOverrides: {
              body: { fontSize: '1rem' },
              'button:focus-visible, a:focus-visible': {
                outline: '2px solid var(--a-color-ring)',
                outlineOffset: 2,
              },
              '@media (prefers-reduced-motion: reduce)': {
                '*, *::before, *::after': {
                  transitionDuration: '0.01ms !important',
                  animationDuration: '0.01ms !important',
                },
              },
            },
          },
        },
      });
    },
    [mode],
  );
  return (
    <StyledEngineProvider injectFirst enableCssLayer>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
