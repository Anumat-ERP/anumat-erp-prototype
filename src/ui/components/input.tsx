import { InputAdornment, TextField, IconButton } from '@mui/material';
import { Search, X } from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
} from 'react';
import { useField, useFieldControl } from './field';
export interface InputProps
  extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'prefix'> {
  size?: 'sm' | 'md' | 'lg';
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  invalid?: boolean;
  showCharacterCount?: boolean;
  inputClassName?: string;
}
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
  ...props
}: InputProps) {
  const field = useField();
  const { invalid, ...control } = useFieldControl({
    ...props,
    invalid: invalidProp,
  });
  const inner = useRef<HTMLInputElement | null>(null);
  const [local, setLocal] = useState(String(defaultValue ?? ''));
  const current = value === undefined ? local : String(value ?? '');
  const clear = () => {
    const input = inner.current;
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    setter?.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    setLocal('');
    onClear?.();
    input.focus();
  };
  return (
    <TextField
      fullWidth
      label={field?.floating ? field.label : undefined}
      variant="outlined"
      size={size === 'lg' ? 'medium' : 'small'}
      className={[field?.floating && 'an-floating-field', className].filter(Boolean).join(' ')}
      style={style}
      type={type}
      value={value}
      defaultValue={defaultValue}
      error={invalid}
      disabled={control.disabled}
      required={control.required}
      id={control.id}
      inputRef={(node: HTMLInputElement | null) => {
        inner.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setLocal(event.target.value);
        onChange?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event as React.KeyboardEvent<HTMLInputElement>);
        if (
          !event.defaultPrevented &&
          type === 'search' &&
          event.key === 'Escape' &&
          current &&
          !props.readOnly &&
          !control.disabled
        ) {
          event.preventDefault();
          clear();
        }
      }}
      slotProps={{
        htmlInput: { ...props, ...control, className: inputClassName },
        input: {
          startAdornment:
            prefix !== undefined || type === 'search' ? (
              <InputAdornment position="start">
                {prefix ?? <Search size={18} />}
              </InputAdornment>
            ) : undefined,
          endAdornment: (
            <>
              {suffix ? (
                <InputAdornment position="end">{suffix}</InputAdornment>
              ) : null}
              {(clearable ?? type === 'search') &&
              current &&
              !control.disabled &&
              !props.readOnly ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={clearLabel}
                    onClick={clear}
                  >
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null}
            </>
          ),
        },
      }}
      helperText={
        showCharacterCount && props.maxLength !== undefined
          ? `${current.length}/${props.maxLength}`
          : undefined
      }
    />
  );
}
