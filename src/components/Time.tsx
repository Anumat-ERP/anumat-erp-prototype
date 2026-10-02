import { useLocale } from '../i18n/LocaleProvider';
import { intlLocale, type Locale } from '../i18n/locale';
import { formatRelative } from '../lib/format';

const exact = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleString(intlLocale(locale), {
    timeZone: 'Asia/Phnom_Penh',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** "2 days ago", with the exact date and time on hover and for assistive tech. */
export function Time({ iso, className }: { iso: string; className?: string }) {
  const { locale } = useLocale();
  return (
    <time dateTime={iso} title={exact(iso, locale)} className={className}>
      {formatRelative(iso, locale)}
    </time>
  );
}
