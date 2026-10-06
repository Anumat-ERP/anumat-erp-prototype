import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** A small surface anchored to its trigger (filters, quick settings). Escape returns focus to the trigger. */
export function Popover({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (next: boolean) => void;
}) {
  return (
    <PopoverPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {children}
    </PopoverPrimitive.Root>
  );
}

export function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children?: ReactNode;
}) {
  return (
    <PopoverPrimitive.Trigger asChild={asChild} aria-haspopup="dialog">
      {children}
    </PopoverPrimitive.Trigger>
  );
}

export interface PopoverContentProps extends ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  arrow?: boolean;
  /** No padding, for lists that bring their own. */
  flush?: boolean;
}

export function PopoverContent({
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  arrow: _arrow,
  flush,
  className,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        role="dialog"
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn(
          'an-pop z-50 max-w-[calc(100vw-2rem)] min-w-56 rounded-lg border border-border bg-popover text-popover-foreground shadow-md outline-none',
          !flush && 'p-4',
          className,
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
