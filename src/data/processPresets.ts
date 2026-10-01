import type { FormField, Process } from './types';

export interface ProcessPreset {
  id: string;
  name: string;
  category: 'Finance' | 'People' | 'Operations' | 'Legal';
  description: string;
  hasAmount: boolean;
  fields: Omit<FormField, 'id'>[];
  steps: { name: string; slaHours: number; minAmount?: number }[];
}

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
      { name: 'Finance review', slaHours: 48, minAmount: 1000 },
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
      { name: 'Finance review', slaHours: 48 },
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
      { name: 'HR review', slaHours: 24 },
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
      { name: 'Finance review', slaHours: 48 },
    ],
  },
  {
    id: 'equipment',
    name: 'Equipment request',
    category: 'Operations',
    description: 'Request equipment and get approval from a manager and IT.',
    hasAmount: true,
    fields: [
      { label: 'Equipment needed', kind: 'longtext', required: true },
      { label: 'Needed by', kind: 'date', required: true },
    ],
    steps: [
      { name: 'Manager review', slaHours: 24 },
      { name: 'IT review', slaHours: 48 },
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
      { name: 'Legal review', slaHours: 48 },
      { name: 'Final approval', slaHours: 24 },
    ],
  },
];

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
    steps: preset.steps.map((step, index) => ({ ...step, id: id(), name: translate(step.name), role: translate(step.name), approverId: approverIds[index]! })),
  };
}
