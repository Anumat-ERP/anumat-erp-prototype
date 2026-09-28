import { Avatar, Badge, Banner, Card, CardHeader, PageHeader, Select, Text, useToast } from '@repo/ui';
import { AppLink } from '../components/links';
import { isAdmin, useStore } from '../data/store';
import type { Access } from '../data/types';
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
    can: ['Manage people and roles', 'Edit approval processes and task statuses', 'Change any task'],
  },
  {
    access: 'member',
    name: 'Member',
    can: ['Raise requests, create tasks and meetings', 'Change tasks they own or assigned', 'View everything else in the workspace'],
  },
];

export function People() {
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
      <PageHeader title="People & roles" subtitle={`Who is in ${state.org.name}, and what they can do.`} />

      {!admin ? (
        <Banner tone="info" title="Only admins can change roles">
          You’re a member. Ask an admin, like {state.people.find((p) => p.access === 'owner')?.name}, if someone needs a different role.
        </Banner>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => (
          <Card key={r.access} className="flex flex-col gap-2">
            <Text as="h2" variant="subtitle">
              {r.name}
            </Text>
            <ul className="flex list-disc flex-col gap-1 ps-5 text-md text-fg-muted">
              {r.can.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card flush>
        <div className="p-4 pb-2">
          <CardHeader
            title={`${state.people.length} people`}
            description={
              <>
                Approving isn’t a role: it comes from the steps in <AppLink to="/processes">Process Builder</AppLink>, so it follows your
                org chart.
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
                      {p.id === me.id ? <span className="font-regular text-fg-muted"> (you)</span> : null}
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
                {p.access === 'owner' ? (
                  <Badge tone="primary" className="w-36 justify-center">
                    Owner
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
                      toast({ title: `${p.name} is now ${access === 'admin' ? 'an admin' : 'a member'}` });
                    }}
                    options={[
                      { value: 'admin', label: 'Admin' },
                      { value: 'member', label: 'Member' },
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
        You can’t change your own role. Ownership transfer isn’t in this prototype.
      </Text>
    </>
  );
}
