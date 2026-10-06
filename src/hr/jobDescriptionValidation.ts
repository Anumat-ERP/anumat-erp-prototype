import type { JobDescriptionDetails } from "./recruitmentTypes";
export function jobDescriptionProblem(
  details?: JobDescriptionDetails,
): string | undefined {
  if (!details) return;
  if (
    details.experienceYears !== undefined &&
    (!Number.isFinite(details.experienceYears) ||
      details.experienceYears < 0 ||
      details.experienceYears > 60)
  )
    return "Enter required experience between 0 and 60 years.";
  if (
    details.workMode &&
    !["On site", "Hybrid", "Remote"].includes(details.workMode)
  )
    return "Choose an on-site, hybrid or remote work arrangement.";
  if (details.currency && !["USD", "KHR"].includes(details.currency))
    return "Choose USD or KHR for the advertised salary range.";
  const amounts = [details.salaryMin, details.salaryMax];
  if (
    amounts.some((n) => n !== undefined && (!Number.isFinite(n) || n < 0)) ||
    (details.salaryMin !== undefined &&
      details.salaryMax !== undefined &&
      details.salaryMax < details.salaryMin)
  )
    return "Enter a valid salary range. The maximum must be at least the minimum.";
  if (
    details.publicSalary &&
    (details.salaryMin === undefined ||
      details.salaryMax === undefined ||
      !details.currency)
  )
    return "Add both salary amounts and a currency before showing the range to applicants.";
}
