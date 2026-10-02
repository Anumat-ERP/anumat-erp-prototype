import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import {
  ModalFooterActions,
  overlayClasses,
  useOpenState,
  useReturnFocus,
  type ModalFooterActionsProps,
} from './modal';
import { useLocale } from '../../i18n/LocaleProvider';

export interface DrawerProps extends ModalFooterActionsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  trigger?: ReactNode;
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  className?: string;
}

const WIDTH = { sm: 'sm:w-80', md: 'sm:w-[30rem]', lg: 'sm:w-[40rem]' } as const;

/** A side panel for a record or a secondary task (shadcn Sheet). Full width on phones. */
export function Drawer({
  open: controlled,
  onOpenChange,
  defaultOpen = false,
  trigger,
  title,
  hideTitle,
  description,
  side = 'right',
  size = 'md',
  children,
  className,
  ...actions
}: DrawerProps) {
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
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'an-sheet fixed inset-y-0 z-50 flex w-full max-w-full flex-col border-border bg-popover text-popover-foreground shadow-lg outline-none',
            side === 'right' ? 'end-0 border-s' : 'start-0 border-e',
            WIDTH[size],
            className,
          )}
          data-side={side}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <Dialog.Title className={hideTitle ? 'sr-only' : 'text-lg leading-snug font-semibold'}>
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={tr('Close')}
                className="-me-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {description ? (
              <Dialog.Description className="mb-4 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            ) : null}
            {children}
          </div>
          {hasFooter ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
              <ModalFooterActions {...actions} />
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
