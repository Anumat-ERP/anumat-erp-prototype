import { Alert, AlertTitle, Snackbar } from '@mui/material';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { Button } from './button';
export type ToastTone = 'default' | 'critical' | 'success';
export interface ToastAction {
  label: string;
  onAction: () => void;
  altText: string;
}
export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  action?: ToastAction;
  duration?: number;
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
export function ToastProvider({
  children,
  duration = 5000,
  withToaster = true,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const toast = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...options, id }]);
    return id;
  }, []);
  const dismiss = useCallback(
    (id?: string) =>
      setToasts((current) => (id ? current.filter((t) => t.id !== id) : [])),
    [],
  );
  const current = toasts[0];
  return (
    <Context.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {withToaster && current ? (
        <Snackbar
          key={current.id}
          open
          autoHideDuration={current.duration ?? duration}
          onClose={(_, reason) => {
            if (reason !== 'clickaway') dismiss(current.id);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            variant="filled"
            severity={
              current.tone === 'critical'
                ? 'error'
                : current.tone === 'success'
                ? 'success'
                : 'info'
            }
            onClose={() => dismiss(current.id)}
            action={
              current.action ? (
                <Button
                  variant="tertiary"
                  title={current.action.altText}
                  onClick={() => {
                    current.action?.onAction();
                    dismiss(current.id);
                  }}
                >
                  {current.action.label}
                </Button>
              ) : undefined
            }
          >
            <AlertTitle>{current.title}</AlertTitle>
            {current.description}
          </Alert>
        </Snackbar>
      ) : null}
    </Context.Provider>
  );
}
