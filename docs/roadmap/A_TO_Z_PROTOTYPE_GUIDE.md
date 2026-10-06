# A-to-Z browser prototype guide

Updated 2026-10-03. This is the implemented browser prototype scope for all twelve apps. Records persist on this device; demo people stand in for authenticated accounts. Use fictional data. The detailed advanced backlog and production release remain separate work.

## Start and configure

Run `bun run dev` and open `/discover`. Choose an existing demo company, or create a company through `/welcome`. A new company starts with its owner and empty business records. In a demo company, open Employees and choose **Load HR examples** for connected fictional HR records.

Open **My work** (`/work`) for your own tasks, assigned reviews, open requests, surveys and accessible HR queues. Task links open the exact task, survive reload and explain missing records. Global search opens individual tasks, meetings, surveys, requests and scoped HR records; it filters inaccessible apps.

From the account menu, open **Company settings** (`/settings/company`). Owners and workspace admins can set employer details, branch and department suggestions, working weekdays and holidays. Branch and department suggestions allow historical values to remain. Saving rejects invalid calendars and stale revisions. New HR leave drafts capture this calendar; subsequent company changes do not recalculate saved leave. Legacy leave keeps its existing recorded day count and historical default calendar.

App **People & roles** controls membership separately from workspace access. HR read scope, compensation grants, employee identity and task responsibilities are independent. Changing a role does not make an employee account or payment authority.

## Demonstrate each app

| App and entry | End-to-end prototype flow | Guard or recovery to demonstrate |
| --- | --- | --- |
| Requests & approvals: `/requests` | Create an active process → draft → submit → reviewer decision → returned revision/resubmission or final outcome → retained activity | Requester cannot review own request. Current reviewer or app admin can change the current reviewer with a reason and revision check; original submission remains. Recruitment requisitions retain their dedicated independent review flow. |
| Tasks: `/tasks` | Create with owner, source and requirements → planned sprint → active work → readiness/completion checks → sign-off → retained task history | Unmet requirements block a move; unfinished responsibilities must be reassigned before access removal. `/tasks?task=ID` opens a specific record. |
| Meetings: `/meetings` | Schedule with attendees/agenda → record decisions → assign linked actions → reschedule or cancel with reason | Conflicting attendee times are rejected; cancellation preserves existing actions and stops new decisions. |
| Surveys: `/surveys` | Draft questions/privacy/audience → publish → answer → review eligible results → close | Published schema is frozen. Required answers, audience, repeated response and anonymous minimum cohort are enforced. |
| Employees: `/employees` | Create or preview/reconcile CSV import → link an existing account if needed → probation/dated changes → offboard → rehire with a new employment episode | Code/email/account duplicates are rejected; outstanding custody or reviews block exit; rehire preserves history without restoring app access. |
| Recruitment: `/recruitment` | Versioned JD → independent headcount request → vacancy → candidate background/assessment → independent offer → acceptance → employee and owned onboarding tasks | Offers require reviewed terms/capacity; repeated hire does not duplicate an employee; interviewers see assigned work only. |
| Attendance: `/attendance` | Capture shift → submit → independent review or correction → close attendance period → retained snapshot | Overnight dates, duplicates and exceptions validate; reopen before correcting closed input. |
| Payroll: `/payroll` | Closed attendance → prepare illustrative period → reconcile lines → independent review → freeze → CSV preview | Currency separation and frozen inputs retained. Full base pay plus flat adjustment is illustrative; no tax, statutory deduction, settlement or payment. |
| Performance: `/performance` | Goal/period → self evidence → manager evidence/rating/development → publication → employee acknowledgment | Private manager drafts stay hidden; evidence and independent publication are required. |
| Training: `/training` | Publish course → enroll → attendance/assessment evidence → retry or completion → certificate expiry → linked draft evaluation | Enrollment alone is incomplete; criteria/attempt history retained and evaluation created once. |
| Assets: `/assets` | Register equipment → assign/return with condition → maintenance/release; reserve rooms with availability | Overlapping reservations rejected; custody must be returned before employee exit. |
| Reports: `/reports` | Choose accessible source and period/filter → live preview → save immutable snapshot → CSV export or explicit new revision | Source-app authorization is rechecked. Saved snapshots retain inputs; CSV formula protection remains. |

## Demonstrate the added workflow branches

Use app People & roles to set the required contributor/admin access and switch demo people to exercise independent decisions. Save normal record edits before opening **Additional workflows**: its selected action saves immediately and closes the record. The options shown depend on record status and your role.

