import { Badge, Banner, Drawer, EmptyState, Field, Input, Select, Text, cn, useToast } from '@app/ui';
import { Check, ChevronRight, Laptop, Megaphone, Scale, Search, Truck, UsersRound, Wallet, type LucideIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { PRESET_CATEGORIES, instantiatePreset, isPresetInstalled, processPresets, suggestApprover, type PresetCategory, type ProcessPreset } from '../data/processPresets';
import { canBuildProcesses, uid, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { formatMoney } from '../lib/format';

const CATEGORY: Record<PresetCategory, { icon: LucideIcon; tile: string }> = {
  Finance: { icon: Wallet, tile: 'bg-mint-subtle text-mint-subtle-foreground' },
  People: { icon: UsersRound, tile: 'bg-warning-subtle text-warning-subtle-fg' },
  Operations: { icon: Truck, tile: 'bg-muted text-foreground' },
  IT: { icon: Laptop, tile: 'bg-muted text-foreground' },
  Legal: { icon: Scale, tile: 'bg-muted text-foreground' },
  Marketing: { icon: Megaphone, tile: 'bg-muted text-foreground' },
};

const shortMoney = (n: number) => formatMoney(n).replace('.00', '');

/** "Every request" or "Over $10,000": when a template step runs. */
function stepCondition(step: ProcessPreset['steps'][number], tr: (s: string, v?: Record<string, string | number>) => string) {
  return step.minAmount === undefined ? tr('Every request') : tr('Over {amount}', { amount: shortMoney(step.minAmount) });
}

/**
 * Ready-made approval processes. Browse by category, open one to see its
 * route with approvers already suggested, and add it as a paused process.
 */
export function ProcessMarketplace() {
  const { t: tr } = useLocale();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PresetCategory | 'All'>('All');
  const [open, setOpen] = useState<ProcessPreset>();
  const [approvers, setApprovers] = useState<string[]>([]);
  const builder = canBuildProcesses(state);

  const matchesQuery = (p: ProcessPreset) =>
    `${p.name} ${tr(p.name)} ${p.description} ${tr(p.description)} ${p.category} ${tr(p.category)}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  const searched = processPresets.filter(matchesQuery);
  const results = searched.filter((p) => category === 'All' || p.category === category);

  const show = (preset: ProcessPreset) => {
    setOpen(preset);
    setApprovers(preset.steps.map((step) => suggestApprover(step, state.people, state.meId)));
  };
  const add = () => {
    if (!open || !builder) return;
    const process = instantiatePreset(open, approvers, state.processes, () => uid('preset'), tr);
    dispatch({ type: 'createProcess', process });
    toast({ title: tr('{name} added', { name: tr(open.name) }), description: tr('It’s paused. Check the route, then turn it on.') });
    setOpen(undefined);
    navigate(`/processes/${process.id}`);
  };
  const existing = open ? state.processes.find((p) => p.presetId === open.id || p.requestType === open.id) : undefined;

  if (processPresets.length === 0) {
    return <EmptyState
      size="card"
      heading={tr('No templates available')}
      action={<button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => navigate('/processes')}>{tr('Your processes')}</button>}
    >{tr('Create an approval process from scratch to start accepting requests.')}</EmptyState>;
  }

  return (
    <section aria-labelledby="templates-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="templates-title" className="text-lg font-semibold">{tr('Start from a template')}</h2>
        <Text tone="muted" className="text-sm">
          {tr('Ready-made approval routes for common requests. Approvers are suggested from your team; change anything after adding.')}
        </Text>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Field label={tr('Search templates')} labelHidden className="md:w-72">
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr('Search templates…')} />
        </Field>
        <div role="group" aria-label={tr('Categories')} className="flex flex-wrap gap-1.5">
          {(['All', ...PRESET_CATEGORIES] as const).map((c) => {
            const count = c === 'All' ? searched.length : searched.filter((p) => p.category === c).length;
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted',
                )}
              >
                {tr(c)}
                <span className={cn('tabular-nums text-xs', active ? 'opacity-80' : 'text-muted-foreground')}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p role="status" className="sr-only">{tr('{count} templates', { count: results.length })}</p>

      {results.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => {
            const { icon: Icon, tile } = CATEGORY[p.category];
            const installed = isPresetInstalled(p, state.processes);
            return (
              <li key={p.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => show(p)}
                  className="group flex h-full w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-start shadow-card transition-colors hover:border-input hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex w-full items-start gap-3">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-semibold text-foreground">{tr(p.name)}</span>
                      <span className="line-clamp-2 text-sm text-muted-foreground">{tr(p.description)}</span>
                    </span>
                    <span aria-hidden className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4', tile)}>
                      <Icon />
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    {p.steps.map((s, i) => (
                      <Fragment key={i}>
                        {i > 0 ? <ChevronRight aria-hidden className="size-3" /> : null}
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-foreground">
                          {tr(s.name)}
                          {s.minAmount !== undefined ? <span className="text-muted-foreground"> · {tr('over {amount}', { amount: shortMoney(s.minAmount) })}</span> : null}
                        </span>
                      </Fragment>
                    ))}
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                    <span>{tr(p.category)} · {tr(p.fields.length === 1 ? '{count} form question' : '{count} form questions', { count: p.fields.length })}</span>
                    {installed ? (
                      <Badge size="sm" tone="success">
                        <Check aria-hidden className="size-3" />
                        {tr('Added')}
                      </Badge>
                    ) : (
                      <span className="font-medium text-foreground group-hover:underline">{tr('Preview')}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          size="card"
          headingAs="h3"
          heading={tr('No templates match')}
          image={<Search aria-hidden className="size-6 text-muted-foreground" />}
          action={
            <button
              type="button"
              onClick={() => (setQuery(''), setCategory('All'))}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {tr('Clear search and filters')}
            </button>
          }
        >
          {tr('Try another word, or start a process from scratch with New process.')}
        </EmptyState>
      )}

      <Drawer
        open={Boolean(open)}
        onOpenChange={(next) => (next ? undefined : setOpen(undefined))}
        title={open ? tr(open.name) : ''}
        description={open ? tr(open.description) : undefined}
        size="md"
        primaryAction={{ content: tr('Use template'), onAction: add, disabled: !builder }}
        footer={
          <Text variant="caption" tone="muted" className="me-auto max-w-56">
            {builder ? tr('Added paused, so nothing changes until you turn it on.') : tr('Ask an admin for permission to create processes.')}
          </Text>
        }
      >
        {open ? (
          <div className="flex flex-col gap-6">
            {existing ? (
              <Banner
                tone="info"
                title={tr('You already have this process')}
                action={{ label: tr('Open {name}', { name: tr(existing.name) }), onAction: () => (setOpen(undefined), navigate(`/processes/${existing.id}`)) }}
              >
                {tr('Adding it again creates a separate copy.')}
              </Banner>
            ) : null}
            <section aria-labelledby="template-route" className="flex flex-col gap-3">
              <h3 id="template-route" className="text-sm font-semibold">{tr('Route')}</h3>
              <ol aria-label={tr('Route')} className="flex flex-col">
                {open.steps.map((step, i) => (
                  <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < open.steps.length - 1 ? <span aria-hidden className="absolute start-3.5 top-8 bottom-1 w-px bg-border" /> : null}
                    <span aria-hidden className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-medium">{tr(step.name)}</span>
                        <span className="text-xs text-muted-foreground">
                          {stepCondition(step, tr)} · {tr('reply within {hours} h', { hours: step.slaHours })}
                        </span>
                      </div>
                      <Select
                        aria-label={`${i + 1}. ${tr(step.name)}: ${tr('approver')}`}
                        value={approvers[i] ?? ''}
                        disabled={!builder}
                        onChange={(e) => setApprovers((values) => values.map((v, j) => (j === i ? e.target.value : v)))}
                        options={state.people.map((p) => ({ value: p.id, label: `${p.name} · ${tr(p.role)}` }))}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section aria-labelledby="template-form" className="flex flex-col gap-2 border-t border-border pt-5">
              <h3 id="template-form" className="text-sm font-semibold">{tr('Request form')}</h3>
              <Text variant="bodySm" tone="muted">
                {tr('Title, description and attachments are always included.')}
                {open.hasAmount ? ` ${tr('Includes an amount in USD.')}` : ''}
              </Text>
              <ul className="flex flex-wrap gap-1.5">
                {open.fields.map((f) => (
                  <li key={f.label} className="rounded-md border border-border px-2 py-1 text-sm">{tr(f.label)}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </Drawer>
    </section>
  );
}
