import { useId, type ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';
import { FieldError } from './field';
import { controlClasses } from './input';

export interface DatePickerProps
  extends Omit<ComponentPropsWithRef<'input'>, 'children' | 'type'> {
  label: string;
  error?: string;
}

/** A labelled native date input: the platform picker, keyboard entry and locale formats for free. */
export function DatePicker({ label, error, className, style, id: idProp, ...props }: DatePickerProps) {
  const generated = useId();
  const id = idProp ?? generated;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)} style={style}>
      <label htmlFor={id} className="text-md font-medium text-foreground">
        {label}
      </label>
      <input
        {...props}
        id={id}
        type="date"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : props['aria-describedby']}
        className={cn(controlClasses, 'h-9 px-3 text-sm [color-scheme:inherit]')}
      />
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}
