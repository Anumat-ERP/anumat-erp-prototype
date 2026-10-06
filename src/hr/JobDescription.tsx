import { Checkbox, Field, Input, Select, Textarea } from "@app/ui";
import { useLocale } from "../i18n/LocaleProvider";
import type { JobDescriptionDetails } from "./recruitmentTypes";

export function JobDescriptionFields({
  value = {},
  disabled,
  onChange,
}: {
  value?: JobDescriptionDetails;
  disabled?: boolean;
  onChange: (value: JobDescriptionDetails) => void;
}) {
  const { t: tr } = useLocale();
  const set = (key: keyof JobDescriptionDetails, next: unknown) =>
    onChange({
      ...value,
      ...(["salaryMin", "salaryMax"].includes(key)
        ? { currency: value.currency ?? "USD" }
        : {}),
      [key]: next,
    });
  const text = (
    key: keyof JobDescriptionDetails,
    label: string,
    multiline = false,
  ) => (
    <Field label={tr(label)}>
      {multiline ? (
        <Textarea
          rows={3}
          value={String(value[key] ?? "")}
          disabled={disabled}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <Input
          value={String(value[key] ?? "")}
          disabled={disabled}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
    </Field>
  );
  const number = (
    key: "experienceYears" | "salaryMin" | "salaryMax",
    label: string,
  ) => (
    <Field label={tr(label)}>
      <Input
        type="number"
        min={0}
        step={key === "experienceYears" ? "0.5" : "any"}
        value={value[key] ?? ""}
        disabled={disabled}
        onChange={(e) =>
          set(key, e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    </Field>
  );
  return (
    <div className="space-y-5">
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className="font-semibold">{tr("Role and expectations")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("level", "Job level")}
          {text("reportsTo", "Reports to")}
        </div>
        {text("responsibilities", "Key responsibilities", true)}
        {text("successCriteria", "Success measures", true)}
      </section>
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className="font-semibold">{tr("Qualifications and experience")}</h3>
        {text("education", "Education and certifications", true)}
        {number("experienceYears", "Minimum years of experience")}
        {text("preferredQualifications", "Preferred qualifications", true)}
      </section>
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className="font-semibold">
          {tr("Working conditions and benefits")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr("Work arrangement")}>
            <Select
              value={value.workMode ?? ""}
              disabled={disabled}
              options={[
                { value: "", label: tr("Not recorded") },
                ...["On site", "Hybrid", "Remote"].map((mode) => ({
                  value: mode,
                  label: tr(mode),
                })),
              ]}
              onChange={(e) => set("workMode", e.target.value || undefined)}
            />
          </Field>
          {text("workingHours", "Working hours")}
        </div>
        {text("benefits", "Benefits and development opportunities", true)}
      </section>
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className="font-semibold">{tr("Advertised monthly salary")}</h3>
        <p className="text-sm text-muted-foreground">
          {tr("The hiring budget is approved separately in the requisition.")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {number("salaryMin", "Minimum monthly salary")}
          {number("salaryMax", "Maximum monthly salary")}
          <Field label={tr("Salary range currency")}>
            <Select
              value={value.currency ?? "USD"}
              disabled={disabled}
              options={["USD", "KHR"].map((currency) => ({
                value: currency,
                label: currency,
              }))}
              onChange={(e) => set("currency", e.target.value)}
            />
          </Field>
        </div>
        <Checkbox
          label={tr("Show salary range to applicants")}
          checked={value.publicSalary ?? false}
          disabled={disabled}
          onCheckedChange={(v) =>
            onChange({
              ...value,
              publicSalary: v === true,
              currency: value.currency ?? "USD",
            })
          }
        />
      </section>
    </div>
  );
}
export function JobDescriptionSummary({
  details,
  publicView = false,
}: {
  details?: JobDescriptionDetails;
  publicView?: boolean;
}) {
  const { t: tr } = useLocale();
  if (!details) return null;
  const items = [
    ["Job level", details.level],
    ["Reports to", details.reportsTo],
    ["Key responsibilities", details.responsibilities],
    ["Success measures", details.successCriteria],
    ["Education and certifications", details.education],
    ["Minimum years of experience", details.experienceYears],
    ["Preferred qualifications", details.preferredQualifications],
    ["Work arrangement", details.workMode ? tr(details.workMode) : undefined],
    ["Working hours", details.workingHours],
    ["Benefits and development opportunities", details.benefits],
  ] as const;
  return (
    <dl className="mt-4 space-y-3 text-sm">
      {items
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([label, value]) => (
          <div key={label}>
            <dt className="font-medium">{tr(label)}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
              {value}
            </dd>
          </div>
        ))}
      {(!publicView || details.publicSalary) &&
        details.salaryMin !== undefined &&
        details.salaryMax !== undefined && (
          <div>
            <dt className="font-medium">{tr("Advertised monthly salary")}</dt>
            <dd>
              {details.salaryMin} – {details.salaryMax}{" "}
              {details.currency ?? "USD"}
            </dd>
          </div>
        )}
    </dl>
  );
}
