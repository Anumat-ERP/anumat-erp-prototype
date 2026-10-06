# Prototype implementation status

Updated 2026-10-03. Target: Cambodian small and medium businesses. This delivery implements connected local HR workflows across all twelve launcher apps. It does **not** mark the complete detailed roadmap, customer acceptance, or production/commercial release as finished.

Recruitment has since been expanded through REC-01–REC-06. Its latest full application regression passed 226 checks with six existing device-specific skips, and built Storybook verification passed 488 checks. See [Recruitment prototype](RECRUITMENT_PROTOTYPE.md) for its complete local workflow and demo.

## Shared foundation extension (2026-10-03)

The twelve-app prototype now includes a role-aware **My work** queue, exact task links with reload/missing-record recovery, and global search for individual tasks, meetings, surveys and scoped HR records. Workspace owners/admins can edit company details and branch/department suggestions, working weekdays and holidays with revision checks. Saved leave retains a calendar snapshot.

Owners can download a versioned JSON workspace backup, validate/preview it, restore a **separate** company copy, and remove a local company with exact-name confirmation while keeping at least one. File bytes are excluded. Personal delivery previews simulate success/failure and retained retry attempts, with destination/channel/access guards. Approval reviewer handoff keeps a reason/history and stale-review checks; requesters cannot reassign their own reviews and recruitment requests retain their dedicated review rules.

See [A-to-Z prototype guide](A_TO_Z_PROTOTYPE_GUIDE.md) for setup and the twelve workflows. This implements bounded local flows; advanced roadmap items, human usability acceptance and production services are not marked complete.

### Current foundation verification

- ERP: **166 distinct checks pass** using latest evidence from the 164-case full run, the six corrected field-selector reruns, and the new desktop/mobile search checks. The expanded foundation suite contains five domain checks and six browser scenarios on two devices. Initial failures and corrected results are retained in `.impeccable/review/foundation/`; this is combined evidence, not a single uninterrupted 166-case run.
- Related Home/shell/notifications/task-requirements/sprint regression: **30 pass, 2 device-specific skips**. Skips are not passes.
- Nine built foundation Storybook examples: **18 pass** across desktop/phone. Built catalog contains 252 stories; this delivery does not claim a fresh full-catalog verification.
- Production build, application/test/Storybook type checks, translation audit and whitespace checks pass. Sixteen English/light and Khmer/dark foundation captures plus two reviewer dialogs are valid, with no measured page overflow/browser errors. The reviewer scored the working-day alignment fix resolved and returned **ship** at that scoped verdict.
- Combined machine-readable evidence: `.impeccable/review/foundation/verification.json` (ignored review artifact). For repeatable checks, run `bun run test:erp`, the documented static commands, and `bun run test:storybook -g apps-workspace-foundation` after building Storybook.

## Delivered workflows

| Area | Implemented behavior |
| --- | --- |
| Foundation | Typed HR state, additive migration, workspace isolation, independent employee/account identity, employment episodes, app membership and own/department/all read scopes, version checks, before/after history, semantic shared UI controls, English/Khmer copy |
| Employees | Manual creation, unique code/email/account checks, directory/search/status filters, own record view, separate compensation read/write grants, fixed-template CSV parsing/validation/reconciliation, effective-date change queue and application, probation confirmation, offboarding safeguards, access revocation, rehire without restoring access |
| Recruitment | Versioned rich JDs with reporting lines, responsibilities, qualifications, conditions and salary visibility; duplication/archive/restore and revision snapshots; independent headcount decisions linked to Approvals, publication/pause/close and career preview, scoped pipeline and assigned assessments, structured education, employment, skills, projects and recruiter notes, resume files, independent budget-bounded offer snapshots and revision recovery, pre-start employment, one employee/episode and three owned onboarding tasks per hire |
| Leave | Draft → pending → independent approval/decline/withdraw → cancellation, saved working-calendar/holiday calculation, overlap and balance checks, append-only usage/reversal entries, closed-period protection |
| Attendance | Manual shifts, overnight hours, duplicate checks, submit/review/correction, reason history, overtime input bounds, exception blocking, period close/snapshot/reopen |
| Payroll | Closed-attendance prerequisite, permission checks, currency separation, line reconciliation, prepared → independent review → frozen, retained input snapshots, correction/reopen, CSV preview export |
| Performance | Measurable goal and period, self evidence → manager evidence/rating/development → publication → employee acknowledgment, private draft assessment fields |
| Training | Course publication, unique enrollment, attendance, assessment evidence, criteria snapshot, failed attempts/retry, certificate expiry, one linked draft evaluation |
| Assets | Unique register codes, equipment assignment/return, recorded condition and history, maintenance/release, room reservation collision checks, offboarding custody guard |
| Reports | Defined headcount/leave/attendance/payroll/assets/training sources, department/date filters, source-admin checks, live table preview, immutable snapshots/revisions, CSV exports with spreadsheet formula protection |
| Approvals | Submitted form and step-field snapshots, archived returned revisions, earlier answer/decision display, requester/reviewer guards and duplicate-submit protection |
| Meetings | Attendee conflict checks, reschedule/cancel with reasons and history, cancelled listing, retained linked tasks, cancellation disables new meeting decisions/actions |
| Surveys | Frozen published schema/privacy/audience, required-response validation in store, cleaned answers and duplicate-response protection |
| Notifications | HR and meeting-change events filtered by app access and record scope; personal in-app/email/Telegram preferences remain simulated |
| Storybook | 252 total stories, including 22 HR examples, 13 dedicated recruitment stories and 9 shared foundation examples and actual permission, empty, detail, and Khmer surfaces |

