import { Button, EmptyState } from '@repo/ui';
import { useNavigate } from 'react-router';
import { useLocale } from '../i18n/LocaleProvider';

export function NotFound() {
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  return (
    <EmptyState heading={tr('Page not found')} action={<Button onClick={() => navigate('/home')}>{tr('Go to Home')}</Button>}>
      {' '}
      {tr('The link may be wrong, or the page has moved.')}{' '}
    </EmptyState>
  );
}
