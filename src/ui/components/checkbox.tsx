import {
  Checkbox as MuiCheckbox,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useFieldControl } from './field';
export interface CheckboxProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'size' | 'checked' | 'defaultChecked'
  > {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  label?: ReactNode;
  labelHidden?: boolean;
  helpText?: ReactNode;
  invalid?: boolean;
}
export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  labelHidden,
  helpText,
  invalid: invalidProp,
  className,
  ref,
  onChange,
  ...props
}: CheckboxProps) {
  const generated = useId();
  const { invalid, ...control } = useFieldControl({
    ...props,
    invalid: invalidProp,
  });
  const id = props.id ?? generated;
  const description =
    [control['aria-describedby'], helpText ? `${id}-help` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const checkbox = (
    <MuiCheckbox
      size="small"
      checked={checked === undefined ? undefined : checked === true}
      defaultChecked={checked === undefined ? defaultChecked === true : undefined}
      indeterminate={checked === 'indeterminate'}
      disabled={control.disabled}
      required={control.required}
      onChange={(event, next) => {
        onChange?.(event);
        onCheckedChange?.(next);
      }}
      slotProps={{
        input: {
          ...props,
          ref,
          ...control,
          id,
          'aria-describedby': description,
          'aria-label':
            props['aria-label'] ??
            (labelHidden && typeof label === 'string' ? label : undefined),
        },
      }}
      sx={invalid ? { color: 'error.main' } : undefined}
    />
  );
  return (
    <span className={className}>
      {label !== undefined && !labelHidden ? (
        <FormControlLabel
          control={checkbox}
          label={label}
          sx={{
            m: 0,
            alignItems: 'center',
            '.MuiTypography-root': { fontSize: '0.875rem' },
          }}
        />
      ) : (
        checkbox
      )}
      {helpText ? (
        <FormHelperText id={`${id}-help`} sx={{ ml: 4 }}>
          {helpText}
        </FormHelperText>
      ) : null}
    </span>
  );
}
