import { ProcessMarketplace } from '../components/ProcessMarketplace';
import { Button, Card, PageHeader, Switch, Tabs, TabsList, TabsTrigger, Text, useToast } from '@app/ui';
import { ChevronRight, Timer } from 'lucide-react';
import { Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { RequestIcon } from '../components/RequestIcon';
import { canBuildProcesses, uid, useStore } from '../data/store';
import type { Process } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { formatMoney } from '../lib/format';

/** A two-letter ID prefix no other request type uses: NR, then NA, NB… */
function freePrefix(processes: Process[]) {
  const used = new Set(['PR', 'LV', 'EX', 'CT', ...processes.map((p) => (p.prefix ?? '').toUpperCase())]);
  const candidates = ['NR', ...'ABCDEFGHIJKLMOPQSTUVWXYZ'.split('').map((c) => `N${c}`)];
  return candidates.find((c) => !used.has(c)) ?? 'NZ';
}

export function Processes() {
  const { t: tr } = useLocale();
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const marketplace = params.get('tab') === 'marketplace';
  const { toast } = useToast();
  const builder = canBuildProcesses(state);
  const create = () => {
    const id = uid('proc');
    dispatch({
      type: 'createProcess',
      process: {
        id,
        name: 'New request type',
        requestType: id,
        prefix: freePrefix(state.processes),
        hasAmount: true,
        fields: [],
        submitters: [],
        trigger: 'A request of this type is submitted',
        active: true,
        avgHours: 0,
        runs30d: 0,
        steps: [
          {
            id: uid('step'),
            name: 'Manager review',
            role: 'Requester’s manager',
            approverId: 'dara',
            slaHours: 24,
          },
        ],
      },
    });
    toast({
      title: tr('Process created'),
      description: tr('Name it, add fields and steps, then save.'),
    });
    navigate(`/processes/${id}`);
  };

  return (
    <>
      <PageHeader
        title={tr('Process Builder')}
        subtitle={tr('Who approves what, and when. Changes apply to new requests.')}
        primaryAction={builder ? { content: tr('New process'), onAction: create } : undefined}
      />
      <Tabs value={marketplace ? 'marketplace' : 'processes'} onValueChange={(value) => setParams(value === 'marketplace' ? { tab: value } : {})}>
        <TabsList aria-label={tr('Approval processes')}>
          <TabsTrigger value="processes">{tr('Your processes')}</TabsTrigger>
          <TabsTrigger value="marketplace">{tr('Preset marketplace')}</TabsTrigger>
        </TabsList>
      </Tabs>
      {marketplace ? (
        <ProcessMarketplace />
      ) : (
        <>
          {!builder ? (
            <Text tone="muted">{tr("You can view processes. Admins, and people they allow under People & roles, can create and change them.")}</Text>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {state.processes.map((p) => (
              <Card key={p.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <RequestIcon type={p.requestType} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Text as="h2" variant="subtitle">
                      {tr(p.name)}
                    </Text>
                    <Text variant="bodySm" tone="muted">
                      {tr("When:")}{' '}{tr(p.trigger).toLowerCase()}
                    </Text>
                  </div>
                  <Switch
                    disabled={!builder}
                    checked={p.active}
                    label={p.active ? tr('Active') : tr('Paused')}
                    onCheckedChange={(active) => {
                      dispatch({ type: 'saveProcess', process: { ...p, active } });
                      toast({
                        title: tr(active ? '{process} is active' : '{process} is paused', { process: tr(p.name) }),
                        description: active ? undefined : tr('New requests of this type skip approval.'),
                      });
                    }}
                  />
                </div>
                <ol className="flex flex-wrap items-center gap-1.5" aria-label={tr('Steps')}>
                  {p.steps.map((s, i) => (
                    <Fragment key={s.id}>
                      {i > 0 ? <ChevronRight aria-hidden className="size-4 text-fg-subtle" /> : null}
                      <li className="rounded-md border border-border bg-surface-muted px-2 py-1 text-sm">
                        <span className="font-medium">{tr(s.name)}</span>
                        <span className="text-fg-muted">
                          {' '}
                          · {person(s.approverId).name.split(' ')[0]}
                          {s.minAmount !== undefined ? ` · ${tr('over {amount}', { amount: formatMoney(s.minAmount).replace('.00', '') })}` : ''}
                        </span>
                      </li>
                    </Fragment>
                  ))}
                </ol>
                <Text variant="bodySm" tone="muted">
                  {p.submitters?.length ? tr("Submitted by {value0}", { value0: p.submitters.join(', ') }) : tr('Anyone can submit')}
                  {p.fields?.length ? ` · ${tr(p.fields.length === 1 ? '{count} extra field' : '{count} extra fields', { count: p.fields.length })}` : ''}
                </Text>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <Text variant="bodySm" tone="muted" className="flex items-center gap-1.5">
                    <Timer aria-hidden className="size-4" />
                    {p.runs30d} {tr("runs in 30 days · average")}{' '}{p.avgHours < 24 ? tr("{value0} h", { value0: p.avgHours }) : tr("{value0} days", { value0: Math.round(p.avgHours / 24) })}
                  </Text>
                  <Button size="sm" onClick={() => navigate(`/processes/${p.id}`)}>
                    {builder ? tr('Edit') : tr('View')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
