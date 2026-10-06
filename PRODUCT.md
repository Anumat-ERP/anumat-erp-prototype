# Anumat ERP prototype

Anumat is a decision and operations ERP prototype. Its current MVP brings requests,
approvals and configurable approval processes into one workspace. Purchase, leave,
expense and contract requests carry their context, attachments, approval route,
status and activity history. Operations, finance and people teams are the audiences
named in the existing product copy.

The prototype runs entirely in the browser. Its demo workspaces and people come from
`src/data/seed.ts` and `src/data/seedMekong.ts`; requests, approval processes, and
templates start empty. Older browser storage is cleaned of shipped workflow examples
while user-created records remain. Changes persist in local storage. Sign-in,
invitations, notifications and sales submission demonstrate
flows. They do not authenticate an account, send messages or provision a server.
The account menu switches demo people and resets demo data. Login and SSO lead
to a six-digit verification demo using code `123456`. Recovery opens a local reset
preview; it sends no email and saves no password. Remember me saves only the
email address on this device.

Public routes include the landing page, sign-in, workspace setup and pricing.
The first entry to each workspace opens a module catalog for Requests & Approvals,
Tasks, Meetings, Surveys & evaluations, and local prototypes for Assets management, Reports, Attendance, Employees, Payroll, Performance, Training and Recruitment. Returning entries open the last selected app’s dashboard;
the sidebar keeps the catalog available at any time.
Workspace setup captures company name and size, then an Approvals & tasks, People & HR, or all-app starting point. The draft resumes on this device. New companies contain only the current owner and empty business records; demo companies remain separate. Owners get an optional checklist linked to real records and prerequisite-aware actions. Teammates are added inside each app after creation. The catalog is the app launcher and hides Dashboard and app menus. Selecting an app
opens its dashboard with only that app’s navigation. The selection is remembered
per workspace on this device; direct app routes also establish the selection.
The approvals dashboard keeps the approval loop, Waiting on you, and Your requests visible. Reports & recent activity is collapsed by default and preserves the chart, average decision timing, and activity controls when expanded. Tasks and Meetings show their
own counts and upcoming work. Requests & Approvals has
requests, approvals, insights and approval administration; Tasks, Meetings and Surveys & evaluations
have their own focused menus. Surveys support team feedback and training evaluation
forms; they do not constitute a separate employee performance review system.
The launcher explains work steps, team roles, survey answer privacy, and decision history with plain-language copy and labelled interactive diagrams. The roles diagram retains R/A/C/I with full role names and meanings. Anonymous survey totals wait for at least
three responses, matching the existing results UI. Historical document routes remain
available through their links.

The app retains Anumat's name and logo, English/Khmer locale support, light/dark
preferences and mobile navigation. The user explicitly selected the Remote
marketing, setup and dashboard screenshots as the visual direction for a complete
redesign. This changes the presentation while retaining Anumat's product and demo
workflows. Visual implementation details belong in DESIGN.md.

Tasks include configurable workspace sprints: managers (owners and admins) can
create and edit Sprint 1, Sprint 2, and other named periods using 1–4 week presets
or custom calendar dates. Exactly one sprint can be active per workspace.
Unassigned tasks belong to the backlog. Task editors assign tasks to planned or
active sprints while retaining task ownership, due dates, statuses and RACI.
Completing a sprint retains finished work in its history and moves unfinished
work to the backlog or another planned sprint chosen by the manager. Completed
sprints cannot be edited or receive new tasks. Existing browser workspaces
receive an empty sprint collection; their tasks stay intact.

### Task expectations and work hierarchy

Tasks support Epic → Story / Task / Bug → Subtask relationships, with a Hierarchy view alongside List, Board, and Sprints. Standard work items may stand alone or belong to an epic; subtasks require a standard parent. Parents with child items cannot be deleted or changed to an incompatible type, and unfinished children block parent completion. Reopen a completed parent before adding or reopening unfinished work beneath it.

Each item can record its expected outcome, verifiable acceptance criteria, readiness (DoR), completion requirements (DoD), and completion evidence. New tasks inherit workspace checklist defaults as editable snapshots; changes to defaults do not rewrite existing task expectations. Checklists record user verification; evidence is text or a link, not automated verification of the underlying work.

