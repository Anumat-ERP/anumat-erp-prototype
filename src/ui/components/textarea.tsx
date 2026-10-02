import { TextField } from '@mui/material';
import { useState, type ComponentPropsWithRef, type ChangeEvent } from 'react';
import { useFieldControl } from './field';
export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  autoGrow?: boolean;
  maxRows?: number;
  invalid?: boolean;
  showCharacterCount?: boolean;
}
export function Textarea({
  rows = 3,
  autoGrow,
  maxRows,
  invalid: invalidProp,
  showCharacterCount,
  className,
  style,
  ref,
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const { invalid, ...control } = useFieldControl({
    ...props,
    invalid: invalidProp,
  });
  const [local, setLocal] = useState(String(defaultValue ?? ''));
  const current = value === undefined ? local : String(value ?? '');
  return (
    <TextField
      fullWidth
      multiline
      rows={autoGrow ? undefined : rows}
      minRows={autoGrow ? rows : undefined}
      maxRows={autoGrow ? maxRows : undefined}
      value={value}
      defaultValue={defaultValue}
      error={invalid}
      disabled={control.disabled}
      required={control.required}
      id={control.id}
      className={className}
      style={style}
      inputRef={ref}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        setLocal(event.target.value);
        onChange?.(event);
      }}
      slotProps={{ htmlInput: { ...props, ...control } }}
      helperText={
        showCharacterCount && props.maxLength !== undefined
          ? `${current.length}/${props.maxLength}`
          : undefined
      }
    />
  );
}
