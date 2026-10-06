import { candidateStageConfig, candidateStage, candidateStagesProblem } from './candidateStages';
import { jobDescriptionProblem } from './jobDescriptionValidation';
import type { DataState, Request } from '../data/types';
import { appRole, canContributeToApp, isAppAdmin } from '../lib/appAccess';
import { emptyHR, type Application } from './types';
import {
  emptyRecruitment,
  type RecruitmentCommand,
  type RecruitmentState,
  type Requisition,
} from './recruitmentTypes';
export const recruitmentState = (state: DataState): RecruitmentState =>
  state.hr?.recruitment ?? emptyRecruitment();
const dateValid = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
const terminal = ['hired', 'rejected', 'withdrawn', 'declined'];
export const recruitmentReviewers = (state: DataState) =>
  state.people.filter(
    (p) =>
      p.id !== state.meId &&
      isAppAdmin(state, 'recruitment', p.id) &&
      canContributeToApp(state, 'approvals', p.id),
  );
export const approvedOffer = (state: DataState, a: Application) =>
  recruitmentState(state).offers.find(
    (o) =>
      o.applicationId === a.id &&
      o.status === 'approved' &&
      o.offerRevision === a.offerRevision &&
      o.salary === a.salary &&
      o.currency === a.currency &&
      o.startDate === a.startDate,
  );
