import { Badge, Card, Checkbox, PageHeader, Select, Switch, Text } from '@repo/ui';
import { useState } from 'react';
import { AppLink } from '../components/links';
import { Person } from '../components/Person';
import { useStore } from '../data/store';
import type { TaskStatus } from '../data/types';
import { daysUntil, formatShortDate, taskStatus } from '../lib/format';

const COLUMNS: TaskStatus[] = ['todo', 'doing', 'done'];

export function Tasks() {
  const { state, me, dispatch } = useStore();
  const [mineOnly, setMineOnly] = useState(false);
  const tasks = state.tasks
    .filter((t) => !mineOnly || t.ownerId === me.id)
    .sort((a, b) => a.due.localeCompare(b.due));

  return (
    <>
      <PageHeader title="Tasks" subtitle="Decisions turned into work, with an owner and a deadline." />
      <Switch checked={mineOnly} onCheckedChange={setMineOnly} label="Only my tasks" />
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = tasks.filter((t) => t.status === col);
          return (
            <section key={col} aria-labelledby={`col-${col}`} className="flex min-w-0 flex-col gap-3 rounded-lg bg-surface-sunken p-3">
              <div className="flex items-center justify-between px-1">
                <Text as="h2" id={`col-${col}`} variant="label">
                  {taskStatus[col].label}
                </Text>
                <Badge size="sm">{list.length}</Badge>
              </div>
              {list.length ? (
                <ul className="flex flex-col gap-2">
                  {list.map((t) => {
                    const d = daysUntil(t.due);
                    const overdue = t.status !== 'done' && d < 0;
                    return (
                      <li key={t.id}>
                        <Card className="flex flex-col gap-3 p-3">
                          <Checkbox
                            checked={t.status === 'done'}
                            onCheckedChange={(c) => dispatch({ type: 'taskStatus', taskId: t.id, status: c === true ? 'done' : 'todo' })}
                            label={<span className={t.status === 'done' ? 'text-fg-muted line-through' : undefined}>{t.title}</span>}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Person id={t.ownerId} size="xs" />
                            {overdue ? (
                              <Badge tone="critical" size="sm">
                                Overdue · {formatShortDate(t.due)}
                              </Badge>
                            ) : (
                              <Text as="span" variant="caption" tone="muted">
                                Due {formatShortDate(t.due)}
                              </Text>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {t.source ? (
                              <span className="text-sm">
                                <AppLink to={t.source.href} tone="muted">
                                  {t.source.label}
                                </AppLink>
                              </span>
                            ) : (
                              <span />
                            )}
                            <Select
                              size="sm"
                              aria-label={`Status of “${t.title}”`}
                              value={t.status}
                              onChange={(e) => dispatch({ type: 'taskStatus', taskId: t.id, status: e.target.value as TaskStatus })}
                              options={COLUMNS.map((s) => ({ value: s, label: taskStatus[s].label }))}
                              className="w-32"
                            />
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Text tone="muted" variant="bodySm" className="px-1 pb-2">
                  {col === 'done' ? 'Nothing finished yet.' : 'Nothing here.'}
                </Text>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
