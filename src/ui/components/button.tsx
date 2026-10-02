import {
  Button as MuiButton,
  IconButton as MuiIconButton,
} from '@mui/material';
import {
  isValidElement,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { Slot } from './slot';
import { cn } from '../lib/cn';
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
const sizes = { sm: 'small', md: 'medium', lg: 'large' } as const;
const variants = {
  primary: 'contained',
  secondary: 'outlined',
  tertiary: 'text',
  critical: 'contained',
  plain: 'text',
} as const;
// For the few router links rendered by PageHeader.
export const buttonVariants = ({
  variant = 'secondary',
  size = 'md',
}: Pick<ButtonProps, 'variant' | 'size'> = {}) =>
  cn(
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium',
    size === 'sm' ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-md',
    variant === 'primary'
      ? 'bg-primary text-primary-fg'
      : 'text-fg hover:bg-surface-hover',
  );
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  trailingIcon,
  asChild,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  if (
    asChild &&
    isValidElement<{ children?: ReactNode; className?: string }>(children)
  ) {
    return (
      <MuiButton
        component={Slot}
        element={children}
        nativeButton={children.type === 'button'}
        variant={variants[variant]}
        color={variant === 'critical' ? 'error' : 'primary'}
        size={sizes[size]}
        startIcon={icon}
        endIcon={trailingIcon}
        {...props}
      >
        {children.props.children}
      </MuiButton>
    );
  }
  return (
    <MuiButton
      type={type}
      variant={variants[variant]}
      color={variant === 'critical' ? 'error' : 'primary'}
      size={sizes[size]}
      startIcon={icon}
      endIcon={trailingIcon}
      sx={
        variant === 'plain'
          ? { minWidth: 0, padding: 0, minHeight: 0 }
          : undefined
      }
      {...props}
    >
      {children}
    </MuiButton>
  );
}
export interface IconButtonProps
  extends Omit<ButtonProps, 'icon' | 'trailingIcon' | 'children' | 'asChild'> {
  icon: ReactNode;
  label: string;
}
export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'tertiary',
  loading,
  fullWidth: _fullWidth,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <MuiIconButton
      aria-label={label}
      title={label}
      size={sizes[size]}
      color={
        variant === 'critical'
          ? 'error'
          : variant === 'primary'
          ? 'primary'
          : 'default'
      }
      disabled={loading || disabled}
      {...props}
    >
      {icon}
    </MuiIconButton>
  );
}
