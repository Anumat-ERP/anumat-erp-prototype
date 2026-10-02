import { CircularProgress } from '@mui/material';
import { useEffect, useRef, useState, type ComponentPropsWithRef } from 'react';
import { Input } from './input';
export interface SearchFieldProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'onInput'
    | 'size'
    | 'type'
    | 'children'
  > {
  label: string;
  labelHidden?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  loading?: boolean;
  searchLandmark?: boolean;
  shortcut?: boolean;
  size?: 'sm' | 'md';
  inputClassName?: string;
}
export function SearchField({
  label,
  labelHidden = true,
  value,
  defaultValue = '',
  onChange,
  onInput,
  onClear,
  debounceMs = 250,
  loading,
  searchLandmark,
  shortcut,
  ref,
  ...props
}: SearchFieldProps) {
  const [text, setText] = useState(value ?? defaultValue);
  const [lastValue, setLastValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inner = useRef<HTMLInputElement | null>(null);
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== undefined) setText(value);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!shortcut) return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inner.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcut]);
  const emit = (next: string) => {
    setText(next);
    onInput?.(next);
    clearTimeout(timer.current);
    if (debounceMs <= 0 || !next) onChange?.(next);
    else timer.current = setTimeout(() => onChange?.(next), debounceMs);
  };
  return (
    <div role={searchLandmark ? 'search' : undefined} className="min-w-0">
      {!labelHidden ? (
        <label className="mb-1 block font-medium">{label}</label>
      ) : null}
      <Input
        {...props}
        type="search"
        aria-label={label}
        value={text}
        ref={(node) => {
          inner.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        onChange={(e) => emit(e.target.value)}
        onClear={onClear}
        suffix={loading ? <CircularProgress size={16} /> : undefined}
      />
    </div>
  );
}
