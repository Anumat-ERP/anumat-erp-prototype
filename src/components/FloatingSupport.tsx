import { ArrowUpRight, Send } from 'lucide-react';
import { CONFIG } from '../config';
import { useLocale } from '../i18n/LocaleProvider';
import { useTour } from './DemoTour';

export function FloatingSupport() {
  const { t } = useLocale();
  const { step } = useTour();

  if (step !== null) return null;

  return (
    <a
      href={CONFIG.support.telegram}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('Support')} · Telegram`}
      title={`${t('Support')} · Telegram`}
      className="floating-support"
    >
      <span className="floating-support__icon">
        <Send aria-hidden="true" className="size-5" />
      </span>
      <span className="floating-support__text">
        <span className="floating-support__label">{t('Support')}</span>
        <span className="floating-support__channel">Telegram</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="floating-support__arrow size-4" />
    </a>
  );
}