Existing tasks/sprints, DoR/DoD, RACI, rich editing, approval simulation, normalized controls, and Discover motion remain integrated.

## How to demonstrate

1. Start `bun run dev`, open `/discover`, and choose Employee management. Use **Load HR examples** as Dara, the Lotus workspace owner. Examples are added only to an HR workspace that has no employee/vacancy/asset records. Nothing is sent externally.
2. Open Recruitment → Candidates → Sophea. Shortlist, record interview, request independent offer approval from Alex, approve as Alex, return to Dara to issue the offer, accept, and hire. Open the resulting employee and inspect the three source-linked onboarding tasks in Tasks. The employee has no login account or automatic app grants.
3. Create leave for Alex for one or more weekdays. Submit, approve as Dara, inspect the balance, and cancel with a reason. Original usage and reversal remain in the ledger. Alex cannot approve his own leave.
4. Record Alex's shift, submit it, and approve as Dara. Create an attendance period covering the desired pay period and close it. Pending shifts prevent closure. Approved shifts require an explicit correction cycle; closed inputs cannot be edited.
5. Create a USD pay period, prepare as Dara, switch to Alex for independent review, and freeze. Export the preview. Reopen payroll before reopening the underlying attendance period. Calculation is **full current base pay + flat per-employee adjustment**. It does not calculate proration, tax, NSSF, overtime pay, legal deductions, payments, or settlement.
6. Create a performance review for Alex, launch it, enter self evidence, submit to manager review, enter manager evidence/rating/development, publish as Dara, and acknowledge as Alex. Publishing one's own assessment is blocked.
7. Enroll Alex in the sample course. Record attendance and an evidenced assessment. A failed score can be retried and both attempts remain. A completion can create a draft survey; review its audience/privacy before publishing it.
8. Assign the laptop to an employee, inspect history, and return it. Reserve the Angkor room; an overlapping reservation fails and adjacent times work. Offboarding blocks unresolved custody, tasks, approval reviews, leave, direct reports and scheduled changes. Completed offboarding removes app memberships, compensation grants, scope overrides and matching pending invitations; rehire does not restore access.
9. Create a report, read its definition, inspect rows, save a snapshot, and export. A report admin still needs source-app admin access. Currency totals remain separate. Headcount counts employment episodes at the period end; assets describe current custody rather than historical custody.
10. In Employee people/roles, grant an eligible Employee admin compensation read or write access separately. App admin status alone does not grant salary access. Member scope starts at own records; department scope requires the same branch and department.

## Architecture and maintenance

- `src/hr/types.ts`: domain records, collections, commands, links and optional state additions.
- `src/hr/engine.ts`: shared permission/lifecycle/validation rules and immutable command application. The UI and store call the same validator.
- `src/hr/catalog.ts`: module schemas, labels, statuses and report definitions.
- `src/hr/HRWorkspace.tsx`, `HRTools.tsx`: shared workspace/detail surfaces, import/change preview and permission tools. Controls come from `@app/ui`.
- `src/hr/import.ts`, `export.ts`: bounded CSV import and export behavior.
- `src/data/store.tsx`: per-workspace persistence and HR command dispatch; approval/meeting/survey invariants.
- `src/i18n/messages.hr.ts`: system copy translations. The audit also checks indirect schema labels and lifecycle errors. User-authored values remain unchanged.
- Existing browser data is retained. The optional `hr` state initializes empty; examples are explicit. Prototype permissions are UI/store behavior, not a substitute for production server authorization.

## Verification evidence

