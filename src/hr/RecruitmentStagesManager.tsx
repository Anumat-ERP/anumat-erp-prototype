import { useState } from 'react';
import { ArrowDown, ArrowUp, Settings2, Trash2 } from 'lucide-react';
import { Banner, Button, Field, IconButton, Input, Modal, Select } from '@app/ui';
import { uid, useStore } from '../data/store';
import { useLocale } from '../i18n/LocaleProvider';
import { isAppAdmin } from '../lib/appAccess';
import { candidateStage, candidateStageConfig, candidateStagesProblem, CANDIDATE_PHASES, type CandidateStage } from './candidateStages';
import { recruitmentProblem } from './recruitment';
import { STATUS_NAMES } from './catalog';
import type { Application } from './types';

export function CandidateStagesManager() {
  const { state } = useStore();
  const { t: tr } = useLocale();
  const [open, setOpen] = useState(false);
  if (!isAppAdmin(state, 'recruitment')) return null;
  return <>
    <Button variant="secondary" icon={<Settings2 aria-hidden />} onClick={() => setOpen(true)}>{tr('Manage candidate stages')}</Button>
    {open && <StageEditor close={() => setOpen(false)} />}
  </>;
}
function StageEditor({ close }: { close: () => void }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [initial] = useState(() => candidateStageConfig(state));
  const [stages, setStages] = useState(() => structuredClone(initial.stages));
  const [name, setName] = useState('');
  const [phase, setPhase] = useState('applied');
  const [error, setError] = useState('');
  const command = { action: 'stages' as const, stages, expectedVersion: initial.version };
  const stale = candidateStageConfig(state).version !== initial.version;
  const move = (index: number, offset: number) => {
    const next = [...stages];
    const other = index + offset;
    if (next[other]?.phase !== next[index]?.phase) return;
    [next[index], next[other]] = [next[other]!, next[index]!];
    setStages(next);
  };
  const add = () => {
    const stage: CandidateStage = { id: uid('stage'), name: name.trim(), phase: phase as CandidateStage['phase'] };
    const next = [...stages];
    const last = next.reduce((last, item, index) => item.phase === phase ? index : last, -1);
    next.splice(last + 1, 0, stage);
    const problem = candidateStagesProblem(state, next);
    if (problem) { setError(problem); return; }
    setStages(next); setName(''); setError('');
  };
  const save = () => {
    const problem = recruitmentProblem(state, command);
    if (problem) { setError(problem); return; }
    dispatch({ type: 'hr', command: { kind: 'recruitment', command } }); close();
  };
  return <Modal open onOpenChange={open => { if (!open) close(); }} title={tr('Manage candidate stages')} size="lg"
    primaryAction={{ content: tr('Save stages'), onAction: save, disabled: stale }}
    secondaryActions={[{ content: tr('Cancel'), onAction: close }]}>
    <p className="text-sm text-muted-foreground">{tr('Rename stages or add steps within a hiring phase. Hiring actions still enforce interview, offer and approval requirements.')}</p>
    {(error || stale) && <Banner tone="critical" title={tr(stale ? 'Stage settings changed. Close and reopen them before saving.' : error)} />}
    <div className="an-rec-stage-settings">
      {CANDIDATE_PHASES.map(phaseId => <section key={phaseId}>
        <h3>{tr(STATUS_NAMES[phaseId] ?? phaseId)}</h3>
        {stages.map((stage, index) => stage.phase !== phaseId ? null : <div className="an-rec-stage-setting" key={stage.id}>
          <Field label={tr('Stage name')}><Input value={stage.name} maxLength={60} onChange={event => setStages(stages.map(item => item.id === stage.id ? { ...item, name: event.target.value } : item))} /></Field>
          <div className="an-rec-stage-setting-actions">
            <IconButton label={tr('Move stage up')} icon={<ArrowUp />} disabled={stages[index - 1]?.phase !== stage.phase} onClick={() => move(index, -1)} />
            <IconButton label={tr('Move stage down')} icon={<ArrowDown />} disabled={stages[index + 1]?.phase !== stage.phase} onClick={() => move(index, 1)} />
            <IconButton label={tr('Remove stage')} icon={<Trash2 />} disabled={stage.id === stage.phase || state.hr?.applications.some(application => candidateStage(state, application)?.id === stage.id)} onClick={() => setStages(stages.filter(item => item.id !== stage.id))} />
          </div>
        </div>)}
      </section>)}
    </div>
    <p className="text-sm text-muted-foreground">{tr('Required phases and stages with candidates cannot be removed.')}</p>
    <div className="an-rec-stage-add">
      <Field label={tr('New stage name')}><Input value={name} maxLength={60} onChange={event => setName(event.target.value)} /></Field>
      <Field label={tr('Hiring phase')}><Select value={phase} onChange={event => setPhase(event.target.value)} options={['applied', 'shortlisted', 'interviewed'].map(value => ({ value, label: tr(STATUS_NAMES[value] ?? value) }))} /></Field>
      <Button disabled={!name.trim() || stale || stages.length >= 24} onClick={add}>{tr('Add stage')}</Button>
    </div>
  </Modal>;
}
export function CandidateStagePicker({ application, dirty }: { application: Application; dirty: boolean }) {
  const { state, dispatch } = useStore();
  const { t: tr } = useLocale();
  const [error, setError] = useState('');
  const stages = candidateStageConfig(state).stages.filter(stage => stage.phase === application.status);
  if (!isAppAdmin(state, 'recruitment') || ['hired', 'rejected', 'withdrawn', 'declined'].includes(application.status)) return null;
  return <div className="mt-4 space-y-2">
    <Field label={tr('Candidate stage')} helpText={tr('Stages within this phase save immediately. Use hiring actions to advance to the next phase.')}>
      <Select disabled={dirty} value={candidateStage(state, application)?.id ?? ''}
        options={stages.map(stage => ({ value: stage.id, label: tr(stage.name) }))}
        onChange={event => {
          const command = { action: 'candidateStage' as const, applicationId: application.id, expectedVersion: application.version, stageId: event.target.value };
          const problem = recruitmentProblem(state, command);
          if (problem) { setError(problem); return; }
          setError(''); dispatch({ type: 'hr', command: { kind: 'recruitment', command } });
        }} />
    </Field>
    {error && <Banner tone="critical" title={tr(error)} />}
  </div>;
}
