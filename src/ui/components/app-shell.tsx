import { Drawer as MuiDrawer } from '@mui/material';
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
  navigationOpen?: boolean;
  onNavigationOpenChange?: (open: boolean) => void;
  mainClassName?: string;
}
export function AppShell({ topBar, sidebarHeader, sidebarFooter, navigation, children,
  mainId = 'main-content', skipLinkLabel = 'Skip to content', navigationLabel = 'Navigation',
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
          {navigation ? <IconButton icon={<Menu />} label="Open navigation" className="md:hidden" aria-expanded={open} onClick={() => setOpen(true)} /> : null}
          <div className="an-mobile-account md:hidden">{sidebarFooter}</div>
          <div className="ms-auto flex items-center gap-1 sm:gap-2">{topBar}</div>
        </header>
        <main id={mainId} tabIndex={-1} className={cn('min-w-0 outline-none', mainClassName)}>{children}</main>
      </div>
      {navigation ? <MuiDrawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 296, maxWidth: '85vw' } } }}>
        <div className="an-drawer-content" aria-label={navigationLabel} onClick={(e) => {
          if ((e.target as HTMLElement).closest('a[href]')) setOpen(false);
        }}>
          <IconButton icon={<X />} label="Close navigation" className="an-drawer-close" onClick={() => setOpen(false)} />
          {sidebar}
        </div>
      </MuiDrawer> : null}
    </div>
  );
}