- **Employees:** open an employee record → Additional workflows → Start an employee plan. Choose onboarding, probation, development or offboarding, a Tasks contributor, a due date and an optional visible course. Follow the linked tasks; Close completed plan rejects unfinished work. Initial onboarding reuses existing onboarding tasks. On a probation record, Extend probation requires a future end date and reason. Add document verification evidence, then use a different eligible Employees admin who is not the employee to verify/reject with a reason; this is recorded evidence, not external document verification.
- **Employee changes:** Schedule employee change can assign an independent Employees admin for review or explicitly record direct admin scheduling. A review decision does not apply the change; apply only when approved and effective. Pending reviewers retain their required role until the review is resolved.
- **Assets:** assigned equipment offers Transfer equipment custody with an active employee, handover condition and reason. Return custody before retiring; retirement is blocked while assigned custody or a reserved booking remains; already-retired assets cannot retire again.
- **Training:** open a course → Additional workflows → Set capacity and prerequisite. Normal enrollment checks available capacity and current completed prerequisites. Add to course waitlist, then open the enrollment and Admit from waitlist when a place and prerequisite are valid. Cancel an enrolled/waitlisted record with a reason. Course prerequisite cycles are rejected.
- **Performance:** switch to the employee account linked to a published/acknowledged review → Additional workflows → Record my response to this review. One reasoned response is retained; it does not replace the published assessment.
- **Payroll:** use a frozen preview with compensation access → Additional workflows → Preview payroll delivery. Choose success, rejected or uncertain and a reason. Repeated attempts retain the same frozen content revision. No payment, email or accounting entry is sent.

For an approved non-hiring request, an Approvals admin can schedule an **Execution preview**, then enter a reason and simulate failure, successful execution, retry or cancellation. A future effective date blocks successful execution. Applied/cancelled outcomes are final for that revision; stale forms require reopening. This request preview changes no employee or external service. Hiring requests continue through Recruitment.

Open a meeting detail → choose Decision or Meeting minutes → select Everyone with Meetings access or Selected meeting participants. The author is included automatically; additional readers must be eligible meeting participants. Record the note, then switch to an unselected person to verify that restricted content is hidden, including from workspace owners outside its audience. Cancelled meetings reject new notes.

Close a survey with responses → **Survey follow-up** as a Surveys admin who can contribute to Tasks → write an aggregate interpretation, name an improvement task and choose an eligible responsible teammate. An optional valid calendar due date is supported; the saved task links to `/tasks?task=ID`. Follow-up starts in a To do status without readiness, completion or sign-off gates. If no such status exists, ask a Tasks admin to configure one; correct an invalid due date before retrying. Validation errors preserve the entered task title, interpretation, owner and date. Anonymous follow-up requires at least three responses. Individual anonymous text and identifying answers are withheld from results; do not copy personal answers into the interpretation. This threshold does not establish statistical anonymity.

## Preview packages and scoped support

Open **Package & support** (`/settings/package`). Starter, Team and Business describe fictional buyer needs. As the owner, choose a package and enter a reason to start a 14-day trial preview, confirm a package preview or cancel an active preview. The same company cannot repeat the trial. Expand Package history to inspect retained decisions. These actions change no billing, subscription or app permissions.

As a member, save a support subject, affected app and problem; you can see your own requests and cancel an open request with a reason. As owner, approve, resolve or cancel a request with a reason. Open `/operator` as owner to inspect local company names and the current company's support history. Approval exposes only the selected app's record count for one hour; resolution, cancellation or expiry removes that count automatically, including while the page stays open. Other-company records, employee detail and compensation remain outside this preview. A member opening `/operator` receives an owner-access explanation. No external operator exists and no support agent is contacted.

## Recover without losing the original company

Owners can open **Workspace data** (`/settings/data`) to download a versioned JSON backup. Export includes that company's records, roles and settings, including sensitive record fields. Uploaded file bytes in IndexedDB are excluded; retain the original files.

Choose an Anumat backup file and inspect its company and record counts. **Restore company copy** creates a separate workspace and preserves existing companies. Unsupported or malformed backups are rejected. Removal requires the exact company name and leaves at least one company available. Members cannot export, restore or remove a company. This is local recovery, not a server backup system.

## Preview a delivery failure and recovery

Save a personal email or Telegram preview destination in **Notification settings**, then enable a channel for an accessible app. Open **Delivery previews** (`/settings/delivery`), choose the app/channel and simulate failure or success. Failed previews can be retried only while the destination remains unchanged and the channel remains enabled. Attempts persist per person and workspace. No email or Telegram message is sent.

## Verify

`bun run test:erp` covers connected domain rules, permissions, recovery, desktop/mobile journeys and the shared foundation. `bun run check-types`, `bun run check:i18n` and `bun run build` check the application. The nine `Apps/Workspace foundation` Storybook examples show work queues, empty/member states, company settings/read-only/Khmer, owner data access and delivery setup using isolated fictional state. Eight `Apps/Workflow completion` examples cover meeting notes, closed-survey follow-up, package owner/member/Khmer-dark states and operator access. The final scoped run passed 31 advanced/commercial/foundation checks and 16 desktop/mobile renders of those eight new stories. These are scoped results, separate from the full ERP gate.

Actual SME usability observations, remaining advanced backlog criteria, live authentication, tenant-safe server storage, external delivery and reviewed statutory payroll remain outside this delivery. Automated evidence does not replace product-owner acceptance or customer research.