export function recruitmentProblem(
  state: DataState,
  c: RecruitmentCommand,
): string | undefined {
  const r = recruitmentState(state),
    hr = state.hr ?? emptyHR(),
    admin = isAppAdmin(state, 'recruitment');
  if (!canContributeToApp(state, 'recruitment'))
    return 'Recruitment member access is required.';
  if (!admin && c.action !== 'assessment')
    return 'Only recruitment admins can manage hiring.';
  if (c.action === 'stages') {
    if (candidateStageConfig(state).version !== c.expectedVersion) return 'Stage settings changed. Close and reopen them before saving.';
    return candidateStagesProblem(state, c.stages);
  }
  if (c.action === 'candidateStage') {
    const application = hr.applications.find(a => a.id === c.applicationId);
    if (!application || application.version !== c.expectedVersion) return 'This record changed. Close and reopen it before trying again.';
    const stage = candidateStageConfig(state).stages.find(stage => stage.id === c.stageId);
    if (!stage || stage.phase !== application.status || terminal.includes(application.status)) return 'Choose a stage in the current hiring phase. Use the hiring actions to advance.';
    if (candidateStage(state, application)?.id === stage.id) return 'The candidate is already in this stage.';
    return;
  }
  const stale = (version: number | undefined, expected: number | undefined) =>
    version !== expected;
  const reviewer = (id: string) =>
    recruitmentReviewers(state).some((p) => p.id === id);
  if (c.action === 'position') {
    const old = r.positions.find((p) => p.id === c.record.id);
    if (stale(old?.version, c.expectedVersion))
      return 'This record changed. Close and reopen it before trying again.';
    if (
      !c.record.title.trim() ||
      !c.record.department.trim() ||
      !c.record.branch.trim() ||
      !c.record.description.trim() ||
      !c.record.requirements.trim()
    )
      return 'Complete the position, job description and requirements.';
    if (c.record.status && !['active', 'archived'].includes(c.record.status)) return 'Choose an active or archived job description status.';
    if (c.record.code?.trim() && r.positions.some((p) => p.id !== c.record.id && p.code?.trim().toLowerCase() === c.record.code!.trim().toLowerCase())) return 'This job code is already in use. Choose a unique code.';
    return jobDescriptionProblem(c.record.details);
  }
  if (c.action === 'requisition') {
    const old = r.requisitions.find((x) => x.id === c.record.id),
      p = r.positions.find((x) => x.id === c.record.positionId);
    if (stale(old?.version, c.expectedVersion))
      return 'This record changed. Close and reopen it before trying again.';
    if (old && old.status !== 'draft')
      return 'Revise the requisition before editing it.';
    if (p?.status === 'archived') return 'Restore the archived job description before creating a requisition.';
    if (!p || p.version !== c.record.positionVersion)
      return 'The job description changed. Choose the current position revision.';
    if (
      !Number.isInteger(c.record.openings) ||
      c.record.openings < 1 ||
      !Number.isFinite(c.record.budget) ||
      c.record.budget <= 0 ||
      !['USD', 'KHR'].includes(c.record.currency) ||
      !c.record.reason.trim() ||
      !dateValid(c.record.closingDate) ||
      !isAppAdmin(state, 'recruitment', c.record.managerId) ||
      !reviewer(c.record.reviewerId) ||
      c.record.reviewerId === old?.createdById
    )
      return 'Add headcount, budget, closing date, hiring manager and an independent available reviewer.';
    return;
  }
  if (c.action === 'requisitionDecision') {
    const q = r.requisitions.find((x) => x.id === c.id);
    if (!q || q.version !== c.expectedVersion)
      return 'This record changed. Close and reopen it before trying again.';
    if (!c.reason.trim()) return 'Add a reason for this action.';
    if (c.operation === 'submit') {
      if (
        q.status !== 'draft' ||
        !reviewer(q.reviewerId) ||
        !canContributeToApp(state, 'approvals')
      )
        return 'Choose an independent reviewer with Recruitment and Approvals access before submitting.';
      if (q.closingDate < new Date().toISOString().slice(0, 10))
        return 'Choose a closing date that has not passed.';
      if (
        r.positions.find((p) => p.id === q.positionId)?.version !==
        q.positionVersion
      )
        return 'The job description changed. Choose the current position revision.';
    } else if (c.operation === 'withdraw') {
      if (q.status !== 'pending' || q.createdById !== state.meId)
        return 'Only the requester can withdraw a pending requisition.';
    } else if (c.operation === 'revise') {
      if (!['declined', 'draft', 'changes', 'withdrawn'].includes(q.status))
        return 'Only draft or declined requisitions can be revised.';
    } else if (
      c.operation === 'approve' &&
      r.positions.find((p) => p.id === q.positionId)?.version !==
        q.positionVersion
    )
      return 'The job description changed. Choose the current position revision.';
    else if (
      q.status !== 'pending' ||
      q.reviewerId !== state.meId ||
      q.createdById === state.meId ||
      !canContributeToApp(state, 'approvals')
    )
      return 'Only the independent assigned reviewer can decide this requisition.';
    return;
  }
  if (c.action === 'interview') {
    const old = r.interviews.find((x) => x.id === c.record.id),
      a = hr.applications.find((x) => x.id === c.record.applicationId);
    if (stale(old?.version, c.expectedVersion))
      return 'This record changed. Close and reopen it before trying again.';
    if (old && old.status !== 'scheduled')
      return 'Completed or cancelled interviews cannot be rescheduled.';
    if (
      !a ||
      !['shortlisted', 'interviewed'].includes(a.status) ||
      !canContributeToApp(state, 'recruitment', c.record.interviewerId) ||
      !Number.isFinite(Date.parse(c.record.startsAt)) ||
      !dateValid(c.record.startsAt.slice(0, 10)) ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(
        c.record.startsAt,
      ) ||
      !Number.isFinite(c.record.duration) ||
      c.record.duration < 5 ||
      c.record.duration > 240 ||
      !c.record.criteria.trim() ||
      !c.record.location.trim()
    )
      return 'Choose a shortlisted candidate, an available interviewer, a valid time, location and assessment criteria.';
    if (
      r.interviews.some(
        (x) =>
          x.id !== c.record.id &&
          x.status === 'scheduled' &&
          x.interviewerId === c.record.interviewerId &&
          Date.parse(x.startsAt) <
            Date.parse(c.record.startsAt) + c.record.duration * 60000 &&
          Date.parse(c.record.startsAt) <
            Date.parse(x.startsAt) + x.duration * 60000,
      )
    )
      return 'This interviewer already has an interview at that time.';
    return;
  }
  if (c.action === 'assessment' || c.action === 'cancelInterview') {
    const i = r.interviews.find((x) => x.id === c.id),
      a = hr.applications.find((x) => x.id === i?.applicationId);
    if (!i || i.version !== c.expectedVersion)
      return 'This record changed. Close and reopen it before trying again.';
    if (i.status !== 'scheduled' || !a || terminal.includes(a.status))
      return 'This interview or application is no longer active.';
    if (c.action === 'assessment') {
      if (i.interviewerId !== state.meId)
        return 'Only the assigned interviewer can submit an assessment.';
      if (
        !Number.isFinite(c.score) ||
        c.score < 0 ||
        c.score > 100 ||
        !c.evidence.trim() ||
        !['advance', 'hold', 'reject'].includes(c.recommendation)
      )
        return 'Add a score from 0 to 100, assessment evidence and a recommendation.';
    } else if (!c.reason.trim()) return 'Add a reason for this action.';
    return;
  }
  if (c.action === 'offer') {
    const a = hr.applications.find((x) => x.id === c.applicationId);
    if (!a || a.version !== c.expectedVersion)
      return 'This record changed. Close and reopen it before trying again.';
    if (
      a.status !== 'interviewed' ||
      !dateValid(a.startDate) ||
      a.salary <= 0 ||
      !c.terms.trim() ||
      !reviewer(c.reviewerId)
    )
      return 'Save interview evidence and offer terms, then choose an independent reviewer.';
    const v = hr.vacancies.find((v) => v.id === a.vacancyId),
      q = r.requisitions.find((q) => q.id === v?.requisitionId);
    if (q && (a.currency !== q.currency || a.salary > q.budget))
      return 'The offer exceeds the approved budget or uses a different currency. Request new headcount approval.';
    if (
      r.offers.some(
        (x) =>
          x.applicationId === a.id &&
          ['pending', 'approved'].includes(x.status) &&
          x.offerRevision === a.offerRevision,
      )
    )
      return 'An approval already exists for this offer revision.';
    return;
  }
  const o = r.offers.find((x) => x.id === c.id),
    a = hr.applications.find((x) => x.id === o?.applicationId);
  if (!o || o.version !== c.expectedVersion)
    return 'This record changed. Close and reopen it before trying again.';
  if (
    o.status !== 'pending' ||
    o.reviewerId !== state.meId ||
    o.createdById === state.meId
  )
    return 'Only the independent assigned reviewer can decide this offer.';
  if (
    !a ||
    a.status !== 'interviewed' ||
    a.version !== o.applicationVersion ||
    a.offerRevision !== o.offerRevision ||
    a.salary !== o.salary ||
    a.currency !== o.currency ||
    a.startDate !== o.startDate
  )
    return 'The offer terms changed. Request approval for the current revision.';
  if (!c.reason.trim()) return 'Add a reason for this action.';
}
function requestFor(q: Requisition, at: string): Request {
  return {
    id: q.requestId!,
    type: 'recruitment-headcount',
    title: `Headcount · ${q.position.title}`,
    requesterId: q.createdById,
    department: q.position.department,
    amount: q.budget * q.openings,
    description: `${q.reason}\n${q.openings} × ${q.budget} ${q.currency}\nJD revision ${q.positionVersion}\n${q.position.description}\n${q.position.requirements}`,
    status: 'pending',
    createdAt: at,
    submittedAt: at,
    updatedAt: at,
    revision: 1,
    form: [],
    fields: {},
    attachments: [],
    activity: [],
    steps: [
      {
        id: `${q.id}-review`,
        name: 'Headcount approval',
        approverId: q.reviewerId,
        status: 'current',
        fields: [],
      },
    ],
  };
}
export function applyRecruitment(
  state: DataState,
  c: RecruitmentCommand,
): DataState {
  if (recruitmentProblem(state, c)) return state;
  const hr = structuredClone(state.hr ?? emptyHR()),
    r = structuredClone(recruitmentState(state));
  hr.recruitment = r;
  const at = new Date().toISOString();
  if (c.action === 'stages') {
    const before = candidateStageConfig(state);
    r.candidateStages = { version: before.version + 1, stages: structuredClone(c.stages).map(stage => ({ ...stage, name: stage.name.trim() })) };
    r.history.push({ id: `stages-${r.candidateStages.version}`, kind: 'stages', recordId: 'candidate-stages', action: 'stages', actorId: state.meId, at, reason: '', before: structuredClone(before), after: structuredClone(r.candidateStages) });
    return { ...state, hr };
  }
  if (c.action === 'candidateStage') {
    const application = hr.applications.find(a => a.id === c.applicationId)!;
    const before = structuredClone(application);
    application.stageId = c.stageId;
    application.version++;
    application.updatedAt = at;
    hr.history.push({ id: `stage-${application.id}-${application.version}`, collection: 'applications', recordId: application.id, actorId: state.meId, at, action: 'candidateStage', reason: '', before, after: structuredClone(application) });
    return { ...state, hr };
  }
  let kind: 'position' | 'requisition' | 'interview' | 'offer',
    recordId: string,
    before: unknown,
    after: unknown,
    reason = '';
  let requests = state.requests;
  if (c.action === 'position') {
    kind = 'position';
    recordId = c.record.id;
    before = r.positions.find((x) => x.id === recordId);
    reason = c.record.revisionNote?.trim() ?? '';
    after = { ...c.record, code: c.record.code?.trim(), version: (c.expectedVersion ?? 0) + 1 };
    r.positions = [
      ...r.positions.filter((x) => x.id !== recordId),
      after as typeof c.record,
    ];
  } else if (c.action === 'requisition') {
    kind = 'requisition';
    recordId = c.record.id;
    before = r.requisitions.find((x) => x.id === recordId);
    after = {
      ...c.record,
      status: 'draft',
      createdById:
        (before as Requisition | undefined)?.createdById ?? state.meId,
      position: structuredClone(
        r.positions.find((x) => x.id === c.record.positionId)!,
      ),
      version: (c.expectedVersion ?? 0) + 1,
    };
    r.requisitions = [
      ...r.requisitions.filter((x) => x.id !== recordId),
      after as Requisition,
    ];
  } else if (c.action === 'requisitionDecision') {
    kind = 'requisition';
    recordId = c.id;
    const q = r.requisitions.find((x) => x.id === c.id)!;
    before = structuredClone(q);
    reason = c.reason;
    q.version++;
    q.status =
      c.operation === 'submit'
        ? 'pending'
        : c.operation === 'revise'
          ? 'draft'
          : c.operation === 'approve'
            ? 'approved'
            : c.operation === 'changes'
              ? 'changes'
              : c.operation === 'withdraw'
                ? 'withdrawn'
                : 'declined';
    if (c.operation === 'submit') {
      q.requestId = `requisition-${q.id}-${q.version}`;
      requests = [...requests, requestFor(q, at)];
    }
    if (c.operation === 'approve') {
      q.vacancyId = `vacancy-${q.id}`;
      hr.vacancies.push({
        id: q.vacancyId,
        version: 1,
        status: 'draft',
        createdAt: at,
        updatedAt: at,
        title: q.position.title,
        department: q.position.department,
        branch: q.position.branch,
        description: q.position.description,
        requirements: q.position.requirements,
        employmentType: q.position.employmentType,
        jobDetails: structuredClone(q.position.details),
        openings: q.openings,
        requisitionId: q.id,
        closingDate: q.closingDate,
        managerId: q.managerId,
      });
    }
    if (['approve', 'decline', 'changes', 'withdraw'].includes(c.operation))
      requests = requests.map((x) =>
        x.id !== q.requestId
          ? x
          : {
              ...x,
              status:
                q.status === 'approved'
                  ? 'approved'
                  : q.status === 'changes'
                    ? 'changes'
                    : q.status === 'withdrawn'
                      ? 'withdrawn'
                      : 'declined',
              updatedAt: at,
              steps: x.steps.map((s) => ({
                ...s,
                status:
                  q.status === 'approved'
                    ? 'done'
                    : q.status === 'changes'
                      ? 'returned'
                      : q.status === 'withdrawn'
                        ? 'waiting'
                        : 'declined',
                comment: c.reason,
                at,
              })),
            },
      );
    after = q;
  } else if (c.action === 'interview') {
    kind = 'interview';
    recordId = c.record.id;
    before = r.interviews.find((x) => x.id === recordId);
    after = {
      ...c.record,
      status: 'scheduled',
      version: (c.expectedVersion ?? 0) + 1,
    };
    r.interviews = [
      ...r.interviews.filter((x) => x.id !== recordId),
      after as typeof c.record,
    ];
  } else if (c.action === 'assessment' || c.action === 'cancelInterview') {
    kind = 'interview';
    recordId = c.id;
    const i = r.interviews.find((x) => x.id === c.id)!;
    before = structuredClone(i);
    i.version++;
    if (c.action === 'assessment') {
      i.status = 'completed';
      i.score = c.score;
      i.evidence = c.evidence;
      i.recommendation = c.recommendation;
      reason = c.evidence;
      const a = hr.applications.find((a) => a.id === i.applicationId)!;
      if (a.status === 'shortlisted' && c.recommendation === 'advance') {
        const previous = structuredClone(a);
        a.evidence = c.evidence;
        a.interviewDate = i.startsAt.slice(0, 10);
        a.version++;
        a.updatedAt = at;
        hr.history.push({
          id: `assessment-${i.id}-${i.version}`,
          collection: 'applications',
          recordId: a.id,
          actorId: state.meId,
          at,
          action: 'updated',
          reason: c.evidence,
          before: previous,
          after: structuredClone(a),
        });
      }
    } else {
      i.status = 'cancelled';
      reason = c.reason;
    }
    after = i;
  } else if (c.action === 'offer') {
    kind = 'offer';
    const a = hr.applications.find((x) => x.id === c.applicationId)!;
    recordId = `offer-${a.id}-${a.offerRevision}`;
    before = r.offers.find((x) => x.id === recordId);
    r.offers
      .filter(
        (x) =>
          x.applicationId === a.id &&
          ['pending', 'approved'].includes(x.status),
      )
      .forEach((x) => {
        x.status = 'superseded';
        x.version++;
      });
    after = {
      id: recordId,
      version: ((before as { version: number } | undefined)?.version ?? 0) + 1,
      applicationId: a.id,
      applicationVersion: a.version,
      offerRevision: a.offerRevision,
      salary: a.salary,
      currency: a.currency,
      startDate: a.startDate,
      terms: c.terms,
      reviewerId: c.reviewerId,
      createdById: state.meId,
      status: 'pending',
      reason: '',
    };
    r.offers = [
      ...r.offers.filter((x) => x.id !== recordId),
      after as RecruitmentState['offers'][number],
    ];
  } else {
    kind = 'offer';
    recordId = c.id;
    const o = r.offers.find((x) => x.id === c.id)!;
    before = structuredClone(o);
    o.version++;
    o.status = c.operation === 'approve' ? 'approved' : 'declined';
    o.reason = c.reason;
    reason = c.reason;
    after = o;
  }
  r.history.push({
    id: `${kind}-${recordId}-${r.history.length}`,
    kind,
    recordId,
    action: c.action,
    actorId: state.meId,
    at,
    reason,
    before: structuredClone(before),
    after: structuredClone(after),
  });
  return { ...state, hr, requests };
}
