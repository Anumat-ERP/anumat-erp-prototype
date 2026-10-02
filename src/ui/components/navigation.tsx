'use client';

import type {
  ComponentPropsWithRef,
  MouseEventHandler,
  ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { Tooltip } from './tooltip';

/** Props handed to `renderLink`. Spread them onto your router’s link. */
export interface NavigationLinkProps {
  href: string;
  className: string;
  children: ReactNode;
  'aria-current'?: 'page';
  'aria-label'?: string;
  'data-collapsed'?: 'true';
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A nested destination under a top-level item. */
export interface NavigationSubItem {
  label: string;
  href: string;
  selected?: boolean;
  badge?: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A top-level destination. */
export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
  /** What the badge means, for assistive technology: “4 waiting on you”. */
  badgeLabel?: string;
  /** The current page: highlighted and `aria-current="page"`. Also reveals `subItems`. */
  selected?: boolean;
  disabled?: boolean;
  external?: boolean;
  subItems?: NavigationSubItem[];
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A group of items with an optional heading. */
export interface NavigationSection {
  title?: string;
  items: NavigationItem[];
  action?: ReactNode;
}

export interface NavigationProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  sections: NavigationSection[];
  renderLink?: (props: NavigationLinkProps) => ReactNode;
  'aria-label'?: string;
  /** Icon-only rail: labels move into tooltips and the accessible name. */
  collapsed?: boolean;
}

const defaultLink = (props: NavigationLinkProps) => <a {...props} />;

const itemClasses = cn(
  'group/nav relative flex h-9 w-full min-w-0 items-center gap-3 rounded-md px-2.5 text-sm text-sidebar-foreground',
  'transition-colors duration-(--a-duration-fast) ease-standard',
  'hover:bg-sidebar-accent/70 hover:text-foreground',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
  'aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-semibold aria-[current=page]:text-sidebar-accent-foreground',
  "[&_svg]:size-[1.125rem] [&_svg]:shrink-0",
);

function Item({
  item,
  renderLink,
  collapsed,
}: {
  item: NavigationItem;
  renderLink: (props: NavigationLinkProps) => ReactNode;
  collapsed?: boolean;
}) {
  const badgeText =
    item.badge !== undefined && item.badgeLabel ? item.badgeLabel : undefined;
  const link = renderLink({
    href: item.href,
    className: cn(itemClasses, collapsed && 'justify-center px-0', item.disabled && 'pointer-events-none opacity-50'),
    'aria-current': item.selected ? 'page' : undefined,
    'aria-label': collapsed ? [item.label, badgeText].filter(Boolean).join(', ') : undefined,
    'data-collapsed': collapsed ? 'true' : undefined,
    onClick: item.onClick,
    target: item.external ? '_blank' : undefined,
    rel: item.external ? 'noopener noreferrer' : undefined,
    children: (
      <>
        {item.icon ? <span aria-hidden className="flex">{item.icon}</span> : null}
        {collapsed ? null : <span className="min-w-0 flex-1 truncate">{item.label}</span>}
        {item.badge !== undefined ? (
          <span
            aria-label={item.badgeLabel}
            className={cn(
              'inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums',
              collapsed && 'absolute -top-0.5 end-0.5 h-4 min-w-4 px-1 text-[0.625rem]',
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </>
    ),
  });
  return (
    <li>
      {collapsed ? (
        <Tooltip content={item.label} side="right">
          {link as React.ReactElement}
        </Tooltip>
      ) : (
        link
      )}
      {!collapsed &&
      (item.selected || item.subItems?.some((sub) => sub.selected)) &&
      item.subItems?.length ? (
        <ul className="mt-0.5 ms-5 flex flex-col gap-0.5 border-s border-sidebar-border ps-2">
          {item.subItems.map((sub) => (
            <Item key={sub.href} item={sub} renderLink={renderLink} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Grouped app navigation (shadcn sidebar menu). */
export function Navigation({
  sections,
  renderLink = defaultLink,
  collapsed,
  className,
  ...props
}: NavigationProps) {
  return (
    <nav
      className={cn('an-navigation flex flex-col gap-4', className)}
      aria-label="Main navigation"
      {...props}
    >
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.title && !collapsed ? (
            <div className="flex h-7 items-center justify-between px-2.5 text-xs font-medium text-muted-foreground">
              <span>{section.title}</span>
              {section.action}
            </div>
          ) : section.title ? (
            <div aria-hidden className="mx-2.5 my-1.5 h-px bg-sidebar-border" />
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <Item key={item.href} item={item} renderLink={renderLink} collapsed={collapsed} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
