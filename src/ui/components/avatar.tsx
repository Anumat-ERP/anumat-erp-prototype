import { Avatar as AvatarPrimitive } from 'radix-ui';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';

export interface AvatarProps extends ComponentPropsWithRef<'span'> {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  /** Hidden from assistive technology when a name is already beside it. */
  decorative?: boolean;
  fallbackDelayMs?: number;
}

const SIZES = {
  xs: 'size-6 text-[0.5625rem]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-md',
  xl: 'size-16 text-lg',
} as const;

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

export function Avatar({
  name = '',
  src,
  size = 'md',
  shape = 'circle',
  decorative,
  fallbackDelayMs,
  className,
  ...props
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden select-none',
        shape === 'square' ? 'rounded-md' : 'rounded-full',
        SIZES[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />
      ) : null}
      <AvatarPrimitive.Fallback
        delayMs={src ? fallbackDelayMs : undefined}
        className="flex size-full items-center justify-center bg-accent font-semibold text-accent-foreground"
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
