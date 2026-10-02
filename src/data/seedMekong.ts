import { at, seed } from './seed';
import type { DataState } from './types';

/**
 * A second demo workspace. Dara belongs to both companies: owner of Lotus
 * Logistics, member here. Shows that roles belong to the membership.
 */
const APPROVER: Record<string, string> = { dara: 'omar', priya: 'maria', sokha: 'omar' };

export const mekongSeed: DataState = {
  ...seed,
  org: { name: 'Mekong Freight', size: '1–49' },
  surveys: [],
  surveyResponses: [],
  meId: 'dara',
  people: [
    { id: 'omar', name: 'Omar Haddad', role: 'Managing Director', department: 'Leadership', access: 'owner' },
    { id: 'maria', name: 'Maria Lopez', role: 'Finance & Legal', department: 'Finance', access: 'admin' },
    { id: 'dara', name: 'Dara Sok', role: 'Operations Advisor', department: 'Operations', access: 'member' },
    { id: 'lina', name: 'Lina Park', role: 'Dispatch Coordinator', department: 'Operations', access: 'member' },
  ],
  processes: seed.processes.map((p) => ({ ...p, steps: p.steps.map((s) => ({ ...s, approverId: APPROVER[s.approverId] ?? s.approverId })) })),
  requests: [],
  meetings: [
    {
      id: 'dispatch-weekly',
      title: 'Weekly dispatch planning',
      start: at(2, 8, 30),
      durationMin: 30,
      location: 'Warehouse office',
      organizerId: 'omar',
      attendeeIds: ['omar', 'dara', 'lina'],
      agenda: ['Truck capacity for November', 'Port delays'],
      decisions: [],
      requestIds: ['PR-0007'],
    },
  ],
  documents: [],
  tasks: [
    { id: 'k1', title: 'Compare two refrigerated truck quotes', ownerId: 'dara', assignedById: 'omar', due: at(1), status: 'doing', consultedIds: ['maria'], informedIds: ['lina'] },
    { id: 'k2', title: 'Update the dispatch roster for November', ownerId: 'lina', assignedById: 'omar', due: at(4), status: 'todo', consultedIds: [], informedIds: ['dara'] },
    { id: 'k3', title: 'File the broker agreement', ownerId: 'maria', assignedById: 'maria', due: at(-2), status: 'done', doneAt: at(-2, 14), consultedIds: [], informedIds: [] },
  ],
  lastSeen: { dara: at(-3) },
  feedback: [],
  leads: [],
  surveyAt: {},
  notificationPrefs: {},
};
