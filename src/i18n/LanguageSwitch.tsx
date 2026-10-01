import { useLocale } from './LocaleProvider';
import { isLocale } from './locale';

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <select
      aria-label={locale === 'km' ? 'ភាសា' : 'Language'}
      value={locale}
      onChange={(event) => {
        if (isLocale(event.target.value)) setLocale(event.target.value);
      }}
      className="h-9 max-w-24 shrink-0 rounded-md border border-border-input bg-surface px-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-ring"
    >
      <option value="en" lang="en">
        English
      </option>
      <option value="km" lang="km">
        ខ្មែរ
      </option>
    </select>
  );
}
