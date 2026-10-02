import { Avatar as MuiAvatar } from '@mui/material';
import type { ComponentPropsWithRef } from 'react';
export interface AvatarProps extends ComponentPropsWithRef<'span'> {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  decorative?: boolean;
  fallbackDelayMs?: number;
}
const sizes = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };
export function Avatar({
  name = '',
  src,
  size = 'md',
  shape = 'circle',
  decorative,
  fallbackDelayMs: _delay,
  ...props
}: AvatarProps) {
  return (
    <MuiAvatar
      component="span"
      src={src}
      alt={decorative ? '' : name}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      variant={shape === 'square' ? 'rounded' : 'circular'}
      sx={{
        width: sizes[size],
        height: sizes[size],
        fontSize: sizes[size] / 3,
        bgcolor: 'var(--a-color-primary-subtle)',
        color: 'var(--a-color-primary-subtle-fg)',
      }}
      {...props}
    >
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase() || '?'}
    </MuiAvatar>
  );
}
