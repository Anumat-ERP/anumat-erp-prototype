import { Avatar, Badge, Banner, Card, CardHeader, Checkbox, PageHeader, Select, Text, useToast } from '@repo/ui';
import { AppLink } from '../components/links';
import { isAdmin, useStore } from '../data/store';
import type { Access } from '../data/types';
import { useLocale } from '../i18n/LocaleProvider';
import { formatMoney } from '../lib/format';

const ROLES: { access: Access; name: string; can: string[] }[] = [
  {
    access: 'owner',
    name: 'Owner',
    can: ['Everything an admin can do', 'Billing and deleting the workspace', 'One per workspace'],
  },
  {
    access: 'admin',
    name: 'Admin',
    can: ['Manage people and roles', 'Edit approval processes', 'Review requests assigned to them'],
  },
  {
    access: 'member',
    name: 'Member',
    can: ['Raise and track requests', 'Edit their drafts and returned requests', 'Build processes, if an admin allows it'],
  },
];

export function People() {
  const { t: tr } = useLocale();
  const { state, me, dispatch } = useStore();
  const { toast } = useToast();
  const admin = isAdmin(state);

  /** Where someone approves, from the active approval processes. */
  const approves = (personId: string) =>
    state.processes
      .filter((p) => p.active)
      .flatMap((p) =>
        p.steps
          .filter((s) => s.approverId === personId)
          .map((s) => `${s.name} in ${p.name}${s.minAmount !== undefined ? ` (over ${formatMoney(s.minAmount).replace('.00', '')})` : ''}`),
      );

  return (
    <>
      <PageHeader
        title={tr('People & roles')}
        subtitle={tr('Who is in {company}, and what they can do.', {
          company: state.org.name,
        })}
      />

      {!admin ? (
        <Banner tone="info" title={tr('Only admins can change roles')}>
          You’re a member. Ask an admin, like {state.people.find((p) => p.access === 'owner')?.name}, if someone needs a different role.
        </Banner>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => (
          <Card key={r.access} className="flex flex-col gap-2">
            <Text as="h2" variant="subtitle">
              {tr(r.name)}
            </Text>
            <ul className="flex list-disc flex-col gap-1 ps-5 text-md text-fg-muted">
              {r.can.map((c) => (
                <li key={c}>{tr(c)}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card flush>
        <div className="p-4 pb-2">
          <CardHeader
            title={tr('{count} people', { count: state.people.length })}
            description={
              <>
                {' '}
                {tr('Approving isn’t a role: it comes from the steps in')} <AppLink to="/processes">{tr('Process Builder')}</AppLink>, so it follows your org
                chart.
              </>
            }
          />
        </div>
        <ul className="divide-y divide-border">
          {state.people.map((p) => {
            const where = approves(p.id);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span className="flex min-w-56 flex-1 items-center gap-3">
                  <Avatar name={p.name} size="md" decorative />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">
                      {p.name}
                      {p.id === me.id ? <span className="font-regular text-fg-muted"> {tr('(you)')}</span> : null}
                    </span>
                    <Text as="span" variant="bodySm" tone="muted">
                      {p.role} · {p.department}
                    </Text>
                  </span>
                </span>
                <span className="min-w-56 flex-1 text-sm text-fg-muted">
                  {where.length ? (
                    <>
                      <span className="font-medium text-fg">Approves: </span>
                      {where.join('; ')}
                    </>
                  ) : (
                    'No approval steps'
                  )}
                </span>
                <Checkbox
                  label={tr('Can build processes')}
                  checked={p.access !== 'member' || Boolean(p.canBuildProcesses)}
                  disabled={!admin || p.access !== 'member'}
                  onCheckedChange={(c) => {
                    dispatch({
                      type: 'setBuilder',
                      personId: p.id,
                      on: c === true,
                    });
                    toast({
                      title: c === true ? `${p.name} can now build processes` : `${p.name} can no longer build processes`,
                    });
                  }}
                />
                {p.access === 'owner' ? (
                  <Badge tone="primary" className="w-36 justify-center">
                    {' '}
                    {tr('Owner')}{' '}
                  </Badge>
                ) : (
                  <Select
                    size="sm"
                    aria-label={`Role for ${p.name}`}
                    value={p.access}
                    disabled={!admin || p.id === me.id}
                    onChange={(e) => {
                      const access = e.target.value as Access;
                      dispatch({ type: 'setAccess', personId: p.id, access });
                      toast({
                        title: `${p.name} is now ${access === 'admin' ? 'an admin' : 'a member'}`,
                      });
                    }}
                    options={[
                      { value: 'admin', label: tr('Admin') },
                      { value: 'member', label: tr('Member') },
                    ]}
                    className="w-36"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <Text variant="bodySm" tone="muted">
        {' '}
        {tr('You can’t change your own role. Ownership transfer isn’t in this prototype.')}{' '}
      </Text>
    </>
  );
}
