import { Button, IconButton } from '@app/ui';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Logo } from './Logo';
import { LanguageSwitch } from '../i18n/LanguageSwitch';
import { useLocale } from '../i18n/LocaleProvider';

export function PublicHeader({ setup, progress, onBack }: { setup?: string; progress?: number; onBack?: () => void }) {
  const navigate = useNavigate();
  const { t: tr } = useLocale();
  return <header className={setup ? 'an-setup-header' : 'an-public-header'}>
    <div className="an-public-header-inner">
      {setup ? <IconButton label={tr('Back')} icon={<ArrowLeft />} onClick={onBack ?? (() => navigate('/'))} /> :
        <Link to="/" aria-label={tr('Anumat home')}><Logo className="h-8 w-auto" /></Link>}
      {setup ? <span className="an-setup-header-title">{setup}</span> : <nav aria-label="Main navigation" className="an-public-nav">
        <Link to="/#product">{tr('Product')}</Link><Link to="/#how">{tr('How it works')}</Link><Link to="/pricing">{tr('Pricing & deployment')}</Link>
      </nav>}
      <div className="ms-auto flex items-center gap-2 sm:gap-4">
        <Link to={setup === tr('Sign in') ? '/welcome' : '/signin'} className="hidden text-sm font-medium text-fg-link sm:inline">{setup === tr('Sign in') ? tr('Create a workspace') : tr('Sign in')}</Link>
        <LanguageSwitch />
        {!setup ? <Button variant="primary" asChild className="an-header-cta"><Link to="/welcome">{tr('Create a workspace')}</Link></Button> : null}
      </div>
    </div>
    {progress !== undefined ? <div className="an-setup-progress" role="progressbar" aria-label={tr('Set up account')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div> : null}
  </header>;
}
