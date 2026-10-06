import { APP_CATALOG, APP_GROUPS } from '../lib/appCatalog';
import { isWorkspaceApp } from '../lib/moduleEntry';
import { HR_MODULES, COLLECTION_NAMES } from '../hr/catalog';
import { HR_APPS, COLLECTION_APP } from '../hr/types';
import { visibleRecords, hrState } from '../hr/engine';
import { APP_NAMES } from '../lib/appAccess';
import { Input, Kbd, Modal, cn } from '@app/ui';
import {
  ArrowRight,
  CornerDownLeft,
  FileText,
  Search,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { appRole, appPeople, canContributeToApp } from '../lib/appAccess';
import { appFromRoute, resolveWorkspaceApp } from '../lib/moduleEntry';
import { useLocation, useNavigate } from 'react-router';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { typeName } from '../lib/format';

interface Item {
  id: string;
  group:
    | 'Go to'
    | 'Create'
    | 'Tasks'
    | 'Requests'
    | 'Surveys'
    | 'Meetings'
    | 'People'
    | 'HR records'
    | 'Apps';
  label: string;
  hint?: string;
  href: string;
  icon: ReactNode;
  /** Extra words that should match, e.g. the request ID. */
  keywords?: string;
}

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform);
export const commandKey = isMac ? '⌘' : 'Ctrl';