Owners/admins configure destination status permissions for Responsible (R), Accountable (A), and workspace admins, allowed previous statuses, readiness/completion gates, sign-off, and reasons. Consulted people retain comment access and Informed people retain view access. Only the accountable person or an admin changes Responsible/Accountable assignments on existing tasks. The recommended workflow preset is available in Manage statuses and adds Backlog → Ready → In progress → Review → Done with readiness gates, completion evidence, and sign-off; existing workflows are preserved until explicitly saved. Requirements, relationships, and permissions are enforced in the local prototype reducer as well as the UI. These remain browser-local prototype data, not server authorization or a verified audit trail.

### Full work-item editor and priorities

Epic, Story, Task, Bug, and Subtask items share a wide editor: summary, rich description, requirements, child items, and comments in the main column; workflow, responsibility, priority, sprint, parent, and dates in the details column. On phones it fills the viewport and a Jump to details shortcut reaches metadata. Priorities are Highest, High, Medium (the fallback for existing items), Low, and Lowest. Non-default priorities appear in lists, hierarchy rows, and board cards; default Medium and Task badges are omitted to reduce repetition. All values remain available in the editor, with priority filtering and priority-first sorting.

Descriptions use schema-based JSON with headings, bold, italic, underline, strikethrough, bullet/numbered lists, quotations, code blocks, links, and undo/redo. Existing plain notes open as literal paragraph content and stay searchable; rich descriptions also maintain plain text for search. Save persists the draft and Cancel discards it. Read-only people see formatted descriptions without editing controls. Links accept http, https, and mailto URLs. The editor loads on demand and retains the existing local task permissions, workflow gates, and storage model.

### Consistent form controls

Date fields across tasks, sprints, meetings, leave requests, surveys, and dynamic forms share one themed calendar with keyboard date entry, month/year selectors, date limits, real-day validation, and focus restoration. Meeting time uses hour/minute selectors. Search, custom action buttons, and survey editor tabs use shared components. The controls support English/Khmer, light/dark themes, and phone layouts. Invalid typed dates block primary save/submit actions and explain how to correct the field.

### App teams and invitations

Each enabled app has its own People & roles page: `/tasks/people`, `/approvals/people`, `/meetings/people`, and `/surveys/people`. Identities remain in the workspace directory; membership and Admin/Member/Viewer roles belong to one app. The workspace owner retains recovery access to every app. Existing workspaces migrate their current people into each app once, preserving work and assignments; future invitations grant only their selected app. App admins can add an existing workspace person, change app roles, or remove access without deleting identity/history. Task responsibility assignments require contributors in the Tasks team; unfinished Responsible/Accountable work must be reassigned before removing or downgrading that person to Viewer. RACI is separate from app roles.

Invitations are pending records with normalized email addresses, roles, seven-day expiry, copyable links, revocation, and acceptance. Pending invitations grant no permissions. Accepting creates or reuses a workspace person, grants only the invited app, and switches the demo persona; existing access is retained when accepting a duplicate grant. Invitation data and acceptance remain local to this browser: no email delivery or real identity verification is provided. App membership gates app pages, commands, and notifications; task mutations, sprint/status administration, and contributor assignments are also checked in the local reducer. `/settings/people` remains workspace directory administration, separate from app roles.

### Knowing the current app

Desktop app pages identify the selected app in the sidebar or collapsed icon rail and toolbar breadcrumb. Phones keep a sticky app-context bar beneath the utility toolbar. Its app switcher opens the chosen app dashboard, preserves workspace identity, and disables apps the person has not joined. The launcher remains the place to explore app illustrations; it does not claim a current app.


The optional How this app works guide follows dashboard or collaboration-list content. The owner’s getting-started checklist stays before dashboard content. Task details use People involved for the responsibility section; role and permission rules remain unchanged. Comfortable and compact preferences adjust spacing while preserving readable type and control targets. Portal dialogs and drawers share the workspace reading/control scale. Meeting filters use full-width controls on small phones; request comments keep a visible field label.

## Builder and catalog usability

Tasks keeps search and Whose tasks visible. More filters contains sprint, sorting, source, and priority controls and counts non-default choices. Task options groups People & roles and permitted sprint/status administration; New task remains the primary action. List, Board, Hierarchy, and Sprints remain available. Filtered empty states offer a single clear action. Surveys provides search and draft/open/closed filters; the manager list avoids repeating the same survey in two sections.

