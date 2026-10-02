import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { LogoMark } from './Logo';
import { useLocale } from '../i18n/LocaleProvider';

/** Shared, focused form card for login, recovery and verification. */
export function AuthLayout({ children }: { children: ReactNode; verification?: boolean }) {
  const { t } = useLocale();
  return <div className="an-auth">
    <main id="main-content" tabIndex={-1} className="an-auth-main">
      <div className="an-auth-content">
        <Link to="/" className="an-auth-brand" aria-label={t('Anumat home')}><LogoMark className="size-7" /></Link>
        {children}
      </div>
    </main>
  </div>;
}
