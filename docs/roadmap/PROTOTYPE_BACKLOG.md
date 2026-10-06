# Anumat prototype backlog

Parent plan: [Development roadmap](../../DEVELOPMENT_ROADMAP.md). All entries below are proposed work or completion checks, not claims of shipped functionality. Existing app code should be audited against the criteria before marking a ticket Accepted.

## How to use this backlog

Create one delivery epic per section, then split the listed tickets into stories no larger than a demonstrable user outcome. Prefixes are stable references for planning and acceptance evidence, not required database IDs. Every implemented story needs at least three explicit Given/When/Then criteria, a permission test, and a negative/recovery case. The examples in each section are starting acceptance criteria; expand them for the individual ticket.

Prototype flows must work in memory/local storage with fictional records. External delivery, finance calculations and integrations use explicit adapters and simulated outcomes. Add empty/loading/error/read-only/long-content stories where relevant. Local validation is prototype behavior; production server enforcement belongs to Track B.

## FND — shared product foundation (P0–P1)

| Ticket | Outcome and deliverable |
| --- | --- |
| FND-01 | Buyer/user interviews: recent problem, current steps, delay/error baseline, adoption barriers, buyer authority and decision evidence |
| FND-02 | Scope contract: twelve bounded prototype apps, first paid package hypothesis, excluded capabilities and release gates |
| FND-03 | Organization catalogue: legal employer, branches, departments, positions/JD versions, manager relationships and work calendars |
| FND-04 | Identity model: person, account, employee, candidate and employment episode; an employee can exist without a login |
| FND-05 | Permission model: workspace membership, app role, action, branch/team/own scope, sensitive fields and separate RACI |
| FND-06 | Field dictionary: stable key, type, label EN/KM, purpose, required stage, validation, allowed values/default, source, classification, readers/writers, history/retention and test reference |
| FND-07 | Status model: separate workflow, approval, execution, document verification, employment, onboarding, access and settlement dimensions |
| FND-08 | Reusable UI: entity picker, scope selector, effective-date change preview, revision/history, import mapping/errors, evidence/file preview, ledger, exception table and period freeze |
| FND-09 | Fixture generator: at least two companies for isolation plus realistic branches, personas, multilingual names, long content and scenario reset |
| FND-10 | Role surfaces: HR admin, manager team, employee self-service, public acquisition and SaaS operator preview with clear module navigation |
| FND-11 | Shared linking contract: source/target IDs and type, permitted navigation, missing/deleted/restricted record behavior |
| FND-12 | Availability model: planned, demo-ready, trial, enabled, unavailable and access denied; product capability is separate from a person's access |

Acceptance: Given an employee without an account, when HR creates a record, then employment exists without granting app access. Given a manager scoped to one branch, when selecting another branch's employee, then restricted records and sensitive fields are absent. Given two fixture companies, when switching company, then records, permissions and notification previews resolve to that company's context only.

## APR — requests and approvals (P2)

**User story:** As an authorized reviewer, I want the exact submitted revision and its relevant evidence so that I decide on stable facts and can explain the outcome.

Fields: request/process/revision IDs, type, requester/employee reference, submitted answers, relevant date/amount/currency, evidence references, review sequence/conditions, decision actor/time/reason, execution state and outcome reference. Preserve the route and form definition for an in-flight request.

States: draft → submitted → in review → approved / returned / declined / withdrawn; returned revisions resubmit under explicit rules. Execution is separately pending → applied / failed / cancelled. Delegate/reassign behavior must retain both actors and scope.

| Ticket | Outcome |
| --- | --- |
| APR-01 | Finish create/draft/submit/edit/withdraw/cancel flows and their valid transition rules |
| APR-02 | Snapshot form/route revision; show changed submission and old versus new answers on resubmission |
| APR-03 | Review with required decision fields, independent approval rules, delegation/absent reviewer and reason handling |
| APR-04 | Show approval versus execution result, failure/retry and history; future-dated HR actions are not immediately applied |
| APR-05 | Complete builder validation, conditional questions, route simulation, no-match warning and form/version history |
| APR-06 | Provide business templates for leave, headcount, offer, employee change and asset requests; templates remain editable bounded schemas |

Acceptance: Given a submitted request, when its process is edited, then its historical review route is unchanged. Given a returned request, when the requester resubmits corrected data, then revisions and earlier decisions remain inspectable. Given an approved future-dated transfer, when its approval is viewed before the effective day, then execution is pending rather than shown as already applied.

