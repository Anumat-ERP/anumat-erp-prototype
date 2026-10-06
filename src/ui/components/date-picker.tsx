import { CalendarDays } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentPropsWithRef } from 'react';
import { useLocale } from '../../i18n/LocaleProvider';
import { Field, FieldError, useField, useFieldControl } from './field';
import { Input } from './input';
import { IconButton, Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function parseCalendarDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(0); date.setFullYear(year, month - 1, day); date.setHours(0, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : undefined;
}
export function calendarDateValue(date: Date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export interface DatePickerProps extends Omit<ComponentPropsWithRef<'input'>, 'children' | 'type' | 'size'> {
  label?: string;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
}
function DateControl({ label, error, value, defaultValue, onChange, min, max, ref, onKeyDown, ...props }: DatePickerProps) {
  const { t: tr } = useLocale();
  const field = useField();
  const fallbackId = useId();
  const control = useFieldControl({ ...props, id: props.id ?? field?.controlId ?? fallbackId });
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(String(value ?? defaultValue ?? ''));
  useEffect(() => { if (value !== undefined) setText(String(value)); }, [value]);
  const selected = parseCalendarDate(text);
  const earliest = parseCalendarDate(String(min ?? ''));
  const latest = parseCalendarDate(String(max ?? ''));
  const problem = !text ? undefined : !selected ? tr('Enter a real date in YYYY-MM-DD format.') : earliest && text < String(min) ? tr('Choose a date on or after {date}.', { date: String(min) }) : latest && text > String(max) ? tr('Choose a date on or before {date}.', { date: String(max) }) : undefined;
  useEffect(() => { input.current?.setCustomValidity(problem ?? ''); }, [problem]);
  const today = new Date();
  const todayAllowed = (!earliest || today >= earliest || calendarDateValue(today) === calendarDateValue(earliest)) && (!latest || calendarDateValue(today) <= calendarDateValue(latest));
  const choose = (next: string) => {
    const element = input.current;
    if (!element) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(element, next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    setOpen(false);
  };
  return <Popover open={open} onOpenChange={setOpen}>
    <Input {...props} id={control.id} ref={(element) => { input.current = element; if (typeof ref === 'function') ref(element); else if (ref) ref.current = element; }} type="text" data-date-input="" inputMode="numeric" placeholder="YYYY-MM-DD" value={text} aria-describedby={problem ? `${control.id}-date-error` : props['aria-describedby']} invalid={Boolean(problem) || Boolean(error) || undefined}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        const valid = !next || Boolean(parseCalendarDate(next));
        event.target.setCustomValidity(valid ? '' : tr('Enter a real date in YYYY-MM-DD format.'));
        if (valid) onChange?.(event);
      }}
      onKeyDown={(event) => { onKeyDown?.(event); if (!event.defaultPrevented && event.key === 'ArrowDown' && !control.disabled && !props.readOnly) { event.preventDefault(); setOpen(true); } }}
      suffix={<PopoverTrigger asChild><IconButton size="sm" icon={<CalendarDays />} label={tr('Open calendar for {label}', { label: label ?? String(field?.label ?? tr('Date')) })} disabled={control.disabled || props.readOnly} /></PopoverTrigger>} />
    {problem && <FieldError id={`${control.id}-date-error`} role="alert">{problem}</FieldError>}
    <PopoverContent className="an-date-popover" aria-label={tr('Choose date')} onOpenAutoFocus={(event) => {
        event.preventDefault();
        // Focus after Radix pauses the enclosing dialog's focus trap.
        (event.target as HTMLElement).querySelector<HTMLButtonElement>('.rdp-day_button[tabindex="0"]')?.focus();
      }} onCloseAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }}>
      <Calendar mode="single" required selected={selected} defaultMonth={selected ?? earliest ?? today} autoFocus startMonth={earliest ?? new Date(today.getFullYear() - 100, 0, 1)} endMonth={latest ?? new Date(today.getFullYear() + 100, 11, 31)} disabled={[...(earliest ? [{ before: earliest }] : []), ...(latest ? [{ after: latest }] : [])]} onSelect={(date) => date && choose(calendarDateValue(date))} />
      <div className="mt-2 flex justify-between border-t border-border pt-2"><Button size="sm" variant="tertiary" disabled={!todayAllowed} onClick={() => choose(calendarDateValue(today))}>{tr('Today')}</Button>{!control.required && <Button size="sm" variant="tertiary" disabled={!text} onClick={() => choose('')}>{tr('Clear date')}</Button>}</div>
    </PopoverContent>
  </Popover>;
}
/** ISO dates in data and keyboard entry; the same themed calendar on every platform. */
export function DatePicker({ label, error, helpText, className, style, ...props }: DatePickerProps) {
  if (!label) return <DateControl {...props} className={className} style={style} error={error} />;
  return <Field label={label} error={error} helpText={helpText} className={className} style={style} disabled={props.disabled} required={props.required} id={props.id}><DateControl {...props} label={label} error={error} /></Field>;
}
