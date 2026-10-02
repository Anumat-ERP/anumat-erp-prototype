import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { useLocale } from '../../i18n/LocaleProvider';

export interface ModalAction {
  content: string;
  onAction?: () => void;
  loading?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}
export interface ModalFooterActionsProps {
  primaryAction?: ModalAction;
  secondaryActions?: ModalAction[];
  footer?: ReactNode;
}
export interface ModalProps extends ModalFooterActionsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  trigger?: ReactNode;
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: ReactNode;
  className?: string;
}

export function ModalFooterActions({
  primaryAction,
  secondaryActions,
  footer,
}: ModalFooterActionsProps) {
  return (
    <>
      {footer}
      {secondaryActions?.map((action) => (
        <Button
          key={action.content}
          onClick={action.onAction}
          disabled={action.disabled}
          loading={action.loading}
          variant={action.destructive ? 'critical' : 'secondary'}
        >
          {action.content}
        </Button>
      ))}
      {primaryAction ? (
        <Button
          onClick={primaryAction.onAction}
          disabled={primaryAction.disabled}
          loading={primaryAction.loading}
          variant={primaryAction.destructive ? 'critical' : 'primary'}
        >
          {primaryAction.content}
        </Button>
      ) : null}
    </>
  );
}

/** Controlled-or-uncontrolled open state shared by Modal and Drawer. */
export function useOpenState(
  controlled: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const [local, setLocal] = useState(defaultOpen);
  const open = controlled ?? local;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  return [open, setOpen] as const;
}

/**
 * Radix returns focus to its own Trigger. Dialogs opened from code (no
 * trigger) remember what had focus when they opened and go back to it.
 */
export function useReturnFocus(hasTrigger: boolean) {
  const opener = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    onCloseAutoFocus: (event: Event) => {
      if (hasTrigger) return;
      event.preventDefault();
      opener.current?.focus();
    },
  };
}

export const overlayClasses =
  'an-overlay fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[1px] data-[state=open]:animate-[an-fade-in_var(--a-duration-fast)_ease-out]';

const WIDTH = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' } as const;

/**
 * A focused task over the page (shadcn Dialog). Escape and the close button
 * dismiss it; focus returns to whatever opened it.
 */
export function Modal({
  open: controlled,
  onOpenChange,
  defaultOpen = false,
  trigger,
  title,
  hideTitle,
  description,
  size = 'md',
  children,
  className,
  ...actions
}: ModalProps) {
  const { t: tr } = useLocale();
  const [open, setOpen] = useOpenState(controlled, defaultOpen, onOpenChange);
  const returnFocus = useReturnFocus(Boolean(trigger));
  const hasFooter =
    actions.footer || actions.primaryAction || actions.secondaryActions?.length;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClasses} />
        <Dialog.Content
          {...returnFocus}
          className={cn(
            'an-pop fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none',
            WIDTH[size],
            className,
          )}
          // Without a description, opt out explicitly so Radix doesn't point at a missing element.
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
            <Dialog.Title className={hideTitle ? 'sr-only' : 'text-lg leading-snug font-semibold'}>
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={tr('Close')}
                className="-me-2 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
            {description ? (
              <Dialog.Description className="mb-4 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            ) : null}
            {children}
          </div>
          {hasFooter ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
              <ModalFooterActions {...actions} />
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