Errors/recovery: invalid conditional references, no eligible approver, self-approval where forbidden, stale revision, duplicate submit, withdrawn request, unsupported route, denied evidence access.

## TSK — tasks and sprints (P2)

**User story:** As an accountable manager, I want to agree the expected outcome, readiness, completion evidence and owner so that “Done” has an observable meaning.

Fields: work type/parent, title/rich description, expected outcome, acceptance criteria, DoR/DoD snapshots, priority, R/A/C/I, sprint, due date, evidence, source link and verified sign-off. Keep task due date independent of sprint dates.

States: configured work statuses plus separate sign-off/review state. Sprint states planned → active → completed; unfinished work moves under a selected carry-over policy.

| Ticket | Outcome |
| --- | --- |
| TSK-01 | Audit Epic → Story/Task/Bug → Subtask constraints, linked parent/child visibility and reopen/delete safeguards |
| TSK-02 | Complete controlled rich editing, draft cancellation, priorities, quick details and read-only evidence view |
| TSK-03 | Verify RACI/app-role distinction, membership checks, reassignment before removal and independent sign-off |
| TSK-04 | Demonstrate configurable sprint length, backlog, start/close/carry-over and sprint history |
| TSK-05 | Complete readiness/completion gates, failed evidence review, blocker/reason and correction paths |
| TSK-06 | Add reusable onboarding, probation, training and offboarding plans with linked employee and source request |

Acceptance: Given unmet readiness requirements, when moving to a gated active status, then explain the unmet checks and preserve the prior status. Given unfinished children, when closing a parent, then closure is blocked with child links. Given incomplete sprint work, when closing the sprint, then finished history remains and unfinished work moves exactly once to the selected destination.

Errors/recovery: removed assignee, viewer assignment, invalid parent/cycle, completed sprint, unauthorized accountable change, missing evidence and declined sign-off.

## MTG — meetings (P2)

**User story:** As a meeting organizer, I want decisions linked to owned follow-up work so that outcomes survive after the meeting.

Fields: title, purpose, timezone/date/start/end, location or meeting link, organizer, permitted attendees, agenda, related records, minutes/restricted decisions and follow-up task references.

| Ticket | Outcome |
| --- | --- |
| MTG-01 | Complete meeting creation, time validation, attendee scope and simulated scheduling conflict |
| MTG-02 | Agenda and context links with restricted/missing source record handling |
| MTG-03 | Decision/minute capture and explicit restricted visibility |
| MTG-04 | Create linked follow-up task with eligible responsible/accountable people and due date |
| MTG-05 | Reschedule/cancel, notice preview, task handoff review and meeting history |

Acceptance: Given an invalid end time, when saving, then show the correction and keep the draft. Given an attendee lacking Tasks access, when assigning a follow-up, then choose an eligible contributor rather than granting access implicitly. Given a restricted decision, when a non-permitted attendee opens the meeting, then its content and exported details remain hidden.

## SRV — surveys and evaluations (P2)

**User story:** As a survey owner, I want a clear audience/privacy setting and actionable results so that participants understand what they share and the team can follow up.

Fields: survey purpose/template, schema revision, audience and exclusions, named/anonymous setting, opening/closing dates, response state, aggregated results and linked follow-up action. Do not present responses as verified employee performance ratings.

| Ticket | Outcome |
| --- | --- |
| SRV-01 | Complete builder/templates, conditional rules, preview and required-answer validation |
| SRV-02 | Audience preview, access scope, anonymity explanation, publication and closing rules |
| SRV-03 | Respond/save/submit/reopen under explicit policy, with a frozen published schema |
| SRV-04 | Results and permitted exports with small-cohort protection and suppressed subgroup views |
| SRV-05 | Close evaluation → record interpretation → create follow-up work without exposing respondent identity |

Acceptance: Given an anonymous cohort below the threshold, when opening results or requesting an export, then individual answers and unsafe aggregates are unavailable. Given a person outside the audience, when opening the survey, then no response is accepted. Given closed results, when creating an improvement task, then it links the permitted aggregate context without revealing respondent identity.

Risk: the current threshold of three is a prototype rule, not proof of anonymity. A privacy review must consider recognizable free text, subgroup filters, repeated exports and overlapping cohorts.

## EMP — employee core, leave and employment history (P3)

**User story:** As an HR administrator, I want a dated employee dossier and controlled changes so that today's view and historical evidence are both accurate.

