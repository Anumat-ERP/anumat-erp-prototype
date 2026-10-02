import {
  Switch as MuiSwitch,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
export interface SwitchProps
  extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  labelHidden?: boolean;
  helpText?: ReactNode;
  labelPosition?: 'start' | 'end';
}
export function Switch({
  label,
  labelHidden,
  helpText,
  labelPosition = 'end',
  onCheckedChange,
  className,
  ref,
  onChange,
  ...props
}: SwitchProps) {
  const generated = useId();
  const id = props.id ?? generated;
  const control = (
    <MuiSwitch
      size="small"
      checked={props.checked}
      defaultChecked={props.defaultChecked}
      disabled={props.disabled}
      onChange={(e, next) => {
        onChange?.(e);
        onCheckedChange?.(next);
      }}
      slotProps={{
        input: {
          ...props,
          ref,
          id,
          role: 'switch',
          'aria-describedby': helpText
            ? `${id}-help`
            : props['aria-describedby'],
          'aria-label':
            props['aria-label'] ??
            (typeof label === 'string' ? label : undefined),
        },
      }}
    />
  );
  return (
    <span className={className}>
      {label !== undefined && !labelHidden ? (
        <FormControlLabel
          control={control}
          label={label}
          labelPlacement={labelPosition}
          sx={{ m: 0, gap: 1 }}
        />
      ) : (
        control
      )}
      {helpText ? (
        <FormHelperText id={`${id}-help`}>{helpText}</FormHelperText>
      ) : null}
    </span>
  );
}
