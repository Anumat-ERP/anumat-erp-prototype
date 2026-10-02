import { Search, X } from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { CharacterCount, useField, useFieldControl } from './field';

export interface InputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'prefix'> {
  size?: 'sm' | 'md' | 'lg';
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Show a clear button while there is text. On by default for `type="search"`. */
  clearable?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  invalid?: boolean;
  showCharacterCount?: boolean;
  inputClassName?: string;
}

/** Shared look of every text-like control (Input, Textarea, Select trigger). */
export const controlClasses = [
  'w-full min-w-0 rounded-md border border-input bg-card text-foreground shadow-xs',
  'transition-[color,box-shadow,border-color] duration-(--a-duration-fast) ease-standard',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:outline-none',
  'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
  'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
];

const HEIGHT = { sm: 'h-8 text-sm', md: 'h-9 text-sm', lg: 'h-11 text-md' } as const;

/**
 * A single-line text field. Put it in a Field for its label, help and error.
 * In a `floating` Field the label sits inside the box and moves up when the
 * field has focus or a value.
 */
export function Input({
  size = 'md',
  prefix,
  suffix,
  clearable,
  onClear,
  clearLabel = 'Clear',
  invalid: invalidProp,
  showCharacterCount,
  inputClassName,
  className,
  style,
  ref,
  value,
  defaultValue,
  onChange,
  onKeyDown,
  type = 'text',
  placeholder,
  ...props
}: InputProps) {
  const field = useField();
  const { invalid: _invalid, ...control } = useFieldControl({
    ...props,
    invalid: invalidProp,
  });
  const inner = useRef<HTMLInputElement | null>(null);
  const [local, setLocal] = useState(String(defaultValue ?? ''));
  const current = value === undefined ? local : String(value ?? '');
  const floating = field?.floating ? field.label : undefined;
  const search = type === 'search';
  const lead = prefix ?? (search ? <Search aria-hidden /> : undefined);
  const canClear =
    (clearable ?? search) && current !== '' && !control.disabled && !props.readOnly;

  const clear = () => {
    const input = inner.current;
    if (!input) return;
    // Go through the native setter so React's onChange fires like a real edit.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    setLocal('');
    onClear?.();
    input.focus();
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)} style={style}>
      <div
        data-floating={floating ? '' : undefined}
        data-filled={current !== '' || undefined}
        className={cn('an-input relative flex min-w-0 items-center', floating && 'an-floating-field')}
      >
        {lead ? (
          <span className="pointer-events-none absolute start-3 flex text-muted-foreground [&_svg]:size-4">
            {lead}
          </span>
        ) : null}
        <input
          ref={(node) => {
            inner.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={floating ? ' ' : placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setLocal(event.target.value);
            onChange?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (!event.defaultPrevented && search && event.key === 'Escape' && canClear) {
              event.preventDefault();
              clear();
            }
          }}
          {...props}
          {...control}
          className={cn(
            controlClasses,
            floating ? 'h-16 px-4 pt-6 pb-2 text-md' : cn(HEIGHT[size], 'px-3'),
            lead && 'ps-9',
            (suffix || canClear) && 'pe-10',
            search && '[&::-webkit-search-cancel-button]:appearance-none',
            inputClassName,
          )}
        />
        {floating ? (
          <label htmlFor={control.id} id={field?.labelId} className="an-floating-label">
            {floating}
            {control.required ? <span aria-hidden className="ms-0.5 text-critical-subtle-fg">*</span> : null}
          </label>
        ) : null}
        {canClear || suffix ? (
          <span className="absolute end-1.5 flex items-center gap-1">
            {canClear ? (
              <button
                type="button"
                aria-label={clearLabel}
                onClick={clear}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : null}
            {suffix}
          </span>
        ) : null}
      </div>
      {showCharacterCount && props.maxLength !== undefined ? (
        <CharacterCount count={current.length} max={props.maxLength} className="self-end" />
      ) : null}
    </div>
  );
}
