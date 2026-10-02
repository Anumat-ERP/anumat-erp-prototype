import { Checkbox as MuiCheckbox } from '@mui/material';
import type { ComponentPropsWithRef } from 'react';
export type SelectionState = boolean | 'indeterminate';
export interface SelectionCheckboxProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'checked' | 'defaultChecked' | 'onChange' | 'children'
  > {
  checked: SelectionState;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}
export function SelectionCheckbox({
  checked,
  onCheckedChange,
  label,
  className,
  ref,
  onClick,
  onKeyDown,
  onPointerDown,
  ...props
}: SelectionCheckboxProps) {
  return (
    <MuiCheckbox
      size="small"
      className={className}
      checked={checked === true}
      indeterminate={checked === 'indeterminate'}
      disabled={props.disabled}
      onChange={(_, next) => onCheckedChange(next)}
      slotProps={{
        input: {
          ...props,
          ref,
          'aria-label': label,
          onClick: (e) => {
            e.stopPropagation();
            onClick?.(e);
          },
          onKeyDown: (e) => {
            e.stopPropagation();
            onKeyDown?.(e);
          },
          onPointerDown: (e) => {
            e.stopPropagation();
            onPointerDown?.(e);
          },
        },
      }}
      sx={{ p: 0.5 }}
    />
  );
}
