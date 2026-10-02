import { TextField } from '@mui/material';
import type { ComponentPropsWithRef } from 'react';
export interface DatePickerProps
  extends Omit<ComponentPropsWithRef<'input'>, 'children'> {
  label: string;
  error?: string;
}
export function DatePicker({
  label,
  error,
  className,
  style,
  ref,
  onChange,
  value,
  defaultValue,
  ...props
}: DatePickerProps) {
  return (
    <TextField
      fullWidth
      label={label}
      type="date"
      size="small"
      error={Boolean(error)}
      helperText={error}
      className={className}
      style={style}
      inputRef={ref}
      onChange={onChange}
      value={value}
      defaultValue={defaultValue}
      slotProps={{ inputLabel: { shrink: true }, htmlInput: props }}
    />
  );
}