Process Builder is organized into Details, Request form, Approval steps, and Preview & check. The form editor uses the full content width; the preview renders all extra questions and recomputes the route as answers change. Preview data stays in editor state. Saving checks field configuration, eligible approvers, positive response targets and references to removed questions. Form Builder hides optional help/placeholder/display rules behind a labeled control, prevents reordering a conditional question before its source, and confirms changes that remove dependent display rules.

These are browser prototype workflows. Submitted forms and approval-step fields are snapshotted locally, and returned submissions retain earlier revisions. Production readiness still requires durable server storage and authorization, scheduled notifications and escalation, concurrency handling and server auditing. Uploaded-file questions and complex parallel approval routes are outside the current builder scope.

Discover opens four collaboration apps and eight connected HR prototypes. Each HR app has a dashboard, a workspace, and isolated people/roles. Employee and candidate identities are separate from login accounts. Hiring creates employment and onboarding tasks; leave approval updates a reversible ledger; attendance review and period closure gate illustrative payroll; training completion can create a draft evaluation. Compensation permissions are separate from Employee admin access. Reports preserve scoped snapshots. See docs/roadmap/IMPLEMENTATION_STATUS.md for demonstrated behavior and remaining roadmap scope.


Personal notification preferences live at `/settings/notifications`, available from the account menu and bell. Each person configures In app, Email and Telegram channels independently for approvals, request updates, task sign-off/RACI updates, meeting invitations, surveys, and permitted HR record changes in the current workspace. Only accessible apps appear. Older preference records retain their channel choices and default to in-app enabled. Email addresses and Telegram preview profiles belong to notification preferences rather than the workspace directory. Disconnecting Telegram removes only its channel selections; other settings survive. In-app choices filter the bell across all apps, while Telegram previews use their own channel selection. Email and Telegram settings remain browser-local prototypes with no verified identity or external delivery.


## Scoped text and translation audit

Reviewed Discover's concept guide, app role guidance, survey editing, and process editing. The concept guide used long acronym definitions next to diagrams; copy now states the purpose briefly while preserving named concepts. App permissions use role icons and a compact RACI mapping. Survey privacy/audience/deadline hints now use explicit Khmer translations, localized counts/departments/dates, and the same anonymous response threshold as results. Shared form and process validation messages use parameterized translators. The i18n audit now covers `.ts` shared helpers, `helpText`, JSX conditional literals, and nested translation branches. IDs and user-authored content remain unchanged.

Process preview includes a lazy React Flow simulation of the computed sequential route. Approve, send back, decline and reset actions change preview state only; changing sample inputs resets it. Skipped steps remain inspectable. Zoom/fit controls and a readable List view provide alternatives to the diagram. This demonstrates routing and outcomes; it does not submit requests or execute real approval actions. Existing browser-local production limitations remain.

Scoped quality findings: P1 localization gaps in helper text and dynamic validation were fixed; P2 repeated explanatory copy was shortened; P2 static route preview was supplemented with an interactive simulation. Existing large vendor chunks remain a performance concern, so React Flow loads in its own chunk only when preview is opened. The scoped source/style detector reports no findings. Full application accessibility certification and a complete audit of every page were outside this pass.

## Discover welcome motion

Discover uses a locally stored Lottie folder animation adapted to mint/teal, played once with a lazy SVG player. It pauses offscreen or while the document is hidden. Reduced-motion preferences, static Storybook previews and load failures keep the existing workspace illustration. The animation is decorative and does not delay app navigation. Source, author, adaptation and the Lottie Simple License are retained in `src/assets/animations`, including metadata in the shipped JSON. Storybook covers animated and static states; browser checks cover pause/completion, live reduced-motion changes and failed-load recovery.


Meeting rescheduling and cancellation validate shared-attendee conflicts and retain history. Cancellation releases the scheduled time and preserves existing tasks. Published surveys preserve question and privacy settings; required-response validation and duplicate-response checks also run in the reducer.

## Configurable recruitment candidate stages

Recruitment admins manage candidate stages from Pipeline or Candidates. Each workspace
stores a versioned stage configuration with stable IDs, editable names and ordered
hiring phases. Admins can add custom steps within Applied, Shortlisted and Interviewed,
rename all stage labels, reorder steps within a phase, and remove unoccupied custom
steps. The nine required lifecycle phases remain present; a maximum of 24 stages
is supported. Existing applications without a stage ID retain their corresponding
standard phase, so configuration changes do not silently move legacy candidates.

