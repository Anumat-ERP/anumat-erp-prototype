import { ActionMenu, Badge, Button, Checkbox, Field, IconButton, Input, Select, Text } from '@repo/ui';
import { ArrowDown, ArrowUp, Copy, GitBranch, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uid } from '../../data/store';
import type { FieldKind, FormField } from '../../data/types';
import { FIELD_KINDS, canBranchOn, choicesFor, hasOptions } from '../../lib/forms';

const DEFAULT_OPTIONS = ['Option 1', 'Option 2'];

export function newField(kind: FieldKind): FormField {
  return { id: uid('fld'), label: '', kind, required: false, ...(hasOptions(kind) ? { options: [...DEFAULT_OPTIONS] } : {}) };
}

function OptionsEditor({ field, onChange }: { field: FormField; onChange: (options: string[]) => void }) {
  const options = field.options ?? [];
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const add = () => {
    onChange([...options, `Option ${options.length + 1}`]);
    // Focus and select the new choice so typing replaces the placeholder text.
    requestAnimationFrame(() => {
      const el = refs.current[options.length];
      el?.focus();
      el?.select();
    });
  };
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-fg">Choices</legend>
      <ul className="flex flex-col gap-2">
        {options.map((o, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden className={field.kind === 'checkboxes' ? 'size-4 shrink-0 rounded-sm border border-border-strong' : 'size-4 shrink-0 rounded-full border border-border-strong'} />
            <Input
              size="sm"
              ref={(el) => {
                refs.current[i] = el;
              }}
              aria-label={`Choice ${i + 1}`}
              value={o}
              onChange={(e) => onChange(options.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (i === options.length - 1) add();
                  else refs.current[i + 1]?.focus();
                }
              }}
              className="flex-1"
            />
            <IconButton
              size="sm"
              icon={<X />}
              label={`Remove choice “${o || i + 1}”`}
              disabled={options.length <= 1}
              onClick={() => onChange(options.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      <Button size="sm" variant="plain" icon={<Plus />} className="self-start" onClick={add}>
        Add choice
      </Button>
    </fieldset>
  );
}

/**
 * Edits a list of questions: type, wording, help, choices, required, and
 * "only ask when" conditions on earlier answers. Used by surveys and by
 * request forms in the process builder.
 */
export function FormBuilder({
  fields,
  onChange,
  noun = 'question',
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  /** What one item is called in button labels: "question" or "field". */
  noun?: string;
}) {
  // The question just added gets focus, so people can type its wording straight away.
  const [added, setAdded] = useState<string>();
  useEffect(() => {
    if (!added) return;
    // Wait for the menu to close and hand focus back to its button first.
    const t = window.setTimeout(() => document.getElementById(`question-${added}`)?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [added]);
  const update = (i: number, patch: Partial<FormField>) => onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, by: number) => {
    const next = [...fields];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item!);
    // A question can only depend on one above it; drop conditions that moving broke.
    onChange(next.map((f, j) => (f.showIf && next.findIndex((x) => x.id === f.showIf!.fieldId) >= j ? { ...f, showIf: undefined } : f)));
  };
  const remove = (i: number) => {
    const gone = fields[i]!.id;
    onChange(fields.filter((_, j) => j !== i).map((f) => (f.showIf?.fieldId === gone ? { ...f, showIf: undefined } : f)));
  };
  const duplicate = (i: number) => {
    const copy = { ...fields[i]!, id: uid('fld'), label: `${fields[i]!.label} (copy)`, options: fields[i]!.options ? [...fields[i]!.options!] : undefined };
    onChange([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
  };
  const setKind = (i: number, kind: FieldKind) => {
    const f = fields[i]!;
    const options = hasOptions(kind) ? (f.options?.length ? f.options : [...DEFAULT_OPTIONS]) : undefined;
    const next = fields.map((x, j) => (j === i ? { ...x, kind, options } : x));
    // Conditions on this question's answers may no longer make sense.
    const probe = { ...f, kind, options };
    onChange(
      next.map((x) =>
        x.showIf?.fieldId === f.id && (!canBranchOn(kind) || !choicesFor(probe).includes(x.showIf.equals)) ? { ...x, showIf: undefined } : x,
      ),
    );
  };

  const addMenu = (label: string) => (
    <ActionMenu
      align="start"
      trigger={
        <Button size="sm" icon={<Plus />}>
          {label}
        </Button>
      }
      items={FIELD_KINDS.map((k) => ({
        content: k.label,
        onAction: () => {
          const field = newField(k.value);
          setAdded(field.id);
          onChange([...fields, field]);
        },
      }))}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <Text variant="bodySm" tone="muted">
          No {noun}s yet.
        </Text>
      ) : null}
      <ol className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const name = f.label.trim() || `${noun} ${i + 1}`;
          const sources = fields.slice(0, i).filter((x) => canBranchOn(x.kind));
          const source = f.showIf ? fields.find((x) => x.id === f.showIf!.fieldId) : undefined;
          return (
            <li key={f.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm" tone="neutral">
                  {i + 1}
                </Badge>
                <Select
                  size="sm"
                  aria-label={`Answer type for “${name}”`}
                  value={f.kind}
                  onChange={(e) => setKind(i, e.target.value as FieldKind)}
                  options={FIELD_KINDS}
                  className="w-40"
                />
                <Checkbox label="Required" checked={f.required} onCheckedChange={(c) => update(i, { required: c === true })} />
                <span className="ms-auto flex items-center gap-0.5">
                  <IconButton size="sm" icon={<ArrowUp />} label={`Move “${name}” up`} disabled={i === 0} onClick={() => move(i, -1)} />
                  <IconButton
                    size="sm"
                    icon={<ArrowDown />}
                    label={`Move “${name}” down`}
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, 1)}
                  />
                  <IconButton size="sm" icon={<Copy />} label={`Duplicate “${name}”`} onClick={() => duplicate(i)} />
                  <IconButton size="sm" icon={<Trash2 />} label={`Delete “${name}”`} onClick={() => remove(i)} />
                </span>
              </div>
              <Field label="Question" id={`question-${f.id}`}>
                <Input
                  value={f.label}
                  placeholder="What would you like to ask?"
                  onChange={(e) => update(i, { label: e.target.value })}
                />
              </Field>
              <Field label="Help text" optional>
                <Input value={f.help ?? ''} placeholder="Shown under the question" onChange={(e) => update(i, { help: e.target.value || undefined })} />
              </Field>
              {hasOptions(f.kind) ? <OptionsEditor field={f} onChange={(options) => update(i, { options })} /> : null}
              {sources.length ? (
                <div className="flex flex-col gap-2 rounded-md bg-surface-sunken p-3">
                  <Checkbox
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <GitBranch aria-hidden className="size-4 text-fg-muted" /> Only ask when an earlier answer matches
                      </span>
                    }
                    checked={Boolean(f.showIf)}
                    onCheckedChange={(c) => {
                      const first = sources[sources.length - 1]!;
                      update(i, { showIf: c === true ? { fieldId: first.id, equals: choicesFor(first)[0] ?? '' } : undefined });
                    }}
                  />
                  {f.showIf && source ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <Field label="When" className="min-w-0 flex-1">
                        <Select
                          size="sm"
                          value={f.showIf.fieldId}
                          onChange={(e) => {
                            const src = fields.find((x) => x.id === e.target.value)!;
                            update(i, { showIf: { fieldId: src.id, equals: choicesFor(src)[0] ?? '' } });
                          }}
                          options={sources.map((s) => ({ value: s.id, label: `${fields.indexOf(s) + 1}. ${s.label || 'Untitled'}` }))}
                        />
                      </Field>
                      <Field label="is" className="sm:w-44">
                        <Select
                          size="sm"
                          value={f.showIf.equals}
                          onChange={(e) => update(i, { showIf: { ...f.showIf!, equals: e.target.value } })}
                          options={choicesFor(source)
                            .filter(Boolean)
                            .map((o) => ({ value: o, label: o }))}
                        />
                      </Field>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div>{addMenu(`Add ${noun}`)}</div>
    </div>
  );
}
