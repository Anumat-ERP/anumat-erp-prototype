import { Check, ChevronDown } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import {
  Children,
  isValidElement,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { useField, useFieldControl } from './field';
import { controlClasses } from './input';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
  disabled?: boolean;
}

/** Callers read `event.target.value`, as they would from a native select. */
export interface SelectChangeEvent<T = string> {
  target: { value: T; name?: string };
}

export interface SelectProps {
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  options?: Array<SelectOption | SelectOptionGroup>;
  invalid?: boolean;
  /** Extra classes for the trigger button. */
  selectClassName?: string;
  onChange?: (event: SelectChangeEvent<string>) => void;
  value?: string;
  defaultValue?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
}

interface OptionElementProps {
  value?: string;
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
}

/** Existing callers can still provide HTML option and optgroup children. */
function childOptions(children: ReactNode): Array<SelectOption | SelectOptionGroup> {
  const choices: Array<SelectOption | SelectOptionGroup> = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<OptionElementProps>(child)) return;
    if (child.type === 'option') {
      choices.push({
        value: String(child.props.value ?? ''),
        label: String(child.props.children ?? ''),
        disabled: child.props.disabled,
      });
    }
    if (child.type === 'optgroup') {
      choices.push({
        label: String(child.props.label ?? ''),
        disabled: child.props.disabled,
        options: childOptions(child.props.children).filter(
          (option): option is SelectOption => 'value' in option,
        ),
      });
    }
  });
  return choices;
}

// Radix reserves "" for "nothing selected", so an empty-valued option travels under this name.
const EMPTY = '__anumat_empty__';
const toRadix = (v: string) => (v === '' ? EMPTY : v);
const fromRadix = (v: string) => (v === EMPTY ? '' : v);

const HEIGHT = { sm: 'h-8 text-sm', md: 'h-9 text-sm', lg: 'h-11 text-md' } as const;

/**
 * Choose one option from a list (shadcn Select on Radix). Put it in a Field;
 * in a `floating` Field the label sits inside the trigger.
 */
export function Select({
  size = 'md',
  placeholder,
  options,
  invalid: invalidProp,
  selectClassName,
  children,
  className,
  style,
  onChange,
  value,
  defaultValue,
  name,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
}: SelectProps) {
  const field = useField();
  const floating = field?.floating ? field.label : undefined;
  const control = useFieldControl({ id, required, disabled, 'aria-describedby': describedBy, invalid: invalidProp });
  const choices = [...(options ?? []), ...childOptions(children)];
  const flat = choices.flatMap((c) => ('options' in c ? c.options : [c]));
  const [local, setLocal] = useState(defaultValue ?? '');
  const current = value ?? local;
  // A value of "" shows the placeholder unless "" is itself a listed option.
  const hasEmptyOption = flat.some((o) => o.value === '');
  const radixValue = current === '' && !hasEmptyOption ? '' : toRadix(current);
  const filled = current !== '' || hasEmptyOption;

  const item = (o: SelectOption, groupDisabled?: boolean) => (
    <SelectPrimitive.Item
      key={`${o.value}-${o.label}`}
      value={toRadix(o.value)}
      disabled={groupDisabled || o.disabled}
      className="relative flex min-h-9 w-full cursor-default items-center rounded-sm py-1.5 ps-2 pe-8 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[state=checked]:font-medium"
    >
      <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
      <span className="absolute end-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden className="size-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );

  return (
    <div
      data-floating={floating ? '' : undefined}
      data-filled={filled || undefined}
      className={cn('an-select-field relative min-w-0', floating && 'an-floating-field', className)}
      style={style}
    >
      <SelectPrimitive.Root
        value={radixValue}
        onValueChange={(next) => {
          const v = fromRadix(next);
          if (value === undefined) setLocal(v);
          onChange?.({ target: { value: v, name } });
        }}
        name={name}
        required={control.required}
        disabled={control.disabled}
      >
        <SelectPrimitive.Trigger
          id={control.id}
          aria-label={floating ? undefined : ariaLabel}
          aria-labelledby={floating ? field?.labelId : labelledBy}
          aria-describedby={control['aria-describedby']}
          aria-invalid={control['aria-invalid']}
          className={cn(
            controlClasses,
            'flex items-center justify-between gap-2 text-start data-[placeholder]:text-muted-foreground',
            floating ? 'h-16 px-4 pt-6 pb-2 text-md' : cn(HEIGHT[size], 'px-3 py-1'),
            '[&>span]:line-clamp-1 [&>span]:min-w-0',
            selectClassName,
          )}
        >
          <SelectPrimitive.Value placeholder={floating ? ' ' : placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="an-select-menu relative z-50 max-h-[min(420px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md an-pop"
          >
            <SelectPrimitive.Viewport className="p-1">
              {choices.map((c) =>
                'options' in c ? (
                  <SelectPrimitive.Group key={`group-${c.label}`}>
                    <SelectPrimitive.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {c.label}
                    </SelectPrimitive.Label>
                    {c.options.map((o) => item(o, c.disabled))}
                  </SelectPrimitive.Group>
                ) : (
                  item(c)
                ),
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {floating ? (
        <label id={field?.labelId} htmlFor={control.id} className="an-floating-label">
          {floating}
          {control.required ? <span aria-hidden className="ms-0.5 text-critical-subtle-fg">*</span> : null}
        </label>
      ) : null}
    </div>
  );
}
