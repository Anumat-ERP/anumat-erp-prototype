'use client';

import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Chip,
} from '@mui/material';
import {
  cloneElement,
  isValidElement,
  forwardRef,
  useMemo,
  type ComponentPropsWithRef,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';

/** Props handed to `renderLink`. Spread them onto your router’s link. */
export interface NavigationLinkProps {
  href: string;
  className: string;
  children: ReactNode;
  'aria-current'?: 'page';
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A nested destination under a top-level item. */
export interface NavigationSubItem {
  /** Visible label. */
  label: string;
  /** Destination. */
  href: string;
  /** This is the current page: highlighted and `aria-current="page"`. */
  selected?: boolean;
  /** A count or short status after the label. */
  badge?: ReactNode;
  /** Called on click, e.g. to close a mobile drawer. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A top-level destination. */
export interface NavigationItem {
  /** Visible label. */
  label: string;
  /** Destination. */
  href: string;
  /** Leading icon (lucide). */
  icon?: ReactNode;
  /** A count or short status after the label (e.g. unfulfilled orders). */
  badge?: ReactNode;
  /** What the badge means, for assistive technology: “12 unfulfilled”. */
  badgeLabel?: string;
  /** This is the current page. Also reveals `subItems`. */
  selected?: boolean;
  /** Shown but not navigable — e.g. a module the plan doesn’t include. Explain why elsewhere. */
  disabled?: boolean;
  /** Opens in a new tab with an external-link icon, e.g. the online store. */
  external?: boolean;
  /** Children, shown when this item or one of them is selected. */
  subItems?: NavigationSubItem[];
  /** Called on click. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** A group of items with an optional heading. */
export interface NavigationSection {
  /** Section heading, e.g. “Sales channels”. */
  title?: string;
  /** The items. */
  items: NavigationItem[];
  /** Trailing element in the heading row, e.g. an IconButton to add a channel. */
  action?: ReactNode;
}

export interface NavigationProps
  extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** Grouped destinations, top to bottom. */
  sections: NavigationSection[];
  /** Render links with your router. Defaults to a plain `<a>`. */
  renderLink?: (props: NavigationLinkProps) => ReactNode;
  /** Accessible name of the landmark. */
  'aria-label'?: string;
}

const defaultLink = (props: NavigationLinkProps) => <a {...props} />;
function Item({
  item,
  renderLink,
}: {
  item: NavigationItem;
  renderLink: (props: NavigationLinkProps) => ReactNode;
}) {
  const Link = useMemo(
    () =>
      forwardRef<HTMLDivElement, { children?: ReactNode; className?: string }>(
        function NavigationLink(props, ref) {
          // Router links remain responsible for navigation; MUI owns their interaction styles.
          const element = renderLink({
            href: item.href,
            className: props.className ?? '',
            children: props.children,
            'aria-current': item.selected ? 'page' : undefined,
            onClick: item.onClick,
            target: item.external ? '_blank' : undefined,
            rel: item.external ? 'noopener noreferrer' : undefined,
          });
          return isValidElement<{ ref?: React.Ref<HTMLDivElement> }>(element)
            ? cloneElement(element, { ref })
            : element;
        },
      ),
    [item.href, item.selected, item.onClick, item.external, renderLink],
  );
  return (
    <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
      <ListItemButton
        component={Link}
        selected={item.selected}
        disabled={item.disabled}
        sx={{
          borderRadius: 1.5,
          minHeight: 52,
          px: 2,
          gap: 1.5,
          '&.Mui-selected': {
            bgcolor: 'var(--a-color-surface-selected)',
            color: 'var(--a-color-primary-subtle-fg)',
          },
        }}
      >
        {item.icon ? (
          <ListItemIcon
            sx={{
              minWidth: 26,
              color: 'inherit',
              '& svg': { width: 22, height: 22 },
            }}
          >
            {item.icon}
          </ListItemIcon>
        ) : null}
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              sx: {
                fontSize: '1rem',
                fontWeight: item.selected ? 600 : 400,
              },
            },
          }}
        />
        {item.badge !== undefined ? (
          <Chip
            size="small"
            label={item.badge}
            aria-label={item.badgeLabel}
            sx={{ height: 22, fontSize: '0.75rem' }}
          />
        ) : null}
      </ListItemButton>
      {(item.selected || item.subItems?.some((sub) => sub.selected)) &&
      item.subItems?.length ? (
        <List disablePadding sx={{ pl: 3 }}>
          {item.subItems.map((sub) => (
            <Item key={sub.href} item={sub} renderLink={renderLink} />
          ))}
        </List>
      ) : null}
    </ListItem>
  );
}
export function Navigation({
  sections,
  renderLink = defaultLink,
  className,
  ...props
}: NavigationProps) {
  return (
    <nav className={className} aria-label="Main navigation" {...props}>
      {sections.map((section, i) => (
        <List
          key={i}
          disablePadding
          sx={{ px: 2, pb: 2, pt: 0 }}
          subheader={
            section.title ? (
              <ListSubheader
                component="li"
                sx={{
                  px: 1.5,
                  bgcolor: 'transparent',
                  lineHeight: '48px',
                  textTransform: 'uppercase',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                }}
              >
                {section.title}
                {section.action}
              </ListSubheader>
            ) : undefined
          }
        >
          {section.items.map((item) => (
            <Item key={item.href} item={item} renderLink={renderLink} />
          ))}
        </List>
      ))}
    </nav>
  );
}