/**
 * Search or jump anywhere: pages, requests, surveys, meetings and people.
 * Opens with ⌘K / Ctrl+K from anywhere, or the search button in the top bar.
 * A combobox: arrow keys move, Enter opens, Escape closes.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t: tr } = useLocale();
  const { state, activeWorkspace } = useStore();
  const { pathname, search } = useLocation();
  const app = resolveWorkspaceApp(pathname, search, activeWorkspace);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (label: string, href: string, keywords = ''): Item => ({
      id: `go-${href}`,
      group: 'Go to',
      label,
      href,
      icon: <ArrowRight />,
      keywords,
    });
    return [
      go(tr('Home'), '/home'),
      go(tr('Explore modules'), '/discover'),
      go(tr('My work'), '/work'),
      go(tr('Company settings'), '/settings/company'),
      go(tr('Workspace data'), '/settings/data'),
      go(tr('Delivery previews'), '/settings/delivery'),
      ...APP_GROUPS.flatMap(group => group.apps.map(candidate => {
        const guide = APP_CATALOG[candidate];
        const Icon = guide.icon;
        return { id: `app-${candidate}`, group: 'Apps' as const, label: tr(guide.title), hint: tr(group.title), href: `/home?app=${candidate}`, icon: <Icon />, keywords: [guide.description, ...guide.steps.flatMap(step => [step.title, step.text])].map(text => tr(text)).join(' ') };
      })),
      go(tr('Requests'), '/requests'),
      go(tr('Approvals'), '/approvals', 'waiting decide'),
      go(tr('Insights'), '/insights', 'reports charts'),
      go(tr('Approval processes'), '/processes', 'workflow approval route'),
      go(
        tr('People & roles'),
        app ? `/${app}/people` : '/settings/people',
        'team members permissions',
      ),
      ...HR_APPS.map((module) => go(tr(APP_NAMES[module]), `/${module}`)),
      ...HR_APPS.flatMap((module) =>
        HR_MODULES[module].collections.flatMap((collection) =>
          visibleRecords(state, collection).map((record) => {
            const value = record as typeof record & {
              name?: string;
              title?: string;
              employeeId?: string;
              department?: string;
            };
            const employee = hrState(state).employees.find(
              (e) => e.id === value.employeeId,
            );
            const Icon = HR_MODULES[module].icon;
            return {
              id: `hr-${collection}-${record.id}`,
              group: 'HR records' as const,
              label: value.name || value.title || employee?.name || record.id,
              hint: tr(COLLECTION_NAMES[collection]),
              href: `/${COLLECTION_APP[collection]}?tab=${collection}&record=${record.id}`,
              icon: <Icon />,
              keywords: `${record.id} ${value.department ?? ''}`,
            };
          }),
        ),
      ),
      go(
        tr('Notification settings'),
        '/settings/notifications',
        'telegram email',
      ),
      {
        id: 'new-request',
        group: 'Create',
        label: tr('New request'),
        href: '/requests/new',
        icon: <FileText />,
        keywords: 'purchase leave expense',
      },
      ...state.tasks.map(task => ({id:`task-${task.id}`,group:'Tasks' as const,label:task.title,hint:state.people.find(p=>p.id===task.ownerId)?.name,href:`/tasks?task=${encodeURIComponent(task.id)}`,icon:<FileText />,keywords:task.id})),
      ...state.meetings.map(meeting => ({id:`meeting-${meeting.id}`,group:'Meetings' as const,label:meeting.title,href:`/meetings/${encodeURIComponent(meeting.id)}`,icon:<FileText />,keywords:meeting.location})),
      ...state.surveys.filter(survey=>survey.status!=='draft'||appRole(state,'surveys')==='admin').map(survey=>({id:`survey-${survey.id}`,group:'Surveys' as const,label:survey.title,href:`/surveys/${encodeURIComponent(survey.id)}`,icon:<FileText />,keywords:survey.description})),
      ...state.requests
        .filter((r) => r.status !== 'draft' || r.requesterId === state.meId)
        .map((r) => ({
          id: `r-${r.id}`,
          group: 'Requests' as const,
          label: r.title,
          hint: `${r.id} · ${typeName(r.type, state.processes)}`,
          href: `/requests/${r.id}`,
          icon: <FileText />,
          keywords: `${r.id} ${r.department}`,
        })),
      ...(app ? appPeople(state, app) : []).map((p) => ({
        id: `p-${p.id}`,
        group: 'People' as const,
        label: p.name,
        hint: `${p.role} · ${p.department}`,
        href: app ? `/${app}/people` : '/settings/people',
        icon: <User />,
      })),
    ].filter((item) => {
      const requestedApp = new URLSearchParams(item.href.split('?')[1]).get('app');
      const target = appFromRoute(item.href) ?? (isWorkspaceApp(requestedApp) ? requestedApp : null);
      return (
        (!target || Boolean(appRole(state, target))) &&
        (item.group !== 'Create' ||
          !target ||
          canContributeToApp(state, target))
      );
    }) as Item[];
  }, [state, tr, app]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q)
      return items.filter((i) => i.group === 'Go to' || i.group === 'Create');
    const words = q.split(/\s+/);
    const found = items.filter((i) => {
      const hay =
        `${i.label} ${i.hint ?? ''} ${i.keywords ?? ''}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    // At most 6 per group, so one long list can't bury the rest.
    const perGroup = new Map<string, number>();
    return found.filter((i) => {
      const n = (perGroup.get(i.group) ?? 0) + 1;
      perGroup.set(i.group, n);
      return n <= 6;
    });
  }, [items, q]);

  useEffect(() => setActive(0), [q, open]);
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (item: Item | undefined) => {
    if (!item) return;
    onOpenChange(false);
    setQuery('');
    navigate(item.href);
  };

  let lastGroup = '';
  return (
    <Modal
      open={open}
      onOpenChange={(o) => (onOpenChange(o), o ? undefined : setQuery(''))}
      title={tr('Search')}
      hideTitle
      size="md"
    >
      <div className="-m-2 flex flex-col">
        <div className="flex items-center gap-2 border-b border-border px-2 pb-3">
          <Search aria-hidden className="size-4 shrink-0 text-fg-muted" />
          <Input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={
              results[active] ? `cmd-${results[active].id}` : undefined
            }
            aria-label={tr('Search pages, requests and people')}
            placeholder={tr('Search or jump to…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown')
                (e.preventDefault(),
                  setActive((a) => Math.min(results.length - 1, a + 1)));
              else if (e.key === 'ArrowUp')
                (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
              else if (e.key === 'Enter')
                (e.preventDefault(), choose(results[active]));
            }}
            className="min-w-0 flex-1"
          />
        </div>
        <ul
          id="command-list"
          role="listbox"
          aria-label={tr('Results')}
          ref={listRef}
          className="max-h-[min(24rem,60vh)] overflow-y-auto py-2"
        >
          {results.length === 0 ? (
            <li
              className="px-3 py-6 text-center text-md text-fg-muted"
              role="presentation"
            >
              {tr('Nothing matches “')}
              {query}”.
            </li>
          ) : null}
          {results.map((item, i) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id} role="presentation">
                {heading ? (
                  <div
                    role="presentation"
                    className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-fg-subtle uppercase"
                  >
                    {tr(heading)}
                  </div>
                ) : null}
                <div
                  id={`cmd-${item.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(item)}
                  className={cn(
                    'mx-1 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-md',
                    i === active ? 'bg-surface-selected text-fg' : 'text-fg',
                  )}
                >
                  <span aria-hidden className="text-fg-muted [&_svg]:size-4">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {tr(item.label)}
                  </span>
                  {item.hint ? (
                    <span className="shrink-0 font-mono text-xs text-fg-subtle">
                      {item.hint}
                    </span>
                  ) : null}
                  {i === active ? (
                    <CornerDownLeft
                      aria-hidden
                      className="size-3.5 shrink-0 text-fg-subtle"
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        <div
          aria-hidden
          className="flex items-center gap-4 border-t border-border px-3 pt-3 text-xs text-fg-subtle"
        >
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">↑</Kbd>
            <Kbd size="sm">↓</Kbd> {tr('move')}{' '}
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">↵</Kbd> {tr('open')}{' '}
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd size="sm">{tr('Esc')}</Kbd> {tr('close')}{' '}
          </span>
        </div>
      </div>
    </Modal>
  );
}
