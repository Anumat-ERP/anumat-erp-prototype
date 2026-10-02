import { RadioGroup as RadioPrimitive } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useField } from './field';

export interface RadioGroupProps
  extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'dir'> {
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

/** Choose exactly one of a few visible options. */
export function RadioGroup({
  legend,
  legendHidden,
  helpText,
  error,
  invalid,
  required,
  disabled,
  orientation = 'vertical',
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
  const hasMessage = Boolean(error || helpText);
  const isInvalid = invalid || Boolean(error) || field?.invalid;
  const group = (
    <RadioPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      required={required || field?.required}
      disabled={disabled || field?.disabled}
      orientation={orientation}
      aria-labelledby={legend ? `${id}-label` : field?.labelId}
      aria-describedby={hasMessage ? `${id}-help` : field?.describedBy}
      aria-invalid={isInvalid || undefined}
      className={cn(
        'flex gap-3',
        orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  );
  return (
    <fieldset className={cn('m-0 min-w-0 border-0 p-0', className)}>
      {legend ? (
        <legend
          id={`${id}-label`}
          className={cn('mb-2 p-0 text-md font-medium text-foreground', legendHidden && 'sr-only')}
        >
          {legend}
        </legend>
      ) : null}
      {group}
      {hasMessage ? (
        <p
          id={`${id}-help`}
          className={cn('mt-1.5 text-sm', error ? 'text-critical-subtle-fg' : 'text-muted-foreground')}
        >
          {error || helpText}
        </p>
      ) : null}
    </fieldset>
  );
}

export interface RadioGroupItemProps
  extends Omit<ComponentPropsWithRef<'button'>, 'value'> {
  value: string;
  label: ReactNode;
  helpText?: ReactNode;
}

export function RadioGroupItem({
  value,
  label,
  helpText,
  className,
  id: idProp,
  ...props
}: RadioGroupItemProps) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="inline-flex items-center gap-2.5">
        <RadioPrimitive.Item
          {...props}
          id={id}
          value={value}
          aria-describedby={helpText ? `${id}-help` : undefined}
          className="peer inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full border-2 border-input bg-card shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[state=checked]:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RadioPrimitive.Indicator className="size-2 rounded-full bg-primary" />
        </RadioPrimitive.Item>
        <label htmlFor={id} className="text-sm leading-snug text-foreground peer-disabled:opacity-60">
          {label}
        </label>
      </span>
      {helpText ? (
        <span id={`${id}-help`} className="ms-7 text-sm text-muted-foreground">
          {helpText}
        </span>
      ) : null}
    </div>
  );
}
