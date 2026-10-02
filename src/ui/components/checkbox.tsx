import { Check, Minus } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useFieldControl } from './field';

export interface CheckboxProps
  extends Omit<
    ComponentPropsWithRef<'button'>,
    'checked' | 'defaultChecked' | 'onChange' | 'value'
  > {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  label?: ReactNode;
  labelHidden?: boolean;
  helpText?: ReactNode;
  invalid?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
}

export const checkboxBoxClasses = cn(
  'peer inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-[5px] border-2 border-input bg-card text-primary-foreground shadow-xs',
  'transition-colors duration-(--a-duration-fast) ease-standard',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
  'aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-45',
);

/** A single on/off choice with its own label. Indeterminate for "some of these". */
export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  labelHidden,
  helpText,
  invalid: invalidProp,
  className,
  id: idProp,
  ...props
}: CheckboxProps) {
  const generated = useId();
  const { invalid: _invalid, ...control } = useFieldControl({
    id: idProp,
    required: props.required,
    disabled: props.disabled,
    'aria-describedby': props['aria-describedby'],
    invalid: invalidProp,
  });
  // In a group Field the control has no field id; fall back to our own.
  const id = control.id ?? generated;
  const description =
    [control['aria-describedby'], helpText ? `${id}-help` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const box = (
    <CheckboxPrimitive.Root
      {...props}
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(next) => onCheckedChange?.(next)}
      disabled={control.disabled}
      required={control.required}
      aria-invalid={control['aria-invalid']}
      aria-describedby={description}
      aria-label={
        props['aria-label'] ??
        (labelHidden && typeof label === 'string' ? label : undefined)
      }
      className={checkboxBoxClasses}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {checked === 'indeterminate' ? (
          <Minus aria-hidden className="size-3.5" strokeWidth={3} />
        ) : (
          <Check aria-hidden className="size-3.5" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  return (
    <span className={cn('inline-flex flex-col gap-1', className)}>
      {label !== undefined && !labelHidden ? (
        <span className="inline-flex items-center gap-2.5">
          {box}
          <label
            htmlFor={id}
            className="text-sm leading-snug text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
          >
            {label}
          </label>
        </span>
      ) : (
        box
      )}
      {helpText ? (
        <span id={`${id}-help`} className="ms-7 text-sm text-muted-foreground">
          {helpText}
        </span>
      ) : null}
    </span>
  );
}
