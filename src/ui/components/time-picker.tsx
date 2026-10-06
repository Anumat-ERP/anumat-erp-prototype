import { useId } from 'react';
import { Field } from './field';
import { Select, type SelectChangeEvent } from './select';
import { useLocale } from '../../i18n/LocaleProvider';
export interface TimePickerProps { label: string; value: string; onChange?: (event: SelectChangeEvent) => void; error?: string; disabled?: boolean; required?: boolean; }
/** A 24-hour time assembled from shared selects; every minute is available. */
export function TimePicker({ label, value, onChange, error, disabled, required }: TimePickerProps) {
  const { t: tr } = useLocale();
  const id = useId();
  const [hour = '', minute = ''] = value.split(':');
  const choices = (count: number) => Array.from({ length: count }, (_, value) => ({ value: String(value).padStart(2, '0'), label: String(value).padStart(2, '0') }));
  return <Field group label={label} error={error} disabled={disabled} required={required}><div className="flex items-center gap-1.5">
    <Select id={`${id}-hour`} aria-label={tr('Hour')} value={hour} options={choices(24)} placeholder={tr('Hour')} onChange={(event) => onChange?.({ target: { value: `${event.target.value}:${minute || '00'}` } })} className="min-w-0 flex-1" />
    <span aria-hidden>:</span>
    <Select id={`${id}-minute`} aria-label={tr('Minute')} value={minute} options={choices(60)} placeholder={tr('Minute')} onChange={(event) => onChange?.({ target: { value: `${hour || '09'}:${event.target.value}` } })} className="min-w-0 flex-1" />
  </div></Field>;
}
