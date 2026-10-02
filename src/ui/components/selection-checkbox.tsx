import { Check, Minus } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';
import { checkboxBoxClasses } from './checkbox';

export type SelectionState = boolean | 'indeterminate';

export interface SelectionCheckboxProps
  extends Omit<
    ComponentPropsWithRef<'button'>,
    'checked' | 'defaultChecked' | 'onChange' | 'children' | 'value'
  > {
  checked: SelectionState;
  onCheckedChange: (checked: boolean) => void;
  /** Names the row or page it selects: “Select order #1024”. */
  label: string;
}

/**
 * A row-selection checkbox. Clicks and keys stop here, so selecting a row
 * never also opens it.
 */
export function SelectionCheckbox({
  checked,
  onCheckedChange,
  label,
  className,
  onClick,
  onKeyDown,
  onPointerDown,
  ...props
}: SelectionCheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      {...props}
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next === true)}
      aria-label={label}
      className={cn(checkboxBoxClasses, className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        onKeyDown?.(e);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.(e);
      }}
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
}
