import type { BusinessStarter } from '../lib/businessStarter';
import approvalsTasks from '../assets/illustrations/generated/approvals-tasks.webp';
import peopleHR from '../assets/illustrations/generated/people-hr.webp';
import workspace from '../assets/illustrations/workspace-folder.webp';

const ART: Record<BusinessStarter, string> = { work: approvalsTasks, people: peopleHR, all: workspace };

/** Supplementary imagery: the adjacent heading and steps carry all workflow information. */
export function WorkflowIllustration({ starter, className, loading = 'lazy' }: { starter: BusinessStarter; className?: string; loading?: 'eager' | 'lazy' }) {
  return <img className={className} src={ART[starter]} alt="" aria-hidden="true" width="1024" height="1024" loading={loading} decoding="async" />;
}