Fields: employee number, relevant Khmer/Latin/preferred names, contact/address, emergency contact, legal employer, branch/department/position/manager, employment episode, contract/probation, effective dates, verification/evidence and source. Compensation/payment/identity fields are restricted sections, never automatically visible to every employee-app admin. Collect only fields with a reviewed purpose.

Independent states: employment (pre-start/active/separated), probation (not applicable/pending/confirmed/extended/not confirmed), onboarding/offboarding workflow, account access and document verification. “Active” must specify what is active.

| Ticket | Outcome |
| --- | --- |
| EMP-01 | Directory/search/filter and employee overview with role-appropriate sections and self-service views |
| EMP-02 | Manual create and import preview: mapping, row validation, duplicate resolution, accepted/rejected totals and reconciliation |
| EMP-03 | Employment episodes, effective-dated assignment/contract/compensation changes, approval and application history |
| EMP-04 | Probation/renewal reminders and controlled confirmation/extension decisions |
| EMP-05 | Leave types/policy/calendar, entitlement ledger, submission/review, reservation/usage, amendment and cancellation |
| EMP-06 | Offboarding handover/access/assets/final-input tasks and completion evidence |
| EMP-07 | Rehire into a new episode, retained history, identity deduplication and freshly reviewed access |

Acceptance: Given a future approved branch change, when viewing current and future dates, then each shows the correct assignment and review history. Given a cancelled approved leave request, when reviewing its ledger, then its reservation/usage is reversed according to the explicit policy without deleting the original entries. Given a returning employee, when rehiring, then create a new employment episode and do not silently restore old app roles.

Errors/recovery: duplicate employee number/person, missing employer/manager, overlapping intervals, negative/insufficient balance, overlapping leave, holiday/partial-day ambiguity, backdated change and unauthorized sensitive-field access.

## REC — recruitment and onboarding (P4)

REC-01–REC-06 have a connected local implementation. See [Recruitment prototype](RECRUITMENT_PROTOTYPE.md) for the supported scope, demo and verification. Production integrations and customer acceptance remain separate.

**User story:** As a recruiter, I want approved hiring needs connected to applications, approved offers and employment creation so that a hire is traceable and not entered twice.

Fields: position/JD revision, requisition reason/headcount/budget currency, hiring manager/approver, vacancy/location/closing date, candidate/contact, application/vacancy/source, consent/source evidence, stage history, interview assessment, offer revision/terms, hiring checks and employment/onboarding links.

States: requisition approval, vacancy publication, application stage, offer approval/acceptance and hiring execution are independent. Accepted offer alone does not activate employment.

| Ticket | Outcome |
| --- | --- |
| REC-01 | Position/JD editor and versioned headcount requisition linked to approvals |
| REC-02 | Open/close/pause vacancy and simulated public job/application surface |
| REC-03 | Candidate/applicant records, duplicate/person matching, scoped board and stage/rejection/withdrawal history |
| REC-04 | Interview scheduling, assigned assessment criteria/evidence and interviewer-only access |
| REC-05 | Offer preparation, independent approval, locked approved revision and acceptance/decline preview |
| REC-06 | Authorized hire conversion with duplicate protection, pre-start episode and owned onboarding plan |

Acceptance: Given a revised offer, when changing approved terms, then invalidate or re-request approval before acceptance. Given a candidate with several applications, when rejecting one, then other application states remain intact. Given repeated hire conversion, when retrying, then show the same linked episode/plan instead of creating another employee.

Errors/recovery: stale JD/offer revision, duplicate application, closing vacancy with active applications, insufficient approved capacity, reviewer absence, restricted compensation and failed hire handoff.

## ATT — attendance and work periods (P4)

**User story:** As a manager, I want exceptions and corrections separated from original time records so that approved time can be trusted before period close.

Fields: employee/assignment, work calendar/timezone, shift date/start/end, original capture/source, break/work durations, leave overlap, overtime request/review, exception reason/evidence, corrected value and period state.

| Ticket | Outcome |
| --- | --- |
| ATT-01 | Work schedules/calendars and scoped employee shift assignment |
| ATT-02 | Simulated clock/import entry, overnight shift display and missing/duplicate time detection |
| ATT-03 | Employee correction request → manager review → preserved original/corrected history |
| ATT-04 | Leave overlap, overtime review, late/absence exception handling under configurable policy |
| ATT-05 | Period reconciliation/approval/close, locked period changes and controlled reopen/amendment |

