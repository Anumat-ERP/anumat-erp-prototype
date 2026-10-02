import { Dialog } from 'radix-ui';
import { Menu, X } from 'lucide-react';
import { useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';

export interface AppShellProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  topBar?: ReactNode;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  navigation?: ReactNode;
  children?: ReactNode;
  mainId?: string;
  skipLinkLabel?: string;
  navigationLabel?: string;
  openNavigationLabel?: string;
  closeNavigationLabel?: string;
  navigationOpen?: boolean;
  onNavigationOpenChange?: (open: boolean) => void;
  mainClassName?: string;
}
export function AppShell({ topBar, sidebarHeader, sidebarFooter, navigation, children,
  mainId = 'main-content', skipLinkLabel = 'Skip to content', navigationLabel = 'Navigation', openNavigationLabel = 'Open navigation', closeNavigationLabel = 'Close navigation',
  navigationOpen, onNavigationOpenChange, mainClassName, className, ...props }: AppShellProps) {
  const [local, setLocal] = useState(false);
  const open = navigationOpen ?? local;
  const setOpen = (next: boolean) => {
    if (navigationOpen === undefined) setLocal(next);
    onNavigationOpenChange?.(next);
  };
  const sidebar = <>
    <div className="an-sidebar-header">{sidebarHeader}</div>
    <div className="an-sidebar-nav">{navigation}</div>
    <div className="an-sidebar-footer">{sidebarFooter}</div>
  </>;
  return (
    <div className={cn('an-shell min-h-dvh bg-bg text-fg', className)} {...props}>
      <a href={`#${mainId}`} className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[1500] focus:bg-surface focus:p-3">{skipLinkLabel}</a>
      {navigation ? <aside className="an-sidebar" aria-label={navigationLabel}>{sidebar}</aside> : null}
      <div className="an-content">
        <header className="an-utilities">
          {navigation ? <IconButton icon={<Menu />} label={openNavigationLabel} className="md:hidden" aria-expanded={open} onClick={() => setOpen(true)} /> : null}
          <div className="an-mobile-account md:hidden">{sidebarFooter}</div>
          <div className="ms-auto flex items-center gap-1 sm:gap-2">{topBar}</div>
        </header>
        <main id={mainId} tabIndex={-1} className={cn('min-w-0 outline-none', mainClassName)}>{children}</main>
      </div>
      {navigation ? <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="an-overlay fixed inset-0 z-50 bg-foreground/40 md:hidden" />
          <Dialog.Content aria-describedby={undefined} data-side="left" className="an-sheet an-drawer-content fixed inset-y-0 start-0 z-50 flex w-74 max-w-[85vw] flex-col overflow-y-auto border-e border-sidebar-border bg-sidebar outline-none md:hidden" onClick={(e) => {
            if ((e.target as HTMLElement).closest('a[href]')) setOpen(false);
          }}>
            <Dialog.Title className="sr-only">{navigationLabel}</Dialog.Title>
            <IconButton icon={<X />} label={closeNavigationLabel} className="an-drawer-close" onClick={() => setOpen(false)} />
            {sidebar}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root> : null}
    </div>
  );
}
