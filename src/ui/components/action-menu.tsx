import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Divider,
} from '@mui/material';
import { MoreHorizontal } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ReactNode,
  type MouseEventHandler,
} from 'react';
import { Button, IconButton } from './button';
export interface ActionMenuItem {
  content: string;
  icon?: ReactNode;
  onAction?: () => void;
  href?: string;
  destructive?: boolean;
  disabled?: boolean;
  helpText?: ReactNode;
  suffix?: ReactNode;
}
export interface ActionMenuSection {
  title?: string;
  items: ActionMenuItem[];
}
export interface ActionMenuProps {
  trigger: ReactNode;
  sections?: ActionMenuSection[];
  items?: ActionMenuItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  modal?: boolean;
  className?: string;
}
export function ActionMenu({
  trigger,
  sections,
  items,
  open: controlled,
  onOpenChange,
  defaultOpen = false,
  align = 'end',
  side = 'bottom',
  className,
}: ActionMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [local, setLocal] = useState(defaultOpen);
  const id = useId();
  const open = controlled ?? local;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  const horizontal =
    align === 'start' ? 'left' : align === 'center' ? 'center' : 'right';
  return (
    <>
      {isValidElement<{ onClick?: MouseEventHandler<HTMLElement> }>(trigger)
        ? cloneElement(trigger, {
            'aria-haspopup': 'menu',
            'aria-expanded': open,
            'aria-controls': open ? id : undefined,
            onClick: (e: React.MouseEvent<HTMLElement>) => {
              trigger.props.onClick?.(e);
              if (!e.defaultPrevented) {
                setAnchor(e.currentTarget);
                setOpen(!open);
              }
            },
          } as Partial<typeof trigger.props>)
        : trigger}
      <Menu
        id={id}
        anchorEl={anchor}
        open={open && Boolean(anchor)}
        onClose={() => setOpen(false)}
        anchorOrigin={{
          vertical: side === 'top' ? 'top' : 'bottom',
          horizontal,
        }}
        transformOrigin={{
          vertical: side === 'top' ? 'bottom' : 'top',
          horizontal,
        }}
        slotProps={{
          paper: {
            className,
            sx: { minWidth: 220, maxWidth: 'calc(100vw - 32px)' },
          },
        }}
      >
        {(sections ?? [{ items: items ?? [] }]).flatMap((section, i) => [
          ...(i > 0 ? [<Divider key={`divider-${i}`} />] : []),
          ...(section.title
            ? [
                <ListSubheader
                  key={`heading-${i}`}
                  sx={{ lineHeight: '32px', bgcolor: 'transparent' }}
                >
                  {section.title}
                </ListSubheader>,
              ]
            : []),
          ...section.items.map((item, j) => (
            <MenuItem
              key={`${i}-${j}`}
              component={item.href ? 'a' : 'li'}
              href={item.href}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onAction?.();
              }}
              sx={item.destructive ? { color: 'error.main' } : undefined}
            >
              {item.icon ? (
                <ListItemIcon
                  sx={{ color: 'inherit', '& svg': { width: 18, height: 18 } }}
                >
                  {item.icon}
                </ListItemIcon>
              ) : null}
              <ListItemText primary={item.content} secondary={item.helpText} />
              {item.suffix}
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  );
}
export interface PageActionsProps {
  actions: ActionMenuItem[];
  maxVisible?: number;
  moreLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function PageActions({
  actions,
  maxVisible = 2,
  moreLabel = 'More actions',
  size = 'md',
  className,
}: PageActionsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      {actions.slice(0, maxVisible).map((action) => (
        <Button
          key={action.content}
          size={size}
          icon={action.icon}
          variant={action.destructive ? 'critical' : 'secondary'}
          disabled={action.disabled}
          onClick={action.onAction}
          asChild={Boolean(action.href)}
        >
          {action.href ? (
            <a href={action.href}>{action.content}</a>
          ) : (
            action.content
          )}
        </Button>
      ))}
      {actions.length > maxVisible ? (
        <ActionMenu
          trigger={
            <IconButton
              icon={<MoreHorizontal />}
              label={moreLabel}
              size={size}
            />
          }
          items={actions.slice(maxVisible)}
        />
      ) : null}
    </div>
  );
}
