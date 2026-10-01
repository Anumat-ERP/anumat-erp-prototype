import { Button, Card, CardHeader, PageHeader, Text } from '@repo/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ContactChannels } from '../components/ContactChannels';
import { useTour } from '../components/DemoTour';
import { FeedbackDialog } from '../components/Feedback';
import { useLocale } from '../i18n/LocaleProvider';

export function Support() {
  const { t: tr } = useLocale();
  const navigate = useNavigate();
  const tour = useTour();
  const [dialog, setDialog] = useState<'feedback' | 'problem' | null>(null);
  return (
    <>
      <PageHeader title={tr('Help & support')} subtitle="Talk to a person, report a problem, or tell us what to build next." />
      <Card className="flex flex-col gap-4">
        <CardHeader title="Contact us" description="We usually reply fastest on Telegram." />
        <ContactChannels />
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-2">
          <Text as="h2" variant="subtitle">
            {' '}
            {tr('Report a problem')}{' '}
          </Text>
          <Text tone="muted">Something broken or confusing? Tell us what happened.</Text>
          <Button className="mt-auto self-start" onClick={() => setDialog('problem')}>
            {' '}
            {tr('Report a problem')}{' '}
          </Button>
        </Card>
        <Card className="flex flex-col gap-2">
          <Text as="h2" variant="subtitle">
            Share feedback
          </Text>
          <Text tone="muted">Ideas and wishes go straight to the product team.</Text>
          <Button className="mt-auto self-start" onClick={() => setDialog('feedback')}>
            {' '}
            {tr('Send feedback')}{' '}
          </Button>
        </Card>
        <Card className="flex flex-col gap-2">
          <Text as="h2" variant="subtitle">
            Buying or installing
          </Text>
          <Text tone="muted">Anumat Cloud, your own cloud, or on-premise.</Text>
          <Button className="mt-auto self-start" onClick={() => navigate('/pricing')}>
            See deployment options
          </Button>
        </Card>
      </div>
      <Card tone="muted" className="flex flex-wrap items-center justify-between gap-3">
        <Text>New here? The 3-minute tour shows how a request goes from ask to decision.</Text>
        <Button onClick={tour.start}>Take the tour</Button>
      </Card>
      <FeedbackDialog kind={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
