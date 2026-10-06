import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, type DayPickerProps, type DropdownProps } from 'react-day-picker';
import { enUS, km } from 'react-day-picker/locale';
import type { ChangeEvent } from 'react';
import { useLocale } from '../../i18n/LocaleProvider';
import { cn } from '../lib/cn';
import { Select } from './select';
import { Field } from './field';
import 'react-day-picker/style.css';
import '../styles/calendar.css';

function CalendarDropdown({ options, value, onChange, disabled, 'aria-label': label }: DropdownProps) {
  return <Field label={label ?? ''} labelHidden><Select size="sm" required={false} disabled={disabled} value={String(value)} aria-label={label} options={(options ?? []).map((option) => ({ ...option, value: String(option.value) }))} onChange={(event) => onChange?.(event as ChangeEvent<HTMLSelectElement>)} /></Field>;
}

/** Shared calendar; DayPicker preserves day-grid keyboard navigation and focus. */
export function Calendar({ className, ...props }: DayPickerProps) {
  const { locale, t: tr } = useLocale();
  return <DayPicker locale={locale === 'km' ? km : enUS} weekStartsOn={1} captionLayout="dropdown" navLayout="around" showOutsideDays fixedWeeks
    className={cn('an-calendar', className)}
    labels={{ labelMonthDropdown: () => tr('Month'), labelYearDropdown: () => tr('Year'), labelNext: () => tr('Next month'), labelPrevious: () => tr('Previous month') }}
    components={{ Dropdown: CalendarDropdown, Chevron: ({ orientation }) => orientation === 'left' ? <ChevronLeft aria-hidden size={16} /> : <ChevronRight aria-hidden size={16} /> }} {...props} />;
}
