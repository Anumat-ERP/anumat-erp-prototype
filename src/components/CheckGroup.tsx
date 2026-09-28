import { Checkbox } from '@repo/ui';

/** A fieldset of design-system checkboxes, for filter popovers. */
export function CheckGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{legend}</legend>
      {options.map((o) => (
        <Checkbox
          key={o.value}
          label={o.label}
          checked={value.includes(o.value)}
          onCheckedChange={(checked) => onChange(checked === true ? [...value, o.value] : value.filter((v) => v !== o.value))}
        />
      ))}
    </fieldset>
  );
}
