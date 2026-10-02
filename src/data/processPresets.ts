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

export const processPresets: ProcessPreset[] = [];

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
