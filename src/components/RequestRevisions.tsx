import { Card, CardHeader } from '@app/ui';
import type { Request } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { ApprovalTimeline } from './ApprovalTimeline';
export function RequestRevisions({ request }: { request: Request }) {
  const { t: tr } = useLocale();
  if (!request.revisions?.length) return null;
  return (
    <Card>
      <CardHeader
        title={tr('Earlier submissions')}
        description={tr(
          'Each revision preserves its answers, review fields, and decisions.',
        )}
      />
      <div className="mt-4 space-y-3">
        {request.revisions.map((revision, index) => (
          <details
            className="rounded-md border border-border p-3"
            key={`${revision.revision}-${index}`}
          >
            <summary className="cursor-pointer font-medium text-sm">
              {tr('Revision {version}', { version: revision.revision })} ·{' '}
              {revision.title}
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm whitespace-pre-wrap">
                {revision.description}
              </p>
              {revision.amount !== undefined && (
                <p className="text-sm">
                  {tr('Amount')}: {revision.amount}
                </p>
              )}
              <dl className="space-y-2 text-sm">
                {Object.entries(revision.fields).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground">
                      {revision.form.find((f) => f.id === key)?.label ?? key}
                    </dt>
                    <dd>
                      {Array.isArray(value)
                        ? value.join(', ')
                        : String(value ?? '')}
                    </dd>
                  </div>
                ))}
              </dl>
              <ApprovalTimeline steps={revision.steps} />
              {revision.attachments.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {revision.attachments.map((a) => a.name).join(', ')}
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </Card>
  );
}
