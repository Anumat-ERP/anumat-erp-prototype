import { Chip } from '@mui/material';
import type { ComponentPropsWithRef, ReactNode, MouseEvent } from 'react';
export interface TagProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children' | 'color'> {
  children: ReactNode;
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  accessibilityLabel?: string;
  href?: string;
  disabled?: boolean;
  maxWidthClassName?: string;
}
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
  return (
    <Chip
      label={children}
      size="small"
      component={href ? 'a' : 'span'}
      href={href}
      clickable={Boolean(href)}
      disabled={disabled}
      aria-label={accessibilityLabel}
      onDelete={
        onRemove
          ? (e) => onRemove(e as MouseEvent<HTMLButtonElement>)
          : undefined
      }
      className={[className, maxWidthClassName].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
