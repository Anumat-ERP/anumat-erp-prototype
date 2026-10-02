import { Switch as SwitchPrimitive } from 'radix-ui';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SwitchProps
  extends Omit<
    ComponentPropsWithRef<'button'>,
    'onChange' | 'value' | 'checked' | 'defaultChecked'
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  labelHidden?: boolean;
  helpText?: ReactNode;
  labelPosition?: 'start' | 'end';
  name?: string;
  value?: string;
  required?: boolean;
}

/** A setting that takes effect immediately. Use Checkbox for choices submitted with a form. */
export function Switch({
  label,
  labelHidden,
  helpText,
  labelPosition = 'end',
  onCheckedChange,
  className,
  id: idProp,
  ...props
}: SwitchProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const control = (
    <SwitchPrimitive.Root
      {...props}
      id={id}
      onCheckedChange={onCheckedChange}
      aria-describedby={helpText ? `${id}-help` : props['aria-describedby']}
      aria-label={
        props['aria-label'] ??
        (labelHidden && typeof label === 'string' ? label : undefined)
      }
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-xs',
        'transition-colors duration-(--a-duration-fast) ease-standard',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-card shadow-sm ring-0 transition-transform duration-(--a-duration-fast) data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-4" />
    </SwitchPrimitive.Root>
  );
  const text =
    label !== undefined && !labelHidden ? (
      <label htmlFor={id} className="text-sm leading-snug text-foreground peer-disabled:opacity-60">
        {label}
      </label>
    ) : null;
  return (
    <span className={cn('inline-flex flex-col gap-1', className)}>
      <span className="inline-flex items-center gap-2.5">
        {labelPosition === 'start' ? text : null}
        {control}
        {labelPosition === 'end' ? text : null}
      </span>
      {helpText ? (
        <span id={`${id}-help`} className="text-sm text-muted-foreground">
          {helpText}
        </span>
      ) : null}
    </span>
  );
}
