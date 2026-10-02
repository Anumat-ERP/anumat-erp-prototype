import { useId, useRef, type ClipboardEvent } from 'react';
import { Input } from './input';

export interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  digitLabel?: (position: number) => string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
}

/** Six numeric slots with paste, autofill and native keyboard navigation. */
export function CodeInput({ value, onChange, label, digitLabel = n => `Digit ${n} of 6`, describedBy, invalid, disabled }: CodeInputProps) {
  const id = useId();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const put = (raw: string, index: number) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const start = digits.length === 6 ? 0 : index;
    const next = value.padEnd(6, ' ').split('');
    [...digits].forEach((digit, offset) => { if (start + offset < 6) next[start + offset] = digit; });
    onChange(next.join('').trimEnd());
    inputs.current[Math.min(start + digits.length, 5)]?.focus();
  };
  const paste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault();
    put(event.clipboardData.getData('text'), index);
  };
  return <fieldset className="an-code-field" aria-describedby={describedBy} disabled={disabled}>
    <legend className="sr-only">{label}</legend>
    <div className="an-code-input">
      {Array.from({ length: 6 }, (_, index) => <Input
        key={index} id={`${id}-${index}`} ref={node => { inputs.current[index] = node; }}
        value={value[index]?.trim() ?? ''} aria-label={digitLabel(index + 1)} aria-describedby={describedBy}
        inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} invalid={invalid} disabled={disabled}
        onPaste={event => paste(event, index)} onFocus={event => event.target.select()}
        onChange={event => {
          if (event.target.value) put(event.target.value, index);
          else { const next = value.padEnd(6, ' ').split(''); next[index] = ' '; onChange(next.join('').trimEnd()); }
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); inputs.current[Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1)))]?.focus();
          } else if (event.key === 'Backspace' && !value[index]?.trim() && index > 0) {
            event.preventDefault(); const next = value.padEnd(6, ' ').split(''); next[index - 1] = ' '; onChange(next.join('').trimEnd()); inputs.current[index - 1]?.focus();
          }
        }} />)}
    </div>
  </fieldset>;
}