Acceptance: Given an overnight shift, when reviewing it, then the start/end dates and computed illustrative duration are explicit. Given a correction, when it is approved, then the source capture remains visible alongside the reviewed change. Given a closed period, when editing a record, then require the configured reopen/amendment flow and record why.

Errors/recovery: missing clock-out, duplicated import, timezone mismatch, conflicting leave, future entry, unauthorized correction and stale period. Device, GPS, biometric or bank integrations are not prototype requirements.

## PAY — payroll-ready preview (P5)

**User story:** As a payroll reviewer, I want an approved period snapshot and reconciliation before export so that inputs do not change silently after review.

Fields: employee/employment reference, period, currency, pay basis, illustrative component/input codes, effective compensation version, approved time/leave, adjustment reason, preview totals, reconciliation flags, release reviewer, export version and sample payslip access. Monetary values use decimal-safe representations; do not use binary floating point as the authoritative money model.

States: period preparation/close, calculation preview, approval, export and payment outcome are separate. In Track A, all amounts/rules/payslips and settlement outcomes are fictional demonstrations.

| Ticket | Outcome |
| --- | --- |
| PAY-01 | Restricted period setup and approved-input collection with missing/overlapping data exceptions |
| PAY-02 | KHR/USD display and clearly fictional calculation/adjustment preview with rule/version labels |
| PAY-03 | Reconciliation worksheet: per-employee and total checks, exception resolution and preparer sign-off |
| PAY-04 | Freeze period snapshot, independent review, revision invalidation and controlled reopen |
| PAY-05 | Simulated export, sample payslip and successful/rejected/uncertain delivery states with reconciliation |

Acceptance: Given an approved period, when a current salary changes, then the period snapshot does not change. Given the preparer, when attempting independent release approval, then the configured separation rule blocks it. Given a rejected export, when retrying, then use the recorded version and show the outcome rather than marking employees paid.

Production boundary: payroll-ready input exports are recommended first. A gross-to-net engine, statutory submissions and bank payments each need separately scoped integrations, qualified current-rule review and correctness evidence. Do not advertise legal compliance from this prototype.

## PER — performance management (P5)

**User story:** As a manager, I want evidence-backed goals and review stages so that a formal evaluation can be explained and acknowledged.

Fields: cycle/period, employee and manager snapshot, goals, measure/baseline/target, weight/rubric, evidence, self-review, manager review, moderation decision, acknowledgment and development actions. Keep feedback-survey responses separate from formal review records.

| Ticket | Outcome |
| --- | --- |
| PER-01 | Cycle/rubric configuration, scoped participants, goal ownership and review dates |
| PER-02 | Employee goal/evidence updates and self-review with draft/private states |
| PER-03 | Manager assessment, missing-evidence handling and illustrative weighted-score explanation |
| PER-04 | Restricted calibration/moderation, publication and employee acknowledgment/disagreement |
| PER-05 | Development plan linked to tasks/training, review closure and history |

Acceptance: Given a draft manager review, when the employee opens their view, then unpublished content is unavailable. Given incomplete scoring inputs, when completing review, then show missing criteria rather than inventing a score. Given a published evaluation, when acknowledging or disagreeing, then preserve the evaluation and capture the response separately.

## TRN — training management (P5)

**User story:** As a training coordinator, I want learning completion supported by attendance and assessment evidence so that enrollment is not mistaken for competence.

Fields: course/version, objectives/prerequisites, session/trainer/date/capacity, enrollment, attendance, assessment result, completion evidence/certificate where applicable, expiry and evaluation link.

| Ticket | Outcome |
| --- | --- |
| TRN-01 | Course/session catalogue and scoped coordinator/trainer/learner views |
| TRN-02 | Enrollment, prerequisites/capacity, cancellation/waitlist and attendance |
| TRN-03 | Assessment and completion evidence, failed/retry/incomplete states |
| TRN-04 | Link course evaluation to Surveys without conflating feedback with completion |
| TRN-05 | Employee learning history, expiry/reminder preview and development-plan link |

Acceptance: Given an enrolled learner without evidence, when viewing progress, then show enrolled or incomplete rather than completed. Given a failed assessment, when retrying, then preserve previous attempts. Given anonymous session feedback, when inspecting the training record, then completion and private feedback remain independently governed.

## AST — assets and shared resources (P6)

**User story:** As an asset custodian, I want a verified handover and return history so that equipment ownership is clear during onboarding and offboarding.

