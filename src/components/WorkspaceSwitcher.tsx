import { ActionMenu, useToast } from '@app/ui';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';

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
  const { t: tr } = useLocale();
  const { state, workspaces, activeWorkspace, dispatch } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const current = workspaces.find((w) => w.id === activeWorkspace);
  return (
    <div className="px-4">
      <ActionMenu
        align="start"
        trigger={
          <button
            type="button"
            aria-label={tr("Workspace: {value0}. Switch workspace", { value0: state.org.name })}
            className="flex w-full items-center gap-2.5 rounded-xl bg-surface-muted p-3 text-start hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-sm font-semibold text-primary-subtle-fg">
              {initials(state.org.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-md font-semibold text-fg">{tr(state.org.name)}</span>
              <span className="truncate text-xs text-fg-muted">{current?.access ? ACCESS[current.access] : ''}</span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-fg-subtle" />
          </button>
        }
        sections={[
          {
            title: tr('Your workspaces'),
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
          {
            items: [
              {
                content: tr('Create a workspace'),
                icon: <Plus />,
                onAction: () => navigate('/welcome'),
              },
            ],
          },
        ]}
      />
    </div>
  );
}
