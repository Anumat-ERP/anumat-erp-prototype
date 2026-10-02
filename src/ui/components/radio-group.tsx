import {
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup as MuiRadioGroup,
} from '@mui/material';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useField } from './field';
export interface RadioGroupProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  legend?: ReactNode;
  legendHidden?: boolean;
  helpText?: ReactNode;
  error?: ReactNode;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}
export function RadioGroup({
  legend,
  legendHidden,
  helpText,
  error,
  invalid,
  required,
  disabled,
  orientation,
  value,
  defaultValue,
  onValueChange,
  name,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const id = useId();
  const field = useField();
  return (
    <FormControl
      component="fieldset"
      error={invalid || Boolean(error) || field?.invalid}
      required={required || field?.required}
      disabled={disabled || field?.disabled}
      className={className}
    >
      {legend ? (
        <FormLabel
          component="legend"
          id={`${id}-label`}
          className={legendHidden ? 'sr-only' : undefined}
        >
          {legend}
        </FormLabel>
      ) : null}
      <MuiRadioGroup
        row={orientation === 'horizontal'}
        value={value}
        defaultValue={defaultValue}
        onChange={(_, next) => onValueChange?.(next)}
        name={name}
        aria-labelledby={legend ? `${id}-label` : field?.labelId}
        aria-describedby={error || helpText ? `${id}-help` : field?.describedBy}
        {...props}
      >
        {children}
      </MuiRadioGroup>
      {error || helpText ? (
        <FormHelperText id={`${id}-help`}>{error || helpText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}
export interface RadioGroupItemProps
  extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  value: string;
  label: ReactNode;
  helpText?: ReactNode;
}
export function RadioGroupItem({
  value,
  label,
  helpText,
  className,
  ref,
  ...props
}: RadioGroupItemProps) {
  const id = useId();
  return (
    <div className={className}>
      <FormControlLabel
        value={value}
        disabled={props.disabled}
        control={
          <Radio
            size="small"
            slotProps={{
              input: {
                ...props,
                ref,
                'aria-describedby': helpText ? `${id}-help` : undefined,
              },
            }}
          />
        }
        label={label}
        sx={{ m: 0 }}
      />
      {helpText ? (
        <FormHelperText id={`${id}-help`} sx={{ ml: 4 }}>
          {helpText}
        </FormHelperText>
      ) : null}
    </div>
  );
}
