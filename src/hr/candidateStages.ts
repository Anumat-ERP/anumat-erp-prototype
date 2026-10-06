import type { DataState } from '../data/types';
import type { Application } from './types';

export const CANDIDATE_PHASES = ['applied', 'shortlisted', 'interviewed', 'offered', 'accepted', 'hired', 'rejected', 'withdrawn', 'declined'] as const;
export type CandidatePhase = typeof CANDIDATE_PHASES[number];
export interface CandidateStage { id: string; name: string; phase: CandidatePhase; }
export interface CandidateStageConfig { version: number; stages: CandidateStage[]; }
const names = ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Accepted', 'Hired', 'Rejected', 'Withdrawn', 'Declined'];
export const defaultCandidateStages = (): CandidateStage[] => CANDIDATE_PHASES.map((phase, index) => ({ id: phase, name: names[index]!, phase }));
export const candidateStageConfig = (state: DataState): CandidateStageConfig => state.hr?.recruitment?.candidateStages ?? { version: 0, stages: defaultCandidateStages() };
export const candidateStage = (state: DataState, application: Application) => {
  const stages = candidateStageConfig(state).stages;
  return stages.find(stage => stage.id === application.stageId && stage.phase === application.status)
    ?? stages.find(stage => stage.id === application.status && stage.phase === application.status)
    ?? stages.find(stage => stage.phase === application.status);
};
export const candidateStageName = (state: DataState, application: Application) => candidateStage(state, application)?.name ?? application.status;
export const isPipelineStage = (stage: CandidateStage) => !['rejected', 'withdrawn', 'declined'].includes(stage.phase);
export function candidateStagesProblem(state: DataState, stages: CandidateStage[]): string | undefined {
  if (stages.length > 24 || stages.length < 9) return 'Keep between 9 and 24 candidate stages.';
  if (stages.some(stage => !/^[a-zA-Z0-9_-]+$/.test(stage.id) || !stage.name.trim() || stage.name.trim().length > 60 || !CANDIDATE_PHASES.includes(stage.phase))) return 'Give every stage a valid phase and a name of up to 60 characters.';
  if (new Set(stages.map(stage => stage.id)).size !== stages.length || new Set(stages.map(stage => stage.name.trim().toLowerCase())).size !== stages.length) return 'Stage names and IDs must be unique.';
  if (stages.some(stage => stage.id !== stage.phase && !['applied', 'shortlisted', 'interviewed'].includes(stage.phase))) return 'Add custom stages within Applied, Shortlisted or Interviewed.';
  for (const phase of CANDIDATE_PHASES) {
    if (!stages.some(stage => stage.id === phase && stage.phase === phase)) return 'Keep each required hiring phase.';
  }
  if (stages.some((stage, index) => index > 0 && CANDIDATE_PHASES.indexOf(stage.phase) < CANDIDATE_PHASES.indexOf(stages[index - 1]!.phase))) return 'Reorder stages within the same hiring phase.';
  for (const old of candidateStageConfig(state).stages) {
    const next = stages.find(stage => stage.id === old.id);
    if (next && next.phase !== old.phase) return 'A saved stage cannot change its hiring phase.';
    if (!next && state.hr?.applications.some(application => candidateStage(state, application)?.id === old.id)) return 'Move candidates out of this stage before removing it.';
  }
}
