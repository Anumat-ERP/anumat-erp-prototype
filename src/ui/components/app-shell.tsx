import { Menu, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconButton } from './button';
import { SidebarExpanded, SidebarTrigger, useSidebar } from './sidebar';

export interface AppShellProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Utilities at the end of the top bar (search, language, help, notifications). */
  topBar?: ReactNode;
  /** Where you are, at the start of the top bar. */
  breadcrumb?: ReactNode;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  navigation?: ReactNode;
  children?: ReactNode;
  mainId?: string;
  skipLinkLabel?: string;
  navigationLabel?: string;
  openNavigationLabel?: string;
  closeNavigationLabel?: string;
  toggleSidebarLabel?: string;
  navigationOpen?: boolean;
  onNavigationOpenChange?: (open: boolean) => void;
  mainClassName?: string;
}

/**
 * The workspace frame (shadcn sidebar layout): a sidebar that collapses to an
 * icon rail on desktop and becomes a sheet on phones, a sticky top bar, and
 * the page. Wrap it in SidebarProvider to control collapse from outside.
 */
export function AppShell({
  topBar,
  breadcrumb,
  sidebarHeader,
  sidebarFooter,
  navigation,
  children,
  mainId = 'main-content',
  skipLinkLabel = 'Skip to content',
  navigationLabel = 'Navigation',
  openNavigationLabel = 'Open navigation',
  closeNavigationLabel = 'Close navigation',
  toggleSidebarLabel = 'Toggle sidebar',
  navigationOpen,
  onNavigationOpenChange,
  mainClassName,
  className,
  ...props
}: AppShellProps) {
  const sidebar = useSidebar();
  const open = navigationOpen ?? sidebar.mobileOpen;
  const setOpen = (next: boolean) => {
    sidebar.setMobileOpen(next);
    onNavigationOpenChange?.(next);
  };
  const { collapsed } = sidebar;
  return (
    <div className={cn('an-shell flex min-h-dvh bg-background text-foreground', className)} {...props}>
      <a
        href={`#${mainId}`}
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[1500] focus:rounded-md focus:bg-card focus:p-3 focus:shadow-md"
      >
        {skipLinkLabel}
      </a>
      {navigation ? (
        <aside
          aria-label={navigationLabel}
          data-collapsed={collapsed || undefined}
          className={cn(
            'an-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-sidebar-border bg-sidebar md:flex',
            'transition-[width] duration-(--a-duration-base) ease-standard',
            collapsed ? 'w-[3.75rem]' : 'w-64',
          )}
        >
          <div className="an-sidebar-header px-3 pt-4 pb-2">{sidebarHeader}</div>
          <div className="an-sidebar-nav min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">{navigation}</div>
          <div className="an-sidebar-footer border-t border-sidebar-border p-2">{sidebarFooter}</div>
        </aside>
      ) : null}
      <div className="an-content flex min-w-0 flex-1 flex-col">
        <header className="an-utilities sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4 md:px-6">
          {navigation ? (
            <>
              <IconButton
                icon={<Menu />}
                label={openNavigationLabel}
                size="sm"
                className="md:hidden"
                aria-expanded={open}
                onClick={() => setOpen(true)}
              />
              <SidebarTrigger label={toggleSidebarLabel} className="hidden md:inline-flex" />
              <span aria-hidden className="hidden h-4 w-px bg-border md:block" />
            </>
          ) : null}
          <div className="an-mobile-account md:hidden">{sidebarFooter}</div>
          <div className="hidden min-w-0 flex-1 sm:block">{breadcrumb}</div>
          <div className="ms-auto flex items-center gap-1 sm:gap-1.5">{topBar}</div>
        </header>
        <main
          id={mainId}
          tabIndex={-1}
          className={cn('an-main min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 md:px-8 md:py-8', mainClassName)}
        >
          {children}
        </main>
      </div>
      {navigation ? (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="an-overlay fixed inset-0 z-50 bg-foreground/40 md:hidden" />
            <Dialog.Content
              aria-describedby={undefined}
              data-side="left"
              className="an-sheet fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col border-e border-sidebar-border bg-sidebar outline-none md:hidden"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a[href]')) setOpen(false);
              }}
            >
              <Dialog.Title className="sr-only">{navigationLabel}</Dialog.Title>
              <SidebarExpanded>
              <div className="flex items-start gap-2 px-3 pt-4 pb-2">
                <div className="min-w-0 flex-1">{sidebarHeader}</div>
                <IconButton icon={<X />} label={closeNavigationLabel} size="sm" onClick={() => setOpen(false)} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{navigation}</div>
              <div className="border-t border-sidebar-border p-2">{sidebarFooter}</div>
              </SidebarExpanded>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </div>
  );
}
