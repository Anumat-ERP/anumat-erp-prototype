import { useState, type ChangeEvent, type ComponentPropsWithRef } from 'react';
import { cn } from '../lib/cn';
import { CharacterCount, useFieldControl } from './field';
import { controlClasses } from './input';

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  /** Grow with the content, from `rows` up to `maxRows`. */
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
  value,
  defaultValue,
  onChange,
  ...props
}: TextareaProps) {
  const { invalid: _invalid, ...control } = useFieldControl({
    ...props,
    invalid: invalidProp,
  });
  const [local, setLocal] = useState(String(defaultValue ?? ''));
  const current = value === undefined ? local : String(value ?? '');
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)} style={style}>
      <textarea
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          setLocal(event.target.value);
          onChange?.(event);
        }}
        {...props}
        {...control}
        className={cn(
          controlClasses,
          'min-h-16 px-3 py-2 text-sm leading-relaxed',
          autoGrow ? '[field-sizing:content] resize-none' : 'resize-y',
        )}
        style={autoGrow && maxRows ? { maxHeight: `calc(${maxRows} * 1.625em + 1rem)` } : undefined}
      />
      {showCharacterCount && props.maxLength !== undefined ? (
        <CharacterCount count={current.length} max={props.maxLength} className="self-end" />
      ) : null}
    </div>
  );
}
