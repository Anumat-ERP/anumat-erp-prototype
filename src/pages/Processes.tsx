import { Badge, Button, PageHeader, Switch, Tabs, TabsList, TabsTrigger, Text, useToast } from '@app/ui';
import { ChevronRight, LayoutTemplate, Timer } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { ProcessMarketplace } from '../components/ProcessMarketplace';
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

/** "6 h", "1 day", "4 days". */
function duration(hours: number, tr: (s: string, v?: Record<string, string | number>) => string) {
  if (hours < 24) return tr('{value0} h', { value0: hours });
  const days = Math.round(hours / 24);
  return days === 1 ? tr('1 day') : tr('{value0} days', { value0: days });
}

export function Processes() {
  const { t: tr } = useLocale();
  const { state, person, dispatch } = useStore();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [params] = useSearchParams();
  // `#templates` is the sidebar's link; `?tab=marketplace` is the tab's own address.
  const marketplace = params.get('tab') === 'marketplace' || hash === '#templates';
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
        title={tr('Approval processes')}
        subtitle={tr('Who approves what, and when. Changes apply to new requests.')}
        primaryAction={builder ? { content: tr('New process'), onAction: create } : undefined}
      />
      <Tabs
        value={marketplace ? 'marketplace' : 'processes'}
        onValueChange={(value) => navigate(value === 'marketplace' ? '/processes?tab=marketplace' : '/processes', { replace: true })}
      >
        <TabsList aria-label={tr('Approval processes')}>
          <TabsTrigger value="processes" badge={state.processes.length} badgeLabel={tr('{count} processes', { count: state.processes.length })}>
            {tr('Your processes')}
          </TabsTrigger>
          <TabsTrigger value="marketplace">{tr('Templates')}</TabsTrigger>
        </TabsList>
      </Tabs>
      {marketplace ? (
        <ProcessMarketplace />
      ) : (
        <>
          {!builder ? (
            <Text tone="muted">{tr("You can view processes. Admins, and people they allow under People & roles, can create and change them.")}</Text>
          ) : null}
          {state.processes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <h2 className="font-semibold">{tr('No approval processes yet')}</h2>
              <Text tone="muted" className="mt-2">{tr('Create a process to define who reviews new requests.')}</Text>
              {builder ? <Button className="mt-4" onClick={create}>{tr('New process')}</Button> : null}
            </div>
          ) : null}
          <ul className="grid gap-4 md:grid-cols-2">
            {state.processes.map((p) => (
              <li key={p.id} className="min-w-0">
                <article
                  aria-labelledby={`process-${p.id}`}
                  className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <RequestIcon type={p.requestType} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 id={`process-${p.id}`} className="font-semibold">{tr(p.name)}</h2>
                        {p.active ? null : <Badge size="sm" tone="attention" dot>{tr('Paused')}</Badge>}
                      </div>
                      <Text variant="bodySm" tone="muted">
                        {tr('When:')} {tr(p.trigger).toLowerCase()}
                      </Text>
                    </div>
                    <Switch
                      disabled={!builder}
                      checked={p.active}
                      label={tr('Active')}
                      labelHidden
                      aria-label={tr('{process} is on', { process: tr(p.name) })}
                      onCheckedChange={(active) => {
                        dispatch({ type: 'saveProcess', process: { ...p, active } });
                        toast({
                          title: tr(active ? '{process} is active' : '{process} is paused', { process: tr(p.name) }),
                          description: active ? undefined : tr('People can’t raise this request until it’s on again.'),
                        });
                      }}
                    />
                  </div>
                  <ol className="flex flex-wrap items-center gap-1.5" aria-label={tr('Steps')}>
                    {p.steps.map((s, i) => (
                      <Fragment key={s.id}>
                        {i > 0 ? <ChevronRight aria-hidden className="size-4 text-muted-foreground" /> : null}
                        <li className="rounded-md bg-muted px-2 py-1 text-sm">
                          <span className="font-medium">{tr(s.name)}</span>
                          <span className="text-muted-foreground">
                            {' '}
                            · {person(s.approverId).name.split(' ')[0]}
                            {s.minAmount !== undefined ? ` · ${tr('over {amount}', { amount: formatMoney(s.minAmount).replace('.00', '') })}` : ''}
                          </span>
                        </li>
                      </Fragment>
                    ))}
                  </ol>
                  {p.active ? null : (
                    <p className="rounded-md bg-warning-subtle px-3 py-2 text-sm text-warning-subtle-fg">
                      {tr('Paused: people can’t raise this request yet. Review the route, then turn it on.')}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                    <Text variant="bodySm" tone="muted" className="flex items-center gap-1.5">
                      <Timer aria-hidden className="size-4" />
                      {p.runs30d
                        ? tr('{runs} runs in 30 days · {time} on average', { runs: p.runs30d, time: duration(p.avgHours, tr) })
                        : tr('No requests yet')}
                    </Text>
                    <Button size="sm" onClick={() => navigate(`/processes/${p.id}`)}>
                      {builder ? tr('Edit') : tr('View')}
                    </Button>
                  </div>
                </article>
              </li>
            ))}
            {builder && state.processes.length > 0 ? (
              <li className="min-w-0">
                <Link
                  to="/processes?tab=marketplace"
                  className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input p-5 text-center hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <LayoutTemplate aria-hidden className="size-6 text-muted-foreground" />
                  <span className="font-semibold">{tr('Browse templates')}</span>
                  <span className="max-w-64 text-sm text-muted-foreground">
                    {tr('Vendor onboarding, budget, IT access, marketing posts and more, ready to adapt.')}
                  </span>
                </Link>
              </li>
            ) : null}
          </ul>
        </>
      )}
    </>
  );
}
