import { Slot } from 'radix-ui';
import { isValidElement, type ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  tone?: 'default' | 'muted' | 'critical';
  underline?: 'always' | 'hover';
  /** Opens in a new tab and says so to screen readers. */
  external?: boolean;
  externalLabel?: string;
  /** Style the child element (e.g. a router link) as a link. */
  asChild?: boolean;
}

export function Link({
  tone = 'default',
  underline = 'always',
  external,
  externalLabel = '(opens in a new tab)',
  asChild,
  className,
  children,
  ...props
}: LinkProps) {
  const classes = cn(
    'rounded-sm font-medium underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    underline === 'always' ? 'underline' : 'no-underline hover:underline',
    tone === 'critical'
      ? 'text-critical-subtle-fg'
      : tone === 'muted'
      ? 'text-muted-foreground hover:text-foreground'
      : 'text-fg-link',
    className,
  );
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
  if (asChild && isValidElement(children)) {
    return (
      <Slot.Root className={classes} {...externalProps} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <a className={classes} {...externalProps} {...props}>
      {children}
      {external ? <span className="sr-only"> {externalLabel}</span> : null}
    </a>
  );
}
