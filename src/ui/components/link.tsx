import { Link as MuiLink } from '@mui/material';
import { isValidElement, type ComponentPropsWithRef } from 'react';
import { Slot } from './slot';
export interface LinkProps extends ComponentPropsWithRef<'a'> {
  tone?: 'default' | 'muted' | 'critical';
  underline?: 'always' | 'hover';
  external?: boolean;
  externalLabel?: string;
  asChild?: boolean;
}
export function Link({
  tone = 'default',
  underline = 'always',
  external,
  externalLabel = '(opens in a new tab)',
  asChild,
  children,
  ...props
}: LinkProps) {
  const externalProps = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
  const color =
    tone === 'critical'
      ? 'error.main'
      : tone === 'muted'
      ? 'text.secondary'
      : 'primary';
  if (asChild && isValidElement<{ children?: React.ReactNode }>(children)) {
    return (
      <MuiLink
        component={Slot}
        element={children}
        color={color}
        underline={underline}
        {...externalProps}
        {...props}
      >
        {children.props.children}
      </MuiLink>
    );
  }
  return (
    <MuiLink color={color} underline={underline} {...externalProps} {...props}>
      {children}
      {external ? <span className="sr-only"> {externalLabel}</span> : null}
    </MuiLink>
  );
}
