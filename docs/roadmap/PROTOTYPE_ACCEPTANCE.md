# Prototype acceptance and production handoff

Parent: [development roadmap](../../DEVELOPMENT_ROADMAP.md). Tickets: [prototype backlog](PROTOTYPE_BACKLOG.md).

Status: planned criteria; not a test-result report. Storybook now includes HR examples and automated domain/browser checks exist. This matrix still describes broader acceptance criteria; see IMPLEMENTATION_STATUS.md for delivered subsets and test evidence. Do not mark an entire row passed from a narrower test.

Automated prototype gate: `bun run test:erp`. See the
[coverage mapping and limits](IMPLEMENTATION_STATUS.md#repeatable-erp-acceptance-gate)
for the implemented subsets and the generated Playwright HTML/JSON evidence.
This gate does not change the broader matrix verdicts below.

## 1. Evidence register

For each acceptance ID record: requirement/ticket, fixture version, build/commit, actor and company/scope, steps, expected/actual outcome, device/language/theme, evidence link, defect ID, owner, date and verdict. Do not put real personnel data in screenshots or public evidence.

Allowed verdicts: Not run, Pass, Fail, Blocked, Removed from approved scope. Removed scope needs a reason/owner and must also disappear from demo promises and release claims. A skipped test is not a pass.

- P0 blocking: unauthorized disclosure, destructive history loss or incorrect financial/balance outcome; stop acceptance.
- P1 blocking: an agreed critical journey cannot complete or recover; fix before G1.
- P2: recoverable friction or incomplete noncritical state; agree owner/date before acceptance.
- Cosmetic: record separately; do not let open-ended visual polishing replace functional completion.

## 2. Minimum module acceptance matrix

All rows below: **Not run** for this roadmap. At least one negative case must be demonstrated for each happy path.

| ID | Actor / scenario | Expected outcome and recovery evidence | Related tickets |
| --- | --- | --- | --- |
| AC-F01 | Employee exists without a login | HR record is available to authorized HR; no account/app access is created | FND-04/05 |
| AC-F02 | Switch between two companies | All records, source links, preferences and roles resolve to selected company; forbidden IDs remain inaccessible | FND-05/09 |
| AC-F03 | Manager opens own versus another team | Permitted team data only; restricted field values absent from view/search/export | FND-05/10 |
| AC-F04 | Open module without entitlement or membership | Explain correct recovery; neither grant is inferred from the other | FND-12, COM-02/04 |
| AC-A01 | Submit, return, revise and resubmit request | New review binds to the new revision; old evidence/decisions remain inspectable | APR-01/02 |
| AC-A02 | Edit process while request is in review | In-flight request keeps its submitted route/form snapshot | APR-02/05 |
| AC-A03 | Approve future-dated change and simulate application failure | Approval visible separately from pending/failed execution; correction/retry is owned | APR-03/04 |
| AC-T01 | Move task before readiness or completion gates | Block invalid move and identify unmet requirements; preserve draft and prior status | TSK-02/05 |
| AC-T02 | Complete parent with unfinished child | Block completion; accessible link identifies unfinished child | TSK-01 |
| AC-T03 | Close sprint with mixed finished/unfinished work | Preserve finished history; move unfinished items once to chosen destination | TSK-04 |
| AC-T04 | Remove/downgrade assignee with unfinished R/A work | Require reassignment; no silent orphaning or viewer mutation rights | TSK-03 |
| AC-M01 | Schedule/reschedule/cancel meeting and create action | Valid dates/times, appropriate notification preview and linked eligible follow-up owner | MTG-01/04/05 |
| AC-M02 | Read restricted meeting decision | Only allowed people see it; unauthorized export/source navigation leaks nothing | MTG-02/03 |
| AC-S01 | Publish, respond, close and review survey | Audience and schema stable; outside/late participant denied with recovery | SRV-01/02/03 |
| AC-S02 | View/export small anonymous cohort or subgroup | Suppression applies consistently; recognizable answers are not revealed by another route | SRV-04 |
| AC-S03 | Create action from survey finding | Link allowed aggregate context; formal performance rating remains a separate object | SRV-05, PER-01 |
| AC-E01 | Import employee records containing duplicates/errors | Preview mapping and row errors; reconcile accepted/rejected records without fabricated hiring history | EMP-01/02 |
| AC-E02 | Approve and apply dated transfer/promotion | Past/current/future views correct; original episode and reviews remain intact | EMP-03 |
| AC-E03 | Request, deny, approve, amend and cancel leave | Policy determines reservation/usage; explicit ledger entries/reversals reconcile | EMP-05 |
| AC-E04 | Offboard and rehire employee | New episode, preserved relevant history, owned clearance and reviewed fresh access | EMP-06/07 |
| AC-R01 | JD/requisition → vacancy → assessed application → offer | Versions, scoped actors, capacity and decision evidence stay linked | REC-01–05 |
| AC-R02 | Revise approved offer or hire twice | Revised terms require review; repeat hire creates no duplicate episode/plan | REC-05/06 |
| AC-R03 | Candidate has two applications | Updating/rejecting one does not overwrite the other; interviewer sees only assigned scope | REC-03/04 |
| AC-H01 | Overnight/missing/duplicate attendance | Explicit dates/source, exceptions and reviewable corrections; original captures preserved | ATT-01–03 |
| AC-H02 | Leave/overtime conflict and period close | Resolve exception before approval; closed period edits follow controlled amendment/reopen | ATT-04/05 |
| AC-P01 | Prepare/reconcile/approve/freeze payroll-ready period | Exact illustrative input totals reconcile; snapshot/version fixed | PAY-01–04 |
| AC-P02 | Change salary after period approval | Approved period values unchanged; new period uses correct effective values | PAY-04 |
| AC-P03 | Preparer tries release; export fails/uncertain | Independent review enforced; export outcome does not imply payment/settlement | PAY-04/05 |
| AC-V01 | Goals → self review → manager review → publish → acknowledgment | Evidence/criteria required; private drafts hidden; response does not rewrite published assessment | PER-01–04 |
| AC-V02 | Review creates training/development plan | Owned tasks/course links, correct employee and retained review history | PER-05, TRN-05 |
| AC-L01 | Enroll/attend/assess course | Enrollment alone is incomplete; attempts and completion evidence retained | TRN-01–03 |
| AC-L02 | Evaluate course and review expired evidence | Feedback privacy independent; expiry and renewal actions clear | TRN-04/05 |
| AC-X01 | Assign/transfer/return asset | Unique active custody and recorded condition/evidence; conflicts explain recovery | AST-01/02 |
| AC-X02 | Reserve unavailable/conflicting resource | Prevent overlap/unavailability; cancel releases reservation and preserves history | AST-03/04 |
| AC-X03 | Complete offboarding with unreturned equipment | Clearance blocked or explicitly approved exception; never silently discard custody | AST-05 |
| AC-Q01 | Generate dated headcount/leave report | Definition, date/scope/freshness explicit; source records reconcile to totals | RPT-01–03 |
| AC-Q02 | Export/report drill-down with restricted fields | Same field/scope policy as source screens; failed export visible and recoverable | RPT-03/04 |
| AC-C01 | Accept/revoke/expire invitation | Pending grants no access; valid acceptance only grants reviewed app/scope | COM-01/02 |
| AC-C02 | Configure channels; simulate failed delivery/disconnect | Event/user/channel independent; no external send claimed; retry/mute respects access | COM-03 |
| AC-C03 | Trial/upgrade/operator support demo | Entitlement scope accurate; support access explicit/limited; payments labeled preview | COM-04/05 |
| AC-C04 | Request customer export/deletion/support | Identity/scope and confirmation are clear; simulated fulfillment never claims real destruction | COM-06 |

## 3. Connected demo scripts

### Demo A — employee-first package

1. Company admin completes setup with branches, manager and reviewed fictional policy.
2. HR previews a small import with a duplicate and missing required field; resolves/rejects rows and reconciles records.
3. HR activates an employee; manager sees their team, employee sees their own self-service.
4. Employee submits leave; manager approves; balance/reservation and attendance calendar update consistently.
5. Employee cancels/amends under the explicit policy; history and ledger reconcile.
6. Manager checks a scoped report; unauthorized compensation stays hidden.
7. Show the same journey in Khmer on a phone.

Pass requires no unexplained balance changes, leaked sensitive fields or inaccessible next action. Relates to INT-02/03/07/08.

### Demo B — hire-to-ready

1. Create a position/JD revision and approved requisition; open vacancy.
2. Add candidate with multiple applications; assign scoped interview and record assessment evidence.
3. Prepare/approve offer; revise terms and demonstrate reapproval; simulate acceptance.
4. Authorize hire once; retry and show the same linked episode/onboarding plan.
5. HR/manager/IT complete owned tasks; assign asset; enroll/assess training.
6. Show that unfinished onboarding/probation and account access are independent from employment state.

Pass requires linked provenance and no duplicate employment/task plan. Relates to INT-01.

### Demo C — controlled change and departure

1. Propose future-dated transfer/compensation change with restricted fields and independent review.
2. Show approved versus pending application; simulate failed execution and recovery.
3. Compare prior/current/future assignments and a previously frozen payroll-ready period.
4. Start separation; show outstanding asset/access/final-input tasks and permitted exceptions.
5. Close the episode after clearance; preserve history; rehire with a new episode and reviewed access.

Pass requires preserved history, correct effective dates and no silent access restoration. Relates to INT-04/06.

### Demo D — everyday work and feedback

1. Organizer creates meeting with permitted context and decisions.
2. Decision creates task with RACI, outcome, priority and readiness/completion criteria.
3. Move through sprint/work statuses; show unmet gates, evidence review and sign-off.
4. Publish training feedback; demonstrate small-cohort suppression and permitted aggregate action.
5. Review task/report source links as a viewer without gaining editing privileges.

Pass requires clear ownership and permission-safe cross-app links. Relates to INT-05/07.

## 4. Coverage strategy

Avoid multiplying every test by every device/language/theme without a reason.

- Critical lifecycle/permission/ledger/revision behaviors: automated domain/flow checks with positive and negative cases.
- Every critical journey: desktop English/light and mobile Khmer/dark; also check desktop Khmer and mobile English where layout/text differ.
- Shared controls: isolated Storybook states plus focused keyboard/focus/error tests; add stories for new patterns rather than recreating existing primitives.
- All new screens: empty, loading, error, populated, read-only, denied, long name/title and missing source states where relevant.
- At least two companies and several scopes: intentional same-looking IDs/names, revoked membership, inactive employee, future changes, separated/rehired episode.
- Observed usability: at least five representative participants, recording task success, assistance, misunderstanding and recovery; no fabricated percentages.
- Performance: measure launcher/editor/report load and interaction on representative phones. Establish an agreed budget from actual measurements; reject new unbounded table/diagram rendering or repeated loading regressions.

The prototype cannot prove server tenancy, external delivery, private-storage enforcement, server backup recovery or bank reconciliation. Versioned browser-local workspace export and restoration as a separate company are implemented and tested; uploaded file bytes are excluded. Its acceptance proves the bounded simulated behavior and documents the production contract.

## 5. G1 prototype completion checklist

- [ ] All twelve apps have an agreed bounded end-to-end flow, objects, roles, fields, valid transitions and histories.
- [ ] Six connected journeys in the roadmap pass with fictional fixtures.
- [ ] Required acceptance IDs have actual verdict/evidence; no P0/P1 blocker remains.
- [ ] Existing employees can be imported without fabricated recruitment records.
- [ ] User/account/employee/app role/RACI distinctions are clear in data and UX.
- [ ] Effective dates, revision snapshots and leave/period history demonstrate correct change/reversal behavior.
- [ ] Every restricted action has a tested permitted and denied example, including deep links and exports.
- [ ] Anonymous surveys do not leak through alternate result/export/filter views within the agreed prototype scope.
- [ ] Planned/demo-ready/trial/enabled/access-denied labels are accurate; no working app is inferred from a card alone.
- [ ] Critical Khmer/mobile/keyboard/error paths pass and observed usability meets the agreed target.
- [ ] Expanded Storybook, docs, resettable demo and fixture version are available.
- [ ] Real delivery, statutory money and integrations remain labeled simulation.
- [ ] Customer/product owner accepts the prototype scope and remaining nonblocking/deferred items in writing.

## 6. G2 production handoff checklist

- [ ] First paid release includes a frozen must-have workflow and explicit exclusions.
- [ ] Field catalogue, permission matrix, record/status definitions and transition rules match the accepted prototype.
- [ ] Each future backend use case has input/output/error/permission/retry/idempotency contracts; implementation technology is selected through a decision record.
- [ ] Production architecture, identity, tenant enforcement, private files, database/jobs and operational owners are selected.
- [ ] Import reconciliation, revision/concurrency, sensitive data purposes, retention and country-policy review requirements are recorded.
- [ ] Customer pilot candidate, outcome baseline, training owner, support model and cost assumptions are named.
- [ ] Pricing hypothesis matches working v1 capability; payroll responsibility tier is explicit.
- [ ] Prototype-to-production gap register identifies every local-only behavior that must be replaced.

## 7. Production sale gate reminder

G1/G2 authorize production development, not live employee operations. Before G3/G4, prove verified identity, durable tenant-safe storage and server authorization, protected files, controlled jobs/notifications, reviewed policy scope, reconciled imports, backup restore, monitoring, incident/support ownership, customer data controls and a correctly represented commercial package. A pilot containing real personnel data must meet this gate.
