import { Button, Card, Divider, Field, Input, Text, useToast } from '@repo/ui';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Logo } from '../components/Logo';
import { useStore } from '../data/store';

/** Mock sign-in: any valid email works and opens the demo workspace. */
export function SignIn() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const enter = (address: string) => {
    // Sign in as the demo person whose first name matches the address, if any.
    const first = address.split('@')[0]?.split(/[._-]/)[0]?.toLowerCase();
    const match = state.people.find((p) => p.name.split(' ')[0]?.toLowerCase() === first);
    if (match) dispatch({ type: 'switchUser', personId: match.id });
    const who = match ?? state.people.find((p) => p.id === state.meId);
    toast({ title: `Signed in to ${state.org.name}`, description: who ? `As ${who.name}` : undefined });
    navigate('/home');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email you use for work, like name@company.com.');
      return;
    }
    enter(email.trim());
  };

  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg px-4 py-10 text-fg sm:py-16">
      <main id="main-content" tabIndex={-1} className="flex w-full max-w-sm flex-col gap-6 outline-none">
        <Link to="/" aria-label="Anumat home" className="self-center rounded-md text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Logo className="h-8 w-auto" />
        </Link>
        <Card className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1">
            <Text as="h1" variant="heading">
              Sign in
            </Text>
            <Text tone="muted">Welcome back to your workspace.</Text>
          </div>
          <form noValidate onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Work email" error={error}>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                placeholder="name@company.com"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(undefined);
                }}
              />
            </Field>
            <Button type="submit" variant="primary" fullWidth>
              Continue
            </Button>
          </form>
          <Divider label="or" />
          <Button fullWidth onClick={() => enter(`dara@${state.org.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`)}>
            Continue with Google
          </Button>
          <Text variant="bodySm" tone="muted" align="center">
            New to Anumat?{' '}
            <Link to="/welcome" className="font-medium text-fg-link underline underline-offset-2">
              Create a workspace
            </Link>
          </Text>
        </Card>
        <Text variant="caption" tone="subtle" align="center">
          Prototype: any email works. Try alex@, priya@ or sokha@ to sign in as that person.
        </Text>
      </main>
    </div>
  );
}
