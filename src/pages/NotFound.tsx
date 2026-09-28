import { Button, EmptyState } from '@repo/ui';
import { useNavigate } from 'react-router';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState heading="Page not found" action={<Button onClick={() => navigate('/')}>Go to Home</Button>}>
      The link may be wrong, or the page has moved.
    </EmptyState>
  );
}
