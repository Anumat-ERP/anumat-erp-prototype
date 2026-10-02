import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { Fragment, type ReactNode } from 'react';
import { cn } from '../lib/cn';
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

const itemClasses =
  'relative flex min-h-9 cursor-default items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:shrink-0';

/** A list of commands behind a button (shadcn DropdownMenu). */
export function ActionMenu({
  trigger,
  sections,
  items,
  open,
  onOpenChange,
  defaultOpen,
  align = 'end',
  side = 'bottom',
  modal,
  className,
}: ActionMenuProps) {
  const groups = sections ?? [{ items: items ?? [] }];
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen} modal={modal}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={6}
          collisionPadding={16}
          className={cn(
            'an-pop z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] max-w-[calc(100vw-2rem)] min-w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md',
            className,
          )}
        >
          {groups.map((section, i) => (
            <Fragment key={i}>
              {i > 0 ? <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-border" /> : null}
              <DropdownMenu.Group>
                {section.title ? (
                  <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {section.title}
                  </DropdownMenu.Label>
                ) : null}
                {section.items.map((item, j) => {
                  const body = (
                    <>
                      {item.icon ? <span aria-hidden className="flex">{item.icon}</span> : null}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span>{item.content}</span>
                        {item.helpText ? (
                          <span className="text-xs text-muted-foreground">{item.helpText}</span>
                        ) : null}
                      </span>
                      {item.suffix}
                    </>
                  );
                  return (
                    <DropdownMenu.Item
                      key={`${i}-${j}`}
                      disabled={item.disabled}
                      onSelect={() => item.onAction?.()}
                      asChild={Boolean(item.href)}
                      className={cn(itemClasses, item.destructive && 'text-critical-subtle-fg data-[highlighted]:bg-critical-subtle')}
                    >
                      {item.href ? <a href={item.href}>{body}</a> : body}
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Group>
            </Fragment>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export interface PageActionsProps {
  actions: ActionMenuItem[];
  maxVisible?: number;
  moreLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** A page's secondary actions: the first few as buttons, the rest in “More actions”. */
export function PageActions({
  actions,
  maxVisible = 2,
  moreLabel = 'More actions',
  size = 'md',
  className,
}: PageActionsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
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
          {action.href ? <a href={action.href}>{action.content}</a> : action.content}
        </Button>
      ))}
      {actions.length > maxVisible ? (
        <ActionMenu
          trigger={<IconButton icon={<MoreHorizontal />} label={moreLabel} size={size} />}
          items={actions.slice(maxVisible)}
        />
      ) : null}
    </div>
  );
}
