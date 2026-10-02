import { X } from 'lucide-react';
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TagProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'color'> {
  children: ReactNode;
  /** Shows a remove button; its label is “Remove {accessibilityLabel ?? text}”. */
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  accessibilityLabel?: string;
  href?: string;
  disabled?: boolean;
  maxWidthClassName?: string;
}

/** A removable or linked keyword (a filter value, a label). */
export function Tag({
  children,
  onRemove,
  accessibilityLabel,
  href,
  disabled,
  maxWidthClassName,
  className,
  ...props
}: TagProps) {
  const content = (
    <span className={cn('truncate', maxWidthClassName)}>{children}</span>
  );
  return (
    <span
      aria-label={accessibilityLabel}
      aria-disabled={disabled || undefined}
      className={cn(
        'inline-flex h-6 max-w-full items-center gap-1 rounded-md border border-border bg-muted ps-2 text-xs font-medium text-foreground',
        onRemove ? 'pe-0.5' : 'pe-2',
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {href && !disabled ? (
        <a href={href} className="truncate hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          {children}
        </a>
      ) : (
        content
      )}
      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remove ${accessibilityLabel ?? (typeof children === 'string' ? children : '')}`.trim()}
          className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </span>
  );
}