Pipeline, dashboard funnel, candidate status badges and candidate filters use the
same configuration. A candidate's Hiring progress panel moves them between steps
in their current phase and saves immediately, records local history, and checks
permissions and record versions. Unsaved profile changes disable that control.
Advancing a lifecycle phase still uses the existing hiring actions and their
interview, offer approval, capacity and employment checks. Stage configuration does
not configure procedures, approver routes or evidence requirements. Configuration
and candidate movement remain browser-local prototype data.

## Operational app dashboards

Employees, Attendance, Payroll, Performance, Training, Assets, Reports, Surveys
and Meetings each have an actionable dashboard at `/home?app=<app>`.
Summary totals open the corresponding filtered lists; attention and recent rows
open the selected record. Quick actions open the relevant creation form directly.
HR dashboard metrics and queues use the same visibility rules as their workspaces,
and create actions respect app roles. Dependencies link attendance to payroll and
training to its evaluations when the user has access to the destination app.

HR, meeting and survey list filters are saved in the URL and survive refresh.
HR lists explain their collection and show relevant employee, date, course or
custody context. Available lifecycle actions use the same permission check as the
command handler and show contextual labels for closing periods and returning
assets. Successful saves and actions confirm completion.

Meeting dashboards show upcoming meetings and assigned meeting tasks; task rows
open the task drawer. Search, status, participant and recorded-decision filters
support follow-up. Survey dashboards show surveys awaiting an answer and draft,
open and closed surveys; anonymous totals retain the existing response threshold.
All persistence and workflow history remain local to the browser and workspace.
Payroll remains an illustrative preview with no statutory payroll calculation.

## HR workspace usability

All eight HR apps share a consistent record workspace with All records and Needs
attention views, search, status filters, recent/name sorting and 20-record pages.
Sorting happens across the full permitted result set before pagination. Filters,
view and page are preserved when reopening or closing a record. Recruitment's
specialized planning and pipeline filters also survive refresh and editor closure.

Record fields are organized by domain (identity, employment, pay/leave, shift,
review evidence, course, custody and report scope). Existing permission rules
continue to control which fields and lifecycle actions are available. New self-
service forms preselect the linked employee; missing prerequisite records explain
why creation is unavailable. Closing a new or edited form with unsaved fields
requires choosing to keep editing or discard. HR headers group secondary actions in More actions while keeping creation visible; status and sort controls take the full phone width. Workflow guides explain each app's
normal sequence on demand after the record list; dashboard guidance follows the attention and recent-record panels. Recruitment uses Roles & job descriptions, Hiring requests, Offers & approvals, and Preview careers page labels. Its phone section selector includes Dashboard and retains the existing section destinations. All records and procedures remain browser-local.


### Finding apps and learning workflows

The twelve-app launcher groups work and collaboration, people and growth, and
operations and reporting. Search matches app names, descriptions, and workflow
instructions; search and category filters survive reload through URL parameters.
Inaccessible apps explain that an app admin must grant access. The app switcher
and documentation use the same categories. Global search finds accessible apps by
workflow terms as well as app names. Every dashboard offers an optional three-step
workflow guide with links to the relevant pages and full documentation. Guides are
instructions, not tracked onboarding progress. Documentation covers all twelve
apps, searches section content, and collapses navigation on phones. Existing app
permissions and browser-local persistence still apply.

### SME discovery and rollout

The public site introduces workflow starting points using the shared app catalog. Pricing describes deployment options to discuss, with quotes after scoping rather than published live plans. The enquiry form saves a browser-local draft and offers copy or a user-opened email draft; it never claims delivery. Confirm the configured contact address before using it commercially. The current interface is suitable for demonstrations and customer discovery. A live paid service requires the production gates in DEVELOPMENT_ROADMAP.md.


## Operate workspace foundation

My work at `/work` brings together actions from accessible apps: pending decisions,
the person's draft/in-review/returned requests, up to ten owned open tasks ordered
by due date, unanswered surveys, and up to five attention records per HR app.
Rows open the actual request, task drawer, survey, or HR record; task queues also
link to the full task list. A linked employee record appears when available, with
a leave shortcut for Employees contributors. All caught up links back to the
module catalog. My work is in workspace navigation; Company settings, Workspace
data, and Delivery previews are available in the account menu and command palette.