| Check | Evidence |
| --- | --- |
| Domain invariants | `tests/hr-domain.spec.ts`: hire idempotency, offers, ledger reversals, overnight/correction periods, independent payroll review, scope, imports, effective changes, offboarding/rehire, training criteria/attempts, reservations, reports, manager cycles, salary grants |
| Existing workflow invariants | `tests/workflow-domain.spec.ts`: approval schema snapshots, returned revisions/ownership, meeting conflicts/history, published surveys and response validation |
| Actual HR UI | `tests/hr-workspace.spec.ts`: all eight dashboards/workspaces/teams, hire-to-employee, import recovery/persistence, future-date recovery, own record/private fields, workspace isolation, Khmer dark mode, invalid date draft preservation |
| Meeting UI | `tests/meeting-lifecycle.spec.ts`: reschedule/cancel, history, task retention and cancelled listing |
| Regression suite | `bun run test:e2e --workers=3` |
| Storybook | `bun run check:storybook`, `bun run build-storybook`, and built-artifact browser checks |
| Static checks | `bun run check-types`, `bun run check:i18n`, `bun run build` |

Final verification on 2026-10-02:

- Full application regression: **188 passed, 6 existing device-specific skips**. Subsequent additions and final access changes passed focused runs of **56** and **52** checks respectively.
- Full built Storybook verification: **466 passed**. After the final access changes and rebuild, **114 affected Storybook checks passed**.
- Type checking (including stories), translation audit, application build, Storybook build and `git diff --check` passed.
- Focused coverage includes pending approval safeguards during offboarding, removal of compensation/scope/invitation access, meeting request links respecting app membership, and CSV exports retaining negative numeric adjustments while escaping formula-like text.
- Desktop and mobile HR directory layouts were visually inspected.

The broader acceptance matrix remains unpassed unless all of an acceptance row's conditions have evidence. These checks verify the implemented prototype; they do not establish customer acceptance or production readiness.

## Repeatable ERP acceptance gate

Verified locally on **2026-10-03**: `bun run test:erp` completed with **149 passed,
0 failed, 0 skipped, 0 flaky** (91 desktop/domain checks and 58 mobile checks).
This includes 40 added browser checks: nine ERP scenarios, three filter-reset
regressions and eight keyboard/two-tab recovery journeys, each on desktop and mobile. Application build/type checking,
translation audit, Storybook type checking, separate type checking of the acceptance/recovery helpers
and specs and ERP configuration, and whitespace checks passed. The generated report is
`playwright-report/erp/index.html`; machine-readable evidence is
`test-results/erp-results.json` (both are ignored build artifacts).

Run `bun run test:erp` (configuration: `playwright.erp.config.ts`). It combines the
existing HR/recruitment/workflow domain checks, workspace and dashboard journeys,
configurable candidate stages, roles/invitations, meeting lifecycle, and the new
`tests/erp-acceptance.spec.ts` scenarios. Browser flows run in desktop Chromium
and mobile Chromium with iPhone 13 emulation. Pure domain files run once.
Existing layout tests cover Khmer/dark mode; the new business scenarios use
English/light mode on both device sizes.

| Automated subset | New browser evidence |
| --- | --- |
| AC-F01, AC-E02/E04, AC-X01/X03 | Create an employee without login, apply a dated promotion, block exit with assigned equipment, return equipment, exit and rehire with retained episodes |
| AC-E03 | Reject self-approval and overlapping leave; preserve failed draft, reconcile approved usage and cancellation reversal after reload |
| AC-H01/H02, AC-P01/P03 | Overnight shift equals eight hours; pending attendance blocks closure, open attendance blocks payroll preparation, separate reviewer required, exact line/export totals, frozen input guards |
| AC-L01/L02 | Missing evidence rejected, failed assessment retained, retry uses enrollment criteria despite changed course, dated certificate and one linked evaluation |
| AC-X02 | Reject conflicting room times, recover the same draft, accept adjacent times, cancel and reuse a reservation slot |
| AC-Q01 | Department-filtered report and CSV agree; saved snapshot survives new source records until an explicit revision |
| AC-V01 | Self evidence, manager evidence, rating and plan required; independent publication and employee-only acknowledgment with actor history |
| AC-F03, AC-Q02 | Grant Reports admin via People & roles, then reduce source access; previously saved results/export disappear and forbidden employee deep links reveal no record |
| AC-R02 | Revised pay supersedes the approved offer and requires a fresh independent decision; hire creates one employee, one episode and three source-linked onboarding tasks |

`tests/erp-recovery.spec.ts` adds eight recovery scenarios on both device sizes:

- Complete leave creation, submission, approval and cancellation using Tab,
  Enter and text input, without mouse clicks or programmatic focus after setup.
- Recover from invalid employee input, retain a draft, dismiss nested dialogs
  with Escape, and return focus to the original action.
- Detect an employee revision saved in another tab, retain the unsaved draft,
  prevent stale saving, reopen current data and complete a new edit.
- Preserve an asset update when another tab saves an unrelated employee draft.
- Apply a permission downgrade to an already open form while keeping the tab's
  selected persona; no further writes are available.
- Explain a stale job-description draft and provide close/reopen recovery.
- Keep company selection separate across tabs and preserve each company's data,
  including assets with the same local identifier.
