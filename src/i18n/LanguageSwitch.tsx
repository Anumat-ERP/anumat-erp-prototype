import { Select } from '@app/ui';
import { useLocale } from './LocaleProvider';
import { isLocale } from './locale';

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <Select
      size="sm"
      aria-label={locale === 'km' ? 'ភាសា' : 'Language'}
      value={locale}
      onChange={(event) => {
        if (isLocale(event.target.value)) setLocale(event.target.value);
      }}
      className="max-w-24 shrink-0"
    >
      <option value="en" lang="en">
        English
      </option>
      <option value="km" lang="km">
        ខ្មែរ
      </option>
    </Select>
  );
}
