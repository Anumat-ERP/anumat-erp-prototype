import { Select, Tag, Text } from '@repo/ui';
import { useId } from 'react';
import { useStore } from '../data/store';

/** Pick several people: removable tags plus an "Add person" menu. */
export function PeoplePicker({
  label,
  value,
  onChange,
  exclude = [],
  disabled = false,
  emptyText = 'Nobody',
}: {
  label: string;
  value: string[];
  onChange: (ids: string[]) => void;
  exclude?: string[];
  disabled?: boolean;
  emptyText?: string;
}) {
  const { state, person } = useStore();
  const id = useId();
  const available = state.people.filter((p) => !value.includes(p.id) && !exclude.includes(p.id));
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
      <span id={id} className="sr-only">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.length === 0 ? (
          <Text as="span" variant="bodySm" tone="muted">
            {emptyText}
          </Text>
        ) : null}
        {value.map((pid) => (
          <Tag
            key={pid}
            disabled={disabled}
            onRemove={disabled ? undefined : () => onChange(value.filter((v) => v !== pid))}
            accessibilityLabel={`Remove ${person(pid).name} from ${label.toLowerCase()}`}
          >
            {person(pid).name}
          </Tag>
        ))}
      </div>
      {!disabled && available.length ? (
        <Select
          size="sm"
          aria-label={`Add someone to ${label.toLowerCase()}`}
          value=""
          onChange={(e) => e.target.value && onChange([...value, e.target.value])}
          options={[{ value: '', label: 'Add person…' }, ...available.map((p) => ({ value: p.id, label: `${p.name} · ${p.role}` }))]}
          className="w-56"
        />
      ) : null}
    </div>
  );
}
