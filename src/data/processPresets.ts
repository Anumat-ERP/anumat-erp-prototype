import type { FormField, Person, Process } from './types';

export interface ProcessPreset {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  hasAmount: boolean;
  fields: Omit<FormField, 'id'>[];
  /** `department` says whose desk the step usually lands on, so an approver can be suggested. */
  steps: { name: string; slaHours: number; minAmount?: number; department?: string }[];
}

export type PresetCategory = 'Finance' | 'People' | 'Operations' | 'IT' | 'Legal' | 'Marketing';
export const PRESET_CATEGORIES: PresetCategory[] = ['Finance', 'People', 'Operations', 'IT', 'Legal', 'Marketing'];

export const processPresets: ProcessPreset[] = [
  {
    id: 'purchase',
    name: 'Purchase approval',
    category: 'Finance',
    description: 'Approve purchases with a finance review for larger amounts.',
    hasAmount: true,
    fields: [
      { label: 'Supplier name', kind: 'text', required: true },
      { label: 'Business reason', kind: 'longtext', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'Finance review', slaHours: 48, minAmount: 1000, department: 'Finance' },
    ],
  },
  {
    id: 'expense',
    name: 'Expense reimbursement',
    category: 'Finance',
    description: 'Review employee expenses and confirm reimbursement.',
    hasAmount: true,
    fields: [
      { label: 'Expense date', kind: 'date', required: true },
      { label: 'Expense details', kind: 'longtext', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'Finance review', slaHours: 48, department: 'Finance' },
    ],
  },
  {
    id: 'leave',
    name: 'Leave request',
    category: 'People',
    description: 'Collect leave dates and route requests to a manager and HR.',
    hasAmount: false,
    fields: [
      { label: 'First day of leave', kind: 'date', required: true },
      { label: 'Last day of leave', kind: 'date', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'HR review', slaHours: 24, department: 'People' },
    ],
  },
  {
    id: 'travel',
    name: 'Business travel',
    category: 'Operations',
    description: 'Approve a trip and its estimated budget before booking.',
    hasAmount: true,
    fields: [
      { label: 'Destination', kind: 'text', required: true },
      { label: 'Departure date', kind: 'date', required: true },
      { label: 'Travel purpose', kind: 'longtext', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'Finance review', slaHours: 48, department: 'Finance' },
    ],
  },
  {
    id: 'equipment',
    name: 'Equipment request',
    category: 'IT',
    description: 'Request equipment and get approval from a manager and IT.',
    hasAmount: true,
    fields: [
      { label: 'Equipment needed', kind: 'longtext', required: true },
      { label: 'Needed by', kind: 'date', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'IT review', slaHours: 48, department: 'IT' },
    ],
  },
  {
    id: 'contract',
    name: 'Contract review',
    category: 'Legal',
    description: 'Review contract details with legal and a final decision maker.',
    hasAmount: true,
    fields: [
      { label: 'Other party', kind: 'text', required: true },
      { label: 'Contract summary', kind: 'longtext', required: true },
    ],
    steps: [
      { name: 'Legal review', slaHours: 48, department: 'Legal' },
      { name: 'Final approval', slaHours: 24, department: 'Leadership' },
    ],
  },
  {
    id: 'vendor',
    name: 'Vendor onboarding',
    category: 'Finance',
    description: 'Check a new supplier with finance and legal before the first order.',
    hasAmount: true,
    fields: [
      { label: 'Vendor name', kind: 'text', required: true },
      { label: 'Services provided', kind: 'longtext', required: true },
    ],
    steps: [
      { name: 'Finance review', slaHours: 48, department: 'Finance' },
      { name: 'Legal review', slaHours: 48, department: 'Legal' },
      { name: 'Final approval', slaHours: 24, minAmount: 10000, department: 'Leadership' },
    ],
  },
  {
    id: 'budget',
    name: 'Budget request',
    category: 'Finance',
    description: 'Ask for project budget; larger amounts go up to leadership.',
    hasAmount: true,
    fields: [
      { label: 'Project name', kind: 'text', required: true },
      { label: 'Business case', kind: 'longtext', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'Finance review', slaHours: 48, minAmount: 5000, department: 'Finance' },
      { name: 'Final approval', slaHours: 48, minAmount: 20000, department: 'Leadership' },
    ],
  },
  {
    id: 'it-access',
    name: 'IT access request',
    category: 'IT',
    description: 'Request access to a system or app; IT grants it once a manager agrees.',
    hasAmount: false,
    fields: [
      { label: 'System or app', kind: 'text', required: true },
      { label: 'Why you need access', kind: 'longtext', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'IT review', slaHours: 24, department: 'IT' },
    ],
  },
  {
    id: 'marketing-post',
    name: 'Marketing post',
    category: 'Marketing',
    description: 'Review a social or website post before it goes live.',
    hasAmount: false,
    fields: [
      { label: 'Channel', kind: 'text', required: true },
      { label: 'Post text', kind: 'longtext', required: true },
      { label: 'Publish date', kind: 'date', required: true },
    ],
    steps: [
      { name: 'Content review', slaHours: 24, department: 'Product' },
      { name: 'Final approval', slaHours: 24, department: 'Leadership' },
    ],
  },
];

/**
 * A sensible first approver for a template step: someone in the step's
 * department (an admin or owner first), otherwise the person setting it up.
 */
export function suggestApprover(step: ProcessPreset['steps'][number], people: Person[], meId: string): string {
  const inDept = step.department ? people.filter((p) => p.department === step.department) : [];
  const lead = inDept.find((p) => p.access === 'owner' || p.access === 'admin') ?? inDept[0];
  return (lead ?? people.find((p) => p.id === meId) ?? people[0])?.id ?? meId;
}

/** True when this workspace already has the template: installed from it, or the built-in type it mirrors. */
export function isPresetInstalled(preset: ProcessPreset, processes: Process[]) {
  return processes.some((p) => p.presetId === preset.id || p.requestType === preset.id);
}

export function availableProcessPrefix(processes: Process[]): string {
  const used = new Set(['PR', 'LV', 'EX', 'CT', ...processes.map((p) => p.prefix?.toUpperCase())]);
  for (let i = 0; ; i++) {
    const prefix = i === 0 ? 'NR' : `N${i}`;
    if (!used.has(prefix)) return prefix;
  }
}

/** Each installation is independent and paused until reviewed. */
export function instantiatePreset(
  preset: ProcessPreset,
  approverIds: string[],
  processes: Process[],
  id: () => string,
  translate: (text: string) => string,
): Process {
  if (approverIds.length !== preset.steps.length || approverIds.some((value) => !value)) throw new Error('Choose an approver for every step.');
  const processId = id();
  return {
    id: processId,
    requestType: processId,
    prefix: availableProcessPrefix(processes),
    name: translate(preset.name),
    hasAmount: preset.hasAmount,
    fields: preset.fields.map((field) => ({ ...field, id: id(), label: translate(field.label) })),
    submitters: [],
    trigger: translate('A request of this type is submitted'),
    active: false,
    avgHours: 0,
    runs30d: 0,
    presetId: preset.id,
    steps: preset.steps.map(({ department: _department, ...step }, index) => ({ ...step, id: id(), name: translate(step.name), role: translate(step.name), approverId: approverIds[index]! })),
  };
}
