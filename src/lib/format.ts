import type { BadgeTone } from '@app/ui';
import type { DocumentStatus, Process, RequestStatus, RequestType, StepStatus } from '../data/types';
import { intlLocale, isLocale, type Locale } from '../i18n/locale';

/** Dates follow the interface language; LocaleProvider keeps <html lang> current. */
const dateLocale = () => intlLocale(typeof document !== 'undefined' && isLocale(document.documentElement.lang) ? document.documentElement.lang : 'en');

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
export const formatMoney = (n?: number) => (n === undefined ? '—' : money.format(n));

const displayLocale = (): Locale => {
  try {
    return localStorage.getItem('anumat-locale') === 'km' ? 'km' : 'en';
  } catch {
    return typeof document !== 'undefined' && document.documentElement.lang === 'km' ? 'km' : 'en';
  }
};
const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const khmerWeekdays = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

export const formatDate = (iso: string, locale: Locale = displayLocale()) => locale === 'km'
  ? `${new Date(iso).getDate()} ${khmerMonths[new Date(iso).getMonth()]} ${new Date(iso).getFullYear()}`
  : new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatShortDate = (iso: string, locale: Locale = displayLocale()) => locale === 'km'
  ? `${new Date(iso).getDate()} ${khmerMonths[new Date(iso).getMonth()]}`
  : new Date(iso).toLocaleDateString(intlLocale(locale), { day: 'numeric', month: 'short' });

export const formatTime = (iso: string, locale: Locale = displayLocale()) => locale === 'km'
  ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  : new Date(iso).toLocaleTimeString(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatDateTime = (iso: string, locale: Locale = displayLocale()) => `${formatShortDate(iso, locale)}, ${formatTime(iso, locale)}`;

export const formatWeekday = (iso: string, locale: Locale = displayLocale()) => locale === 'km'
  ? `${khmerWeekdays[new Date(iso).getDay()]} ${formatShortDate(iso, locale)}`
  : new Date(iso).toLocaleDateString(intlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/** “3 hours ago”, “in 2 days”. */
export function formatRelative(iso: string, locale: Locale = displayLocale()) {
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), {
    numeric: 'auto',
  });
  const relative = (value: number, unit: Intl.RelativeTimeFormatUnit) => {
    if (locale !== 'km') return rtf.format(value, unit);
    if (value === 0) return 'ឥឡូវនេះ';
    const label = unit === 'minute' ? 'នាទី' : unit === 'hour' ? 'ម៉ោង' : 'ថ្ងៃ';
    return value < 0 ? `${Math.abs(value)} ${label}មុន` : `ក្នុងរយៈពេល ${value} ${label}`;
  };
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < hour) return relative(Math.round(diff / minute), 'minute');
  if (abs < day) return relative(Math.round(diff / hour), 'hour');
  return relative(Math.round(diff / day), 'day');
}

/** Whole days from today to the date (negative = overdue). */
export function daysUntil(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export const typeLabel: Record<string, string> = {
  purchase: 'Purchase',
  leave: 'Leave',
  expense: 'Expense',
  contract: 'Contract',
};

export const requestStatus: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'To do', tone: 'neutral' },
  pending: { label: 'In review', tone: 'warning' },
  changes: { label: 'Changes requested', tone: 'critical' },
  approved: { label: 'Approved', tone: 'success' },
  declined: { label: 'Declined', tone: 'critical' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
};

export const stepStatus: Record<StepStatus, string> = {
  done: 'Approved',
  current: 'Waiting',
  waiting: 'Not started',
  returned: 'Changes requested',
  declined: 'Declined',
};

export const docStatus: Record<DocumentStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  review: { label: 'In review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export function formatBytesShort(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

/** A request type's name: the built-in label, or the name of the process that defines it. */
export function typeName(type: RequestType, processes: Process[]) {
  return typeLabel[type] ?? processes.find((p) => p.requestType === type)?.name ?? 'Request';
}

export const isBuiltInType = (type: RequestType) => type in typeLabel;
