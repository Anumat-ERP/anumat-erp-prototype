import { Button, Card, CardHeader, PageHeader, Text } from '@app/ui';
import { BookOpen, Bug, Building2, MessageSquare } from 'lucide-react';
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
      <PageHeader title={tr('Help & support')} subtitle={tr("Talk to a person, report a problem, or tell us what to build next.")} />
      <Card className="flex flex-col gap-4">
        <CardHeader title={tr("Contact us")} description={tr("We usually reply fastest on Telegram.")} />
        <ContactChannels />
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <Bug aria-hidden className="size-5 text-muted-foreground" />
          <Text as="h2" variant="subtitle">
            {' '}
            {tr('Report a problem')}{' '}
          </Text>
          <Text tone="muted">{tr("Something broken or confusing? Tell us what happened.")}</Text>
          <Button className="mt-auto h-auto min-h-9 self-start whitespace-normal py-2" onClick={() => setDialog('problem')}>
            {' '}
            {tr('Report a problem')}{' '}
          </Button>
        </Card>
        <Card className="flex flex-col gap-3">
          <MessageSquare aria-hidden className="size-5 text-muted-foreground" />
          <Text as="h2" variant="subtitle">
            {tr("Share feedback")}</Text>
          <Text tone="muted">{tr("Ideas and wishes go straight to the product team.")}</Text>
          <Button className="mt-auto h-auto min-h-9 self-start whitespace-normal py-2" onClick={() => setDialog('feedback')}>
            {' '}
            {tr('Send feedback')}{' '}
          </Button>
        </Card>
        <Card className="flex flex-col gap-3">
          <Building2 aria-hidden className="size-5 text-muted-foreground" />
          <Text as="h2" variant="subtitle">
            {tr("Buying or installing")}</Text>
          <Text tone="muted">{tr("Anumat Cloud, your own cloud, or on-premise.")}</Text>
          <Button className="mt-auto h-auto min-h-9 self-start whitespace-normal py-2" onClick={() => navigate('/pricing')}>
            {tr("See deployment options")}</Button>
        </Card>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <CardHeader title={<span className="flex items-center gap-2"><BookOpen aria-hidden className="size-4" />{tr('Documentation')}</span>} description={tr('Every request becomes a clear decision.')} />
        <Button onClick={() => navigate('/docs')}>{tr('Get started')}</Button>
      </Card>
      <Card tone="muted" className="flex flex-wrap items-center justify-between gap-3">
        <Text>{tr("New here? The 3-minute tour shows how a request goes from ask to decision.")}</Text>
        <Button onClick={tour.start}>{tr("Take the tour")}</Button>
      </Card>
      <FeedbackDialog kind={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
