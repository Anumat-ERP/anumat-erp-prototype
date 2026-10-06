import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import {
  isValidElement,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';

export interface ButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'color'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'critical' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  asChild?: boolean;
}

const button = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none',
    'transition-colors duration-(--a-duration-fast) ease-standard',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'border border-input bg-card text-foreground shadow-xs hover:bg-muted active:bg-accent',
        tertiary: 'text-foreground hover:bg-muted active:bg-accent',
        critical:
          'bg-destructive text-destructive-foreground shadow-xs hover:opacity-90',
        plain:
          'h-auto min-h-0 p-0 text-fg-link underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-md',
      },
    },
    compoundVariants: [
      { variant: 'plain', size: ['sm', 'md', 'lg'], className: 'h-auto px-0' },
    ],
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

/** The class string Button renders with, for links styled as buttons. */
export const buttonVariants = ({
  variant = 'secondary',
  size = 'md',
}: Pick<ButtonProps, 'variant' | 'size'> = {}) => button({ variant, size });

/**
 * A command. One `primary` per view; `secondary` for the rest; `critical` for
 * destructive confirmations; `plain` for inline, link-like actions.
 * `asChild` renders the child element (e.g. a router link) with button styles.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  loading,
  icon,
  trailingIcon,
  asChild,
  children,
  className,
  disabled,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(button({ variant, size }), fullWidth && 'w-full', className);
  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    return (
      <Slot.Root className={classes} aria-disabled={disabled || undefined} onClick={onClick} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
      onClick={(event) => {
        if (variant === 'primary' || type === 'submit') {
          const scope = event.currentTarget.closest('[role="dialog"], form, main');
          const invalidDate = Array.from(scope?.querySelectorAll<HTMLInputElement>('[data-date-input]') ?? []).find((input) => !input.disabled && !input.closest('[data-form-preview]') && input.validity.customError);
          if (invalidDate) { event.preventDefault(); invalidDate.focus(); invalidDate.scrollIntoView({ block: 'nearest' }); return; }
        }
        onClick?.(event);
      }}
    >
      {loading ? <Spinner size="sm" label={null} tone="inherit" /> : icon}
      {children}
      {trailingIcon}
    </button>
  );
}

export interface IconButtonProps
  extends Omit<ButtonProps, 'icon' | 'trailingIcon' | 'children' | 'asChild'> {
  icon: ReactNode;
  /** Accessible name, also shown as the native tooltip. */
  label: string;
}

/** A square button with only an icon. `label` names it. */
export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'tertiary',
  loading,
  fullWidth: _fullWidth,
  disabled,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={loading || disabled}
      className={cn(
        button({ variant, size }),
        'px-0',
        size === 'sm' ? 'size-8' : size === 'lg' ? 'size-11' : 'size-9',
        "[&_svg:not([class*='size-'])]:size-[1.15rem]",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" label={null} tone="inherit" /> : icon}
    </button>
  );
}