Company settings at `/settings/company` records the company and legal employer
names, branches, departments, working weekdays, and dated holidays. Workspace
owners/admins can edit; other people see disabled fields and an access explanation.
Saving validates configuration, advances its revision, and records local company
history. A stale revision disables saving and offers Reload saved settings.
New leave records snapshot the working calendar when saved and calculate working
days excluding holidays; later company calendar changes do not rewrite saved
leave calendars or day counts. Editing leave dates recalculates days using that
record's retained calendar.

Workspace data at `/settings/data` restricts download, restore, and removal to the
workspace owner. Downloads contain a versioned Anumat JSON backup of the current
company's records and settings, including potentially personal/compensation data;
uploaded file bytes are excluded. Restore validates a supported backup under the
10 MB limit, shows its company and record counts, and creates a separate company
copy. Existing companies remain available. Removal requires the exact company
name and cannot remove the last workspace. It removes that company's browser-local
records; other companies, downloaded backups, and saved files remain.

Delivery previews at `/settings/delivery` uses the current person's notification
preferences and accessible apps. Email or Telegram previews require a saved
destination and an enabled app/channel. The person chooses simulated failure or
success; local history records the destination and each attempt. Failed previews
can be retried as simulated success while that destination and channel remain
valid. Changed destinations or disabled channels explain why a new preview is
needed. No message is sent.

Pending approval requests support a reasoned Change reviewer handoff by the
current reviewer or an Approvals app admin who is not the requester. The new
reviewer must be a different eligible Member/Admin and cannot be the requester.
The form requires a reason and checks the request revision; stale forms require
closing and reopening. The current step changes reviewer while the original
submission remains, and local activity records the actor, old/new reviewers,
and reason. Recruitment-linked hiring requests retain their specialized workflow
and do not offer this handoff.

These foundations remain browser-local prototypes. Nine stories in
`src/stories/apps/Foundation.stories.tsx` cover populated/member/empty My work,
company editable/read-only/Khmer-dark states, owner/restricted workspace data,
and delivery previews. The scoped foundation review captured English/light and
Khmer/dark desktop/phone surfaces plus reviewer dialogs; its final verdict marks
the working-day alignment fix resolved and gives a ship disposition. This review
does not establish human acceptance, complete the advanced roadmap, or supply
production storage, authorization, auditing, or notification services.


### Advanced workflow prototypes

Approved non-hiring requests offer separate dated execution simulations with
pending, failed, applied and cancelled states, retained attempts, revision checks,
and a future-date guard. They never apply an employee change or external action.
Employee changes can instead require an assigned independent Employee admin
before effective application; admin-recorded direct scheduling remains an explicit
option. A pending reviewer cannot lose Employee admin access until resolved.

Meeting decisions/minutes can restrict readers to selected eligible participants
plus their author; workspace ownership does not override the note audience.
Closed survey owners can create owned Tasks from an aggregate interpretation.
Anonymous cohorts require three responses; individual text and identifying
answers are withheld rather than copied to an improvement task.

HR Additional workflows disclose one action at a time and save immediately.
They cover reusable employee plans with completion-gated linked tasks, probation
extension, independently reviewed document evidence, asset custody transfer and
retirement guards, course capacity/prerequisite policies and waitlist admission,
once-only employee review responses, and simulated payroll delivery outcomes.
Normal enrollment also enforces capacity/prerequisites. Record revisions and HR
history remain; payroll attempts refer to the same frozen content revision.
These are browser-local demonstrations, not verification of documents, bank
payments, payroll law, statistical anonymity, real support delivery or observed
customer acceptance. Advanced roadmap criteria remain subject to their individual
implementation and test evidence.


### Package and support demonstrations

`/settings/package` provides fictional Starter/Team/Business package comparison,
reasoned owner trial/confirmation/cancellation previews and retained local history.
A trial is a 14-day demonstration and cannot be repeated for the same company.
These actions never bill, provision a subscription, or grant/revoke app permissions.
Workspace members can record a support request and see their own requests;
owners can approve, resolve or cancel with a reason. No support person is contacted.

`/operator` is owner-only and shows local company names, the current company's
package preview, and its support requests. An approved request exposes only a
selected app's record count for one hour. No employee detail, compensation or
other company's records is exposed; resolved/cancelled/expired requests no longer
show the count. This is a local owner-operated preview, with no external operator
identity, impersonation or production support access. Requests, approvals,
resolution reasons and package history persist with their company in browser
storage; company and actor changes remount the commercial forms.
