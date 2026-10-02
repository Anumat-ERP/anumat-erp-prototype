import { Avatar, Text } from '@app/ui';
import { useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';

/** Avatar with a name and, optionally, the person's role. */
export function Person({ id, showRole = false, size = 'sm' }: { id: string; showRole?: boolean; size?: 'xs' | 'sm' | 'md' }) {
  const { t: tr } = useLocale();
  const { person, me } = useStore();
  const p = person(id);
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar name={p.name} size={size} decorative />
      <span className="flex min-w-0 flex-col">
        <Text as="span" variant="body" truncate>
          {tr(p.name)}
          {p.id === me.id ? <span className="text-fg-muted"> {tr('(you)')}</span> : null}
        </Text>
        {showRole ? (
          <Text as="span" variant="bodySm" tone="muted" truncate>
            {tr(p.role)}
          </Text>
        ) : null}
      </span>
    </span>
  );
}

/** Overlapping avatars for a group of people. */
export function AvatarGroup({ ids, max = 4 }: { ids: string[]; max?: number }) {
  const { person } = useStore();
  const shown = ids.slice(0, max);
  const names = ids.map((id) => person(id).name).join(', ');
  return (
    <span className="inline-flex items-center" role="img" aria-label={names}>
      {shown.map((id) => (
        <Avatar key={id} name={person(id).name} size="sm" decorative className="-ms-1.5 ring-2 ring-surface first:ms-0" />
      ))}
      {ids.length > max ? <span className="ms-1 text-sm text-fg-muted">+{ids.length - max}</span> : null}
    </span>
  );
}
