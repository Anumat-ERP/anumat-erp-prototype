import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Toaster, toast as sonner } from 'sonner';

export type ToastTone = 'default' | 'critical' | 'success';
export interface ToastAction {
  label: string;
  onAction: () => void;
  /** What the action does, for people who can't see the toast in time. */
  altText: string;
}
export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  action?: ToastAction;
  duration?: number;
  /** Informational confirmations can allow clicks through to the page beneath. */
  interactive?: boolean;
}
interface ToastRecord extends ToastOptions {
  id: string;
}
interface ToastContextValue {
  toasts: ToastRecord[];
  toast: (options: ToastOptions) => string;
  dismiss: (id?: string) => void;
}

const Context = createContext<ToastContextValue | null>(null);
const MUTED_TEXT = 'text-muted-foreground';

export function useToast() {
  const c = useContext(Context);
  if (!c) throw new Error('useToast requires ToastProvider');
  return c;
}

export interface ToastProviderProps {
  children?: ReactNode;
  duration?: number;
  label?: string;
  withToaster?: boolean;
}

/** Follow the app's data-theme so toasts match light and dark. */
function useDocumentTheme() {
  const read = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [theme, setTheme] = useState<'light' | 'dark'>(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/** Brief confirmations of what just happened (sonner). Announced politely; errors assertively. */
export function ToastProvider({
  children,
  duration = 5000,
  label = 'Notifications',
  withToaster = true,
}: ToastProviderProps) {
  const theme = useDocumentTheme();
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const dismiss = useCallback((id?: string) => {
    sonner.dismiss(id);
    setToasts((current) => (id ? current.filter((t) => t.id !== id) : []));
  }, []);
  const toast = useCallback(
    (options: ToastOptions) => {
      const id = crypto.randomUUID();
      const show =
        options.tone === 'critical' ? sonner.error : options.tone === 'success' ? sonner.success : sonner;
      show(options.title, {
        id,
        description: options.description,
        duration: options.duration ?? duration,
        style: options.interactive === false && !options.action ? { pointerEvents: 'none' } : undefined,
        action: options.action
          ? { label: options.action.label, onClick: () => options.action?.onAction() }
          : undefined,
        onDismiss: () => setToasts((current) => current.filter((t) => t.id !== id)),
        onAutoClose: () => setToasts((current) => current.filter((t) => t.id !== id)),
      });
      setToasts((current) => [...current, { ...options, id }]);
      return id;
    },
    [duration],
  );
  return (
    <Context.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {withToaster ? (
        <Toaster
          theme={theme}
          position="bottom-center"
          containerAriaLabel={label}
          toastOptions={{
            classNames: {
              toast: 'rounded-lg border border-border bg-popover text-popover-foreground shadow-lg font-sans',
              description: MUTED_TEXT,
              actionButton: 'bg-primary text-primary-foreground',
            },
          }}
        />
      ) : null}
    </Context.Provider>
  );
}
