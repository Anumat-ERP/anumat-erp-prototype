import { ActionMenu, useToast } from '@repo/ui';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from '../data/store';

const ACCESS = { owner: 'Owner', admin: 'Admin', member: 'Member' } as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Top of the sidebar: which company you're in, and switching between them. */
export function WorkspaceSwitcher() {
  const { state, workspaces, activeWorkspace, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const current = workspaces.find((w) => w.id === activeWorkspace);
  return (
    <div className="px-3 pt-3">
      <ActionMenu
        align="start"
        trigger={
          <button
            type="button"
            aria-label={`Workspace: ${state.org.name}. Switch workspace`}
            className="flex w-full items-center gap-2.5 rounded-md border border-border bg-surface-muted p-2 text-start hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-fg">
              {initials(state.org.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-md font-semibold text-fg">{state.org.name}</span>
              <span className="truncate text-xs text-fg-muted">{current?.access ? ACCESS[current.access] : ''}</span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-fg-subtle" />
          </button>
        }
        sections={[
          {
            title: 'Your workspaces',
            items: workspaces.map((w) => ({
              content: w.name,
              helpText: w.access ? `You’re ${w.access === 'admin' ? 'an admin' : w.access === 'owner' ? 'the owner' : 'a member'}` : undefined,
              icon: w.id === activeWorkspace ? <Check /> : <span aria-hidden className="size-4" />,
              onAction: () => {
                if (w.id === activeWorkspace) return;
                dispatch({ type: 'switchWorkspace', id: w.id });
                navigate('/home');
                toast({ title: `Switched to ${w.name}` });
              },
            })),
          },
          { items: [{ content: 'Create a workspace', icon: <Plus />, onAction: () => navigate('/welcome') }] },
        ]}
      />
    </div>
  );
}