- Reject an approval confirmation after another tab has declined the request;
  preserve the newer decision and leave ledger without extra history entries.

The browser store now receives saved changes from other tabs without echoing
writes or switching the receiving tab's company/persona. HR editors retain the
revision originally opened so a new revision makes the draft stale. Recruitment
editors explain why a stale draft cannot be saved. This is local browser-tab
recovery; it does not provide server transactions or prove simultaneous-write
safety across real user sessions.

The new scenarios create business records and switch reviewers through the UI;
local storage is read only for persisted-state assertions. Rejected transitions
must preserve all stored records and history. Each starts with isolated example
data and a controlled, advancing clock. Unexpected browser exceptions in either tab fail the
test. The gate uses no automatic retries. HTML/JSON reports and failure
screenshots/traces are generated locally; `.github/workflows/erp-tests.yml` retains
CI evidence for 14 days. CI execution itself is verified when that workflow runs.

The acceptance run exposed a filter-reset race: a queued search could restore
old URL filters after **Clear filters**. HR record lists, the candidate pipeline
and recruitment record lists now filter locally without that delay.
`tests/hr-workspace-ux.spec.ts` includes controlled-clock regressions for all
three surfaces; each reproduced the failure before the fix and verifies cleared
search/filters and restored records after a reload.

These are subsets of the roadmap acceptance IDs, not passes for the full rows.
They do not exercise a real multi-user server, external delivery, backups,
jurisdictional payroll calculations or Safari/WebKit.

## Remaining roadmap scope

The eight HR apps are bounded workflow prototypes, rather than completion of every ticket in `PROTOTYPE_BACKLOG.md`.

- P0: buyer interviews, scope sign-off and customer outcome baselines require actual people/evidence.
- P1: richer legal-employer/branch/position catalogues, holiday calendars, complete field/retention dictionary, broader action/branch permissions and entitlement/commercial states.
- P2: delegated/absent approval reviewers and execution adapters, restricted meeting minutes, complete survey follow-up/privacy reviews, additional workflow templates and failure simulations.
- P3–P4: document verification, probation extension/renewal, approved assignment/contract changes, richer leave policies/partial days/holidays, external recruitment publishing/offer adapters, attendance imports/schedules/device adapters and overtime policies.
- P5: jurisdiction-reviewed payroll-ready rules and payslip/export failure previews, linked development/training plans, certification renewal policies.
- P6: evidence-backed asset handovers/transfers, historical custody reporting, richer scoped reporting/drill-down, trial/entitlement/operator/commercial simulations and account/data lifecycle previews.
- P7: complete the remaining acceptance matrix, recovery/accessibility scenarios and guided customer testing; record genuine G1/G2 evidence.
- Track B: real authentication, tenant-safe backend/database/files/jobs, external notifications, payroll/legal validation, billing, operations and recovery, pilots and paid release. No production release or deployment happened in this delivery.

These outstanding items remain visible so implemented screens are not mistaken for customer or production acceptance.

### Operational dashboards and workflow entry points

The nine Employees, Attendance, Payroll, Performance, Training, Assets, Reports,
Surveys and Meetings dashboards now connect summary counts, attention records,
recent activity and permitted quick actions to actual workspace workflows.
HR lists include collection guidance and contextual details, with persistent URL
filters. Meeting search/status/participant filters and survey status/waiting
filters also persist in URLs. HR lifecycle controls share command permission
checks and report successful saves/actions.

`tests/app-workflows.spec.ts` exercises all nine entry points and desktop/mobile
English/Khmer layouts, shift submission/approval and attendance closure, payroll
preparation/independent review/freeze/export, leave approval and its ledger,
self/manager performance review and acknowledgment, training assessment and linked
evaluation creation, asset assignment/return, report snapshot/export, meeting
scheduling/decisions/action tasks/search and survey publishing/answering/closing.
This is evidence for the browser-local prototype; the outstanding production and
advanced acceptance items above remain applicable.

### HR workspace usability pass

The eight HR apps now use grouped record forms, workflow actions before the fields,
compact record lists, attention views, name/recent sorting, and 20-row pagination.
Record filters/page survive closing the editor; specialized recruitment filters
also persist in URLs. New self-service forms preselect the linked employee,
missing required reference records block creation with a recovery explanation,
and unsaved field edits have a discard confirmation. Each app has an expandable
workflow guide. No additional sidebar entries are needed.

`tests/hr-workspace-ux.spec.ts` verifies complete field coverage, sorting before
pagination, attention filtering, reload/close context, missing prerequisites and
new/existing draft preservation. The existing HR, recruitment and cross-app
workflow suites cover the redesigned controls on desktop and mobile. These changes
improve the bounded prototype; the Remaining roadmap scope still applies.