Fields: asset number/category/serial, location/status, custodian, handover/return evidence, maintenance/due dates, retirement reason; resource name/capacity/location and reservation date/time/owner. Separate physical asset state from assignment/reservation state.

| Ticket | Outcome |
| --- | --- |
| AST-01 | Asset register/search/import preview and configurable categories/locations |
| AST-02 | Assignment/acceptance/handover → transfer → return with condition and evidence |
| AST-03 | Maintenance request/schedule/work completion and unavailable state |
| AST-04 | Shared room/equipment booking, conflict handling, cancel and permitted schedule views |
| AST-05 | Offboarding outstanding-assets review and retirement/history |

Acceptance: Given an assigned asset, when another assignment is attempted, then require transfer/return or show a conflict. Given maintenance unavailability, when reserving the resource, then explain the blocked period. Given offboarding, when closing asset clearance, then require resolution of every outstanding custody record.

## RPT — report management (P6)

**User story:** As an authorized decision maker, I want reports with known definitions and reconciled source data so that I can trust and explain their totals.

Fields: report definition/version, source apps, company/scope, period/timezone, filter parameters, generated-at, metric definition, source references, snapshot/freshness and export/review history.

| Ticket | Outcome |
| --- | --- |
| RPT-01 | Catalogue of basic workforce, leave, attendance exception, onboarding, recruitment funnel and task reports |
| RPT-02 | Scope/period/filter definition and text/table alternatives to charts |
| RPT-03 | Drill-down to permitted sources, missing data/freshness indicators and reconciliation |
| RPT-04 | Simulated export/scheduling with protected fields, success/failure/cancel states |
| RPT-05 | Saved report definitions, ownership/versioning and export history |

Acceptance: Given a scoped manager, when generating/exporting a report, then rows and fields respect the same scope as source pages. Given a headcount report date, when reconciling, then its total matches relevant effective employment episodes under its published definition. Given inaccessible source data, when viewing a drill-down, then show a permission-safe explanation without leaking hidden values.

## COM — onboarding, settings and commercial previews (P6)

| Ticket | Outcome |
| --- | --- |
| COM-01 | Company setup: organization, policies, import preview, initial app enablement and user/employee distinctions |
| COM-02 | App invitations, role/scope changes, revoked/expired/accepted states and account lifecycle previews |
| COM-03 | Per-user notification channels with verified/unverified/disconnected/simulated delivery states, retry and mute behavior |
| COM-04 | Pricing/package comparison and trial/upgrade/cancel preview with honest working versus planned capability |
| COM-05 | Operator tenant/subscription/support-request overview; approved, scoped support-access preview |
| COM-06 | Customer data export/delete request, access/privacy explanation and contact/support states |
| COM-07 | Repeatable resettable demo: owner, HR, manager, employee/recruiter/finance perspectives across two companies |

Acceptance: Given a module entitlement without membership, when opening the module, then access stays denied. Given a revoked invitation, when accepting its link, then show recovery without granting membership. Given a notification delivery failure simulation, when retrying, then state and retry history remain visible without claiming external delivery.

## INT — lifecycle connection and prototype acceptance (P7)

| Ticket | Outcome |
| --- | --- |
| INT-01 | Approved position → recruitment → hire → one episode/onboarding plan → asset/training/probation evidence |
| INT-02 | Existing employee import → validation/reconciliation → activation → self-service access |
| INT-03 | Leave approval/cancellation → ledger → attendance context → frozen payroll-ready input |
| INT-04 | Effective employment change → approved/applied distinction → manager/access/time/payroll updates |
| INT-05 | Meeting decision → task/DoR/DoD/RACI → verified completion → follow-up |
| INT-06 | Offboarding → access/asset/final-input handoff → separated episode → controlled rehire |
| INT-07 | App/workspace/scope/field isolation, restricted deep links, deleted references and replay/retry behavior |
| INT-08 | Khmer/English, phone/desktop, light/dark, keyboard/focus and content/error coverage for all critical screens |
| INT-09 | Observed user sessions, findings triage, fixes and G1 acceptance evidence |
| INT-10 | G2 production handoff: accepted prototype scope, domain rules, API/adapters contracts, fixtures, risks and deferred features |

See [the acceptance matrix](PROTOTYPE_ACCEPTANCE.md) for test IDs, expected evidence, demo scripts and the completion checklist. Implementing these tickets is future work; writing this backlog does not change the planned modules' availability.
