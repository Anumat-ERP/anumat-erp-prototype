import {
  BookOpen,
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Button,
  Checkbox,
  DatePicker,
  Field,
  Input,
  Select,
  Textarea,
} from "@app/ui";
import { useLocale } from "../i18n/LocaleProvider";
import type {
  CandidateProfile,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
  CandidateProject,
} from "./types";
import type { ReactNode } from "react";

const blankProfile = (): CandidateProfile => ({
  education: [],
  experience: [],
  skills: [],
  projects: [],
  notes: "",
});
export function CandidateProfileFields({
  value,
  onChange,
  disabled = false,
  applicant = false,
}: {
  value?: CandidateProfile;
  onChange: (value: CandidateProfile) => void;
  disabled?: boolean;
  applicant?: boolean;
}) {
  const { t: tr } = useLocale();
  const profile = { ...blankProfile(), ...value };
  const update = <K extends keyof CandidateProfile>(
    key: K,
    next: CandidateProfile[K],
  ) => onChange({ ...profile, [key]: next });
  const patch = <K extends "education" | "experience" | "skills" | "projects">(
    key: K,
    index: number,
    next: Partial<CandidateProfile[K][number]>,
  ) =>
    update(
      key,
      profile[key].map((entry, n) =>
        n === index ? { ...entry, ...next } : entry,
      ) as CandidateProfile[K],
    );
  const remove = <K extends "education" | "experience" | "skills" | "projects">(
    key: K,
    index: number,
  ) =>
    update(
      key,
      profile[key].filter((_, n) => n !== index) as CandidateProfile[K],
    );
  const text = (
    label: string,
    value: string,
    change: (value: string) => void,
    multiline = false,
  ) => (
    <Field label={tr(label)}>
      {multiline ? (
        <Textarea
          rows={3}
          value={value}
          disabled={disabled}
          onChange={(e) => change(e.target.value)}
        />
      ) : (
        <Input
          value={value}
          disabled={disabled}
          onChange={(e) => change(e.target.value)}
        />
      )}
    </Field>
  );
  const section = (
    label: string,
    icon: ReactNode,
    children: ReactNode,
    addLabel: string,
    add: () => void,
    count: number,
  ) => (
    <section
      className="space-y-3 border-t border-border pt-5"
      aria-label={tr(label)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          {icon}
          {tr(label)}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({count})
          </span>
        </h3>
        {!disabled && (
          <Button size="sm" variant="secondary" icon={<Plus />} onClick={add}>
            {tr(addLabel)}
          </Button>
        )}
      </div>
      {count ? (
        children
      ) : (
        <p className="text-sm text-muted-foreground">{tr("Not recorded")}</p>
      )}
    </section>
  );
  const entry = (
    key: "education" | "experience" | "skills" | "projects",
    index: number,
    heading: string,
    children: ReactNode,
  ) => (
    <div key={index} className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">
          {tr(heading)} {index + 1}
        </p>
        {!disabled && (
          <Button
            size="sm"
            variant="tertiary"
            icon={<Trash2 />}
            aria-label={`${tr("Remove")} ${tr(heading)} ${index + 1}`}
            onClick={() => remove(key, index)}
          >
            {tr("Remove")}
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{tr("Candidate background")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr(
            "Optional details to understand qualifications, experience and work samples.",
          )}
        </p>
      </div>
      {section(
        "Education",
        <GraduationCap size={18} />,
        profile.education.map((item, index) =>
          entry(
            "education",
            index,
            "Education",
            <>
              {text(
                "University or institution",
                item.institution,
                (institution) => patch("education", index, { institution }),
              )}
              {text(
                "Degree or qualification",
                item.qualification,
                (qualification) => patch("education", index, { qualification }),
              )}
              {text("Field of study", item.field, (field) =>
                patch("education", index, { field }),
              )}
              <Field label={tr("Start year")}>
                <Input
                  type="number"
                  value={item.startYear}
                  disabled={disabled}
                  onChange={(e) =>
                    patch("education", index, { startYear: e.target.value })
                  }
                />
              </Field>
              <Field label={tr("End year")}>
                <Input
                  type="number"
                  value={item.endYear}
                  disabled={disabled || item.ongoing}
                  onChange={(e) =>
                    patch("education", index, { endYear: e.target.value })
                  }
                />
              </Field>
              <Checkbox
                label={tr("Currently studying")}
                checked={item.ongoing}
                disabled={disabled}
                onCheckedChange={(v) =>
                  patch("education", index, {
                    ongoing: v === true,
                    ...(v === true ? { endYear: "" } : {}),
                  })
                }
              />
            </>,
          ),
        ),
        "Add education",
        () =>
          update("education", [
            ...profile.education,
            {
              institution: "",
              qualification: "",
              field: "",
              startYear: "",
              endYear: "",
              ongoing: false,
            } satisfies CandidateEducation,
          ]),
        profile.education.length,
      )}
      {section(
        "Work experience",
        <BriefcaseBusiness size={18} />,
        profile.experience.map((item, index) =>
          entry(
            "experience",
            index,
            "Experience",
            <>
              {text("Company or organization", item.company, (company) =>
                patch("experience", index, { company }),
              )}
              {text("Role or job title", item.role, (role) =>
                patch("experience", index, { role }),
              )}
              <DatePicker
                label={tr("Employment start date")}
                value={item.startDate}
                disabled={disabled}
                onChange={(e) =>
                  patch("experience", index, { startDate: e.target.value })
                }
              />
              <DatePicker
                label={tr("Employment end date")}
                value={item.endDate}
                disabled={disabled || item.current}
                onChange={(e) =>
                  patch("experience", index, { endDate: e.target.value })
                }
              />
              <Checkbox
                label={tr("Currently working here")}
                checked={item.current}
                disabled={disabled}
                onCheckedChange={(v) =>
                  patch("experience", index, {
                    current: v === true,
                    ...(v === true ? { endDate: "" } : {}),
                  })
                }
              />
              <div className="sm:col-span-2">
                {text(
                  "Responsibilities and achievements",
                  item.achievements,
                  (achievements) =>
                    patch("experience", index, { achievements }),
                  true,
                )}
              </div>
            </>,
          ),
        ),
        "Add experience",
        () =>
          update("experience", [
            ...profile.experience,
            {
              company: "",
              role: "",
              startDate: "",
              endDate: "",
              current: false,
              achievements: "",
            } satisfies CandidateExperience,
          ]),
        profile.experience.length,
      )}
      {section(
        "Skills",
        <BookOpen size={18} />,
        profile.skills.map((item, index) =>
          entry(
            "skills",
            index,
            "Skill",
            <>
              {text("Skill name", item.name, (name) =>
                patch("skills", index, { name }),
              )}
              <Field label={tr("Proficiency")}>
                <Select
                  value={item.level}
                  disabled={disabled}
                  options={["Beginner", "Intermediate", "Advanced"].map(
                    (level) => ({ value: level, label: tr(level) }),
                  )}
                  onChange={(e) =>
                    patch("skills", index, {
                      level: e.target.value as CandidateSkill["level"],
                    })
                  }
                />
              </Field>
            </>,
          ),
        ),
        "Add skill",
        () =>
          update("skills", [
            ...profile.skills,
            { name: "", level: "Intermediate" } satisfies CandidateSkill,
          ]),
        profile.skills.length,
      )}
      {section(
        "Projects and portfolio",
        <FolderKanban size={18} />,
        profile.projects.map((item, index) =>
          entry(
            "projects",
            index,
            "Project",
            <>
              {text("Project name", item.name, (name) =>
                patch("projects", index, { name }),
              )}
              <Field label={tr("Project type")}>
                <Select
                  value={item.type}
                  disabled={disabled}
                  options={[
                    "Professional",
                    "Academic",
                    "Personal",
                    "Volunteer",
                    "Other",
                  ].map((type) => ({ value: type, label: tr(type) }))}
                  onChange={(e) =>
                    patch("projects", index, {
                      type: e.target.value as CandidateProject["type"],
                    })
                  }
                />
              </Field>
              {text("Your contribution", item.role, (role) =>
                patch("projects", index, { role }),
              )}
              {text("Portfolio or project URL", item.url, (url) =>
                patch("projects", index, { url }),
              )}
              <div className="sm:col-span-2">
                {text(
                  "Project outcomes and skills used",
                  item.outcomes,
                  (outcomes) => patch("projects", index, { outcomes }),
                  true,
                )}
              </div>
            </>,
          ),
        ),
        "Add project",
        () =>
          update("projects", [
            ...profile.projects,
            {
              name: "",
              type: "Professional",
              role: "",
              url: "",
              outcomes: "",
            } satisfies CandidateProject,
          ]),
        profile.projects.length,
      )}
      {!applicant && (
        <section className="space-y-3 border-t border-border pt-5">
          {text(
            "Recruiter notes",
            profile.notes,
            (notes) => update("notes", notes),
            true,
          )}
          <p className="text-sm text-muted-foreground">
            {tr(
              "Internal recruitment notes. Not shown in the applicant preview.",
            )}
          </p>
        </section>
      )}
    </div>
  );
}
