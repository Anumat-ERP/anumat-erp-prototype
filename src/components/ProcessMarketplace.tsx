import { Button, Field, Input, Text, useToast } from '@repo/ui';
import { Search, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { instantiatePreset, processPresets } from '../data/processPresets';
import { canBuildProcesses, uid, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { formatMoney } from '../lib/format';

export function ProcessMarketplace() {
  const { t: tr } = useLocale();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [selected, setSelected] = useState<string>();
  const [approvers, setApprovers] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const builder = canBuildProcesses(state);
  const results = processPresets.filter(
    (p) =>
      (category === 'All categories' || category === p.category) &&
      `${p.name} ${tr(p.name)} ${p.description} ${tr(p.description)} ${p.category} ${tr(p.category)}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const preset = processPresets.find((p) => p.id === selected);
  const add = () => {
    if (!preset || !builder) return;
    if (preset.steps.some((_, i) => !state.people.some((p) => p.id === approvers[i]))) {
      setError(true);
      return;
    }
    const process = instantiatePreset(preset, approvers, state.processes, () => uid('preset'), tr);
    dispatch({ type: 'createProcess', process });
    toast({ title: tr('Preset added'), description: tr('Your process is paused. Review it before enabling it.') });
    navigate(`/processes/${process.id}`);
  };
  return (
    <section aria-label={tr('Preset marketplace')} className="flex flex-col gap-6">
      <div>
        <Text as="h2" variant="heading">
          {tr('Start with an approval preset')}
        </Text>
        <Text tone="muted">{tr('Choose a starter preset, assign approvers, then adapt it to your company.')}</Text>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <Field label={tr('Search presets')}>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr('Search by name or purpose…')} />
        </Field>
        <Field label={tr('Category')}>
          <select
            className="h-10 w-full rounded-md border border-border-input bg-surface px-3 text-fg focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={tr('Category')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {['All categories', 'Finance', 'People', 'Operations', 'Legal'].map((value) => (
              <option key={value} value={value}>
                {tr(value)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Text variant="bodySm" tone="muted" role="status">
        {tr('{count} presets found', { count: results.length })}
      </Text>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {results.length ? (
            <ul className="divide-y divide-border">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={selected === p.id}
                    onClick={() => {
                      setSelected(p.id);
                      setApprovers(p.steps.map(() => ''));
                      setError(false);
                    }}
                    className={`flex w-full gap-3 p-4 text-start hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${selected === p.id ? 'bg-surface-selected' : ''}`}
                  >
                    <Workflow aria-hidden className="mt-1 size-5 shrink-0 text-fg-link" />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-semibold text-fg">{tr(p.name)}</span>
                      <span className="text-sm text-fg-muted">{tr(p.description)}</span>
                      <span className="text-sm text-fg-subtle">
                        {tr(p.category)} · {tr('{count} approval steps', { count: p.steps.length })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-3 p-6">
              <Search aria-hidden className="size-5 text-fg-muted" />
              <Text>{tr('No presets match your search.')}</Text>
              <Button
                onClick={() => {
                  setQuery('');
                  setCategory('All categories');
                }}
              >
                {tr('Clear filters')}
              </Button>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-surface p-5" aria-label={tr('Preset preview')}>
          {preset ? (
            <div className="flex flex-col gap-5">
              <div>
                <Text as="h3" variant="heading">
                  {tr(preset.name)}
                </Text>
                <Text tone="muted">{tr(preset.description)}</Text>
              </div>
              <div>
                <Text as="h4" variant="subtitle">
                  {tr('Request form')}
                </Text>
                <Text variant="bodySm" tone="muted">
                  {tr('Title, department, description and attachments are included.')}
                  {preset.hasAmount ? ` ${tr('Includes an amount in USD.')}` : ''}
                </Text>
                <ul className="mt-2 list-disc ps-5 text-sm text-fg">
                  {preset.fields.map((field) => (
                    <li key={field.label}>
                      {tr(field.label)} · {tr('Required')}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <Text as="h4" variant="subtitle">
                  {tr('Approval steps')}
                </Text>
                <Text variant="bodySm" tone="muted">
                  {tr('Starter rules are examples. Review amounts and deadlines for your company.')}
                </Text>
                {preset.steps.map((step, i) => (
                  <Field
                    key={`${preset.id}-${i}`}
                    label={`${i + 1}. ${tr(step.name)}`}
                    required
                    helpText={`${tr('Target: {hours} hours', { hours: step.slaHours })} · ${step.minAmount === undefined ? tr('Every request') : tr('Amounts over {amount}', { amount: formatMoney(step.minAmount) })}`}
                    error={error && !approvers[i] ? tr('Choose an approver.') : undefined}
                  >
                    <select
                      aria-label={`${i + 1}. ${tr(step.name)}`}
                      aria-required="true"
                      aria-invalid={error && !approvers[i] ? true : undefined}
                      value={approvers[i] ?? ''}
                      disabled={!builder}
                      onChange={(e) => setApprovers((values) => values.map((value, index) => (index === i ? e.target.value : value)))}
                      className="h-10 w-full rounded-md border border-border-input bg-surface px-3 text-fg focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
                    >
                      <option value="">{tr('Choose an approver…')}</option>
                      {state.people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.role}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
              </div>
              <Text variant="bodySm" tone="muted">
                {builder ? tr('Added as a paused process. Your existing processes stay unchanged.') : tr('Ask an admin for permission to create processes.')}
              </Text>
              <Button variant="primary" disabled={!builder} onClick={add}>
                {tr('Use this preset')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 py-8">
              <Workflow aria-hidden className="size-7 text-fg-link" />
              <Text as="h3" variant="subtitle">
                {tr('Select a preset to preview')}
              </Text>
              <Text tone="muted">{tr('See its form fields and approval rules before adding it.')}</Text>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
