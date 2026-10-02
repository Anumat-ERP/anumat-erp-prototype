import { Divider as MuiDivider } from '@mui/material';
import type { ComponentPropsWithRef, ReactNode } from 'react';
export interface DividerProps extends ComponentPropsWithRef<'div'> {
  orientation?: 'horizontal' | 'vertical';
  label?: ReactNode;
  tone?: 'default' | 'strong';
  decorative?: boolean;
}
export function Divider({
  label,
  tone: _tone,
  decorative = true,
  orientation = 'horizontal',
  ...props
}: DividerProps) {
  return (
    <MuiDivider
      component="div"
      orientation={orientation}
      aria-hidden={decorative || undefined}
      {...props}
    >
      {label}
    </MuiDivider>
  );
}
