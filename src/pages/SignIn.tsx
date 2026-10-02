import { Button, Checkbox, CodeInput, Field, FieldError, Input, PasswordInput, Text, useToast } from '@app/ui';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { workspaceEntryPath } from '../lib/moduleEntry';

type Screen = 'login' | 'verify' | 'sso' | 'recover' | 'recovery-preview' | 'reset' | 'reset-done';
const REMEMBERED_EMAIL = 'anumat-demo-email';
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Interactive auth demonstration. Passwords and codes are never stored or sent. */
export function SignIn() {
  const { t: tr } = useLocale();
  const { state, activeWorkspace, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBERED_EMAIL) ?? '');
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem(REMEMBERED_EMAIL)));
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmation?: string; code?: string }>({});
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [screen]);

  const go = (next: Screen) => { setScreen(next); setErrors({}); setPassword(''); setConfirmation(''); setCode(''); };
  const enter = () => {
    const first = email.trim().split('@')[0]?.split(/[._-]/)[0]?.toLowerCase();
    const match = state.people.find(p => p.name.split(' ')[0]?.toLowerCase() === first);
    if (match) dispatch({ type: 'switchUser', personId: match.id });
    if (remember) localStorage.setItem(REMEMBERED_EMAIL, email.trim());
    else localStorage.removeItem(REMEMBERED_EMAIL);
    const who = match ?? state.people.find(p => p.id === state.meId);
    toast({ title: `Signed in to ${state.org.name}`, description: who ? `As ${who.name}` : undefined });
    navigate(workspaceEntryPath(activeWorkspace));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (screen === 'verify') {
      if (code !== '123456') { setErrors({ code: tr('Wrong verification code. Try 123456 for this demo.') }); return; }
      enter(); return;
    }
    if (screen === 'reset') {
      const next = { password: password.length < 8 ? tr('Use at least 8 characters for this demo.') : undefined, confirmation: confirmation !== password ? tr('The passwords do not match. Try again.') : undefined };
      setErrors(next);
      if (!next.password && !next.confirmation) go('reset-done');
      return;
    }
    const next = { email: !validEmail(email) ? tr('Enter the email you use for work, like name@company.com.') : undefined, password: screen === 'login' && !password ? tr('Enter a password. Any password works in this demo.') : undefined };
    setErrors(next);
    if (next.email || next.password) return;
    go(screen === 'recover' ? 'recovery-preview' : 'verify');
  };
  const titles: Record<Screen, string> = {
    login: 'Welcome back!', verify: 'Enter the 6-digit code from your authenticator app', sso: 'Log in with SSO',
    recover: 'Forgot your password?', 'recovery-preview': 'Preview your recovery link', reset: 'Choose a new password', 'reset-done': 'You’re ready to log in',
  };
  const emailField = <Field label={tr('Email address')} labelHidden error={errors.email}>
    <Input required type="email" placeholder={tr('Email address')} autoComplete="username" value={email} onChange={event => { setEmail(event.target.value); setErrors(current => ({ ...current, email: undefined })); }} />
  </Field>;
  const back = <Button variant="plain" icon={<ArrowLeft size={18} />} onClick={() => go('login')}>{tr('Return to login')}</Button>;
  const passwordProps = { showLabel: tr('Show password'), hideLabel: tr('Hide password') };
  return <AuthLayout verification={screen === 'verify'}>
    <header className="an-auth-heading">
      <h1 ref={heading} tabIndex={-1}>{tr(titles[screen])}</h1>
      {screen === 'login' ? <p>{tr("Don't have an account yet?")} <Link to="/welcome">{tr('Sign up now')}</Link></p> : null}
      {screen === 'verify' ? <p>{tr('Use the demo code below to preview account verification.')}</p> : null}
      {screen === 'sso' ? <p>{tr('Enter your work email to preview your company’s sign-in flow.')}</p> : null}
      {screen === 'recover' ? <p>{tr('Enter your email to preview password recovery.')}</p> : null}
      {screen === 'reset' ? <p>{tr('Choose a demo password to try the reset form.')}</p> : null}
    </header>

    {['login', 'sso', 'recover'].includes(screen) ? <form noValidate onSubmit={submit} className="an-auth-form">
      {emailField}
      {screen === 'login' ? <>
        <Field label={tr('Password')} labelHidden error={errors.password}>
          <PasswordInput {...passwordProps} required placeholder={tr('Password')} autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setErrors(current => ({ ...current, password: undefined })); }} />
        </Field>
        <div className="an-auth-options">
          <Checkbox label={tr('Remember me')} checked={remember} onCheckedChange={next => setRemember(next === true)} helpText={undefined} />
          <Button variant="plain" onClick={() => go('recover')}>{tr('Forgot password?')}</Button>
        </div>
      </> : null}
      <div className="an-auth-submit"><Button type="submit" variant="primary">{tr(screen === 'login' ? 'Log in' : screen === 'recover' ? 'Continue' : 'Continue with SSO')}</Button></div>
    </form> : null}

    {screen === 'login' ? <div className="an-auth-alternative"><div className="an-auth-divider"><span>{tr('OR')}</span></div><Button variant="plain" onClick={() => go('sso')}>{tr('Log in with SSO')}</Button></div> : null}
    {screen === 'verify' ? <form noValidate onSubmit={submit} className="an-auth-form">
      <div>
        <CodeInput value={code} onChange={next => { setCode(next); setErrors({}); }} label={tr('Verification code')} digitLabel={n => tr('Digit {number} of 6', { number: n })} invalid={Boolean(errors.code)} describedBy={errors.code ? 'verification-error demo-auth-note' : 'demo-auth-note'} />
        {errors.code ? <FieldError id="verification-error" role="alert" className="mt-3">{errors.code}</FieldError> : null}
      </div>
      <div className="an-auth-alternative"><Button variant="plain" onClick={() => go('recover')}>{tr('Try another way')}</Button></div>
      <div className="an-auth-submit"><Button type="submit" variant="primary">{tr('Verify code')}</Button></div>
    </form> : null}
    {screen === 'recovery-preview' ? <div className="an-auth-message">
      <p>{tr('This prototype sends no email. Open the demo reset form for')} <strong>{email.trim()}</strong>.</p>
      <Button variant="primary" onClick={() => go('reset')}>{tr('Open demo reset link')}</Button>
    </div> : null}
    {screen === 'reset' ? <form noValidate onSubmit={submit} className="an-auth-form">
      <Field label={tr('New password')} error={errors.password}><PasswordInput {...passwordProps} required autoComplete="new-password" value={password} onChange={event => { setPassword(event.target.value); setErrors({}); }} /></Field>
      <Field label={tr('Confirm password')} error={errors.confirmation}><PasswordInput {...passwordProps} required autoComplete="new-password" value={confirmation} onChange={event => { setConfirmation(event.target.value); setErrors({}); }} /></Field>
      <div className="an-auth-submit"><Button type="submit" variant="primary">{tr('Reset password')}</Button></div>
    </form> : null}
    {screen === 'reset-done' ? <div className="an-auth-message"><p>{tr('Reset preview complete. No password was saved; any password still works in this demo.')}</p><Button variant="primary" onClick={() => go('login')}>{tr('Log in')}</Button></div> : null}
    {screen !== 'login' && screen !== 'reset-done' ? <div className="an-auth-back">{back}</div> : null}
    <Text as="p" id="demo-auth-note" variant="caption" tone="muted" align="center" className="an-auth-note">{tr('Demo only. Use any password and code 123456. Remember me saves only your email on this device.')}</Text>
  </AuthLayout>;
}
