import type { CandidateProfile } from "./types";
const date = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
const year = (value: string) =>
  !value ||
  (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2200);
export function candidateProfileProblem(
  profile?: CandidateProfile,
): string | undefined {
  if (!profile) return;
  if (
    !Array.isArray(profile.education) ||
    !Array.isArray(profile.experience) ||
    !Array.isArray(profile.skills) ||
    !Array.isArray(profile.projects)
  )
    return "Candidate background is invalid. Review the profile entries.";
  if (
    [
      profile.education,
      profile.experience,
      profile.skills,
      profile.projects,
    ].some((rows) => rows.length > 30)
  )
    return "Keep each candidate background section to 30 entries or fewer.";
  for (const item of profile.education) {
    if (!item.institution?.trim() || !item.qualification?.trim())
      return "Add an institution and qualification for each education entry, or remove the entry.";
    if (
      !year(item.startYear) ||
      !year(item.endYear) ||
      (!item.ongoing &&
        item.startYear &&
        item.endYear &&
        item.endYear < item.startYear)
    )
      return "Check education years. The end year must be on or after the start year.";
  }
  for (const item of profile.experience) {
    if (!item.company?.trim() || !item.role?.trim())
      return "Add a company and role for each experience entry, or remove the entry.";
    if (
      (item.startDate && !date(item.startDate)) ||
      (item.endDate && !date(item.endDate)) ||
      (!item.current &&
        item.startDate &&
        item.endDate &&
        item.endDate < item.startDate)
    )
      return "Check employment dates. The end date must be on or after the start date.";
  }
  for (const item of profile.skills)
    if (
      !item.name?.trim() ||
      !["Beginner", "Intermediate", "Advanced"].includes(item.level)
    )
      return "Add a skill name and proficiency, or remove the entry.";
  for (const item of profile.projects) {
    if (
      !item.name?.trim() ||
      !["Professional", "Academic", "Personal", "Volunteer", "Other"].includes(
        item.type,
      )
    )
      return "Add a project name and type, or remove the entry.";
    if (item.url) {
      try {
        if (!["https:", "http:"].includes(new URL(item.url).protocol))
          return "Use an http or https URL for the project link.";
      } catch {
        return "Use an http or https URL for the project link.";
      }
    }
  }
}
