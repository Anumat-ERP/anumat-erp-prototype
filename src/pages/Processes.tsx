import { Button, Card, PageHeader, Switch, Text, useToast } from '@repo/ui';
import { ChevronRight, Timer } from 'lucide-react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router';
import { RequestIcon } from '../components/RequestIcon';
import { useStore } from '../data/store';
import { formatMoney } from '../lib/format';

export function Processes() {
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <>
      <PageHeader title="Process Builder" subtitle="Who approves what, and when. Changes apply to new requests." />
      <div className="grid gap-4 md:grid-cols-2">
        {state.processes.map((p) => (
          <Card key={p.id} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <RequestIcon type={p.requestType} />
              <div className="flex min-w-0 flex-1 flex-col">
                <Text as="h2" variant="subtitle">
                  {p.name}
                </Text>
                <Text variant="bodySm" tone="muted">
                  When: {p.trigger.toLowerCase()}
                </Text>
              </div>
              <Switch
                checked={p.active}
                label={p.active ? 'Active' : 'Paused'}
                onCheckedChange={(active) => {
                  dispatch({ type: 'saveProcess', process: { ...p, active } });
                  toast({ title: active ? `${p.name} is active` : `${p.name} is paused`, description: active ? undefined : 'New requests of this type skip approval.' });
                }}
              />
            </div>
            <ol className="flex flex-wrap items-center gap-1.5" aria-label="Steps">
              {p.steps.map((s, i) => (
                <Fragment key={s.id}>
                  {i > 0 ? <ChevronRight aria-hidden className="size-4 text-fg-subtle" /> : null}
                  <li className="rounded-md border border-border bg-surface-muted px-2 py-1 text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-fg-muted">
                      {' '}
                      · {person(s.approverId).name.split(' ')[0]}
                      {s.minAmount !== undefined ? ` · over ${formatMoney(s.minAmount).replace('.00', '')}` : ''}
                    </span>
                  </li>
                </Fragment>
              ))}
            </ol>
            <div className="mt-auto flex items-center justify-between gap-3">
              <Text variant="bodySm" tone="muted" className="flex items-center gap-1.5">
                <Timer aria-hidden className="size-4" />
                {p.runs30d} runs in 30 days · average {p.avgHours < 24 ? `${p.avgHours} h` : `${Math.round(p.avgHours / 24)} days`}
              </Text>
              <Button size="sm" onClick={() => navigate(`/processes/${p.id}`)}>
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
