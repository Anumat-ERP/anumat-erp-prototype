# Recruitment prototype

Implemented 2026-10-02 for Cambodian SMEs. Routes: `/home?app=recruitment` and `/recruitment`. Everything persists in the current browser/company. Public publishing, applicant submission and applicant offer responses are explicitly simulated; no external posting or email is performed.

## Supported journey

1. **Positions and JDs:** create/edit a position, employment type, location, department, rich job description and required outcomes. Each save creates a version. Approved requisitions retain their own position/JD snapshot.
2. **Requisitions:** choose a position revision, headcount, monthly budget per person/currency, justification, hiring manager, closing date and independent reviewer. Save a draft, submit, approve/decline, request changes through Approvals, withdraw as requester, or revise a returned/declined/withdrawn request. Submission creates a linked request in Approvals; the assigned reviewer can decide from either app. An approved request creates exactly one draft vacancy. A changed JD blocks approval until the declined requisition is revised with the current snapshot.
3. **Job openings:** publish an approved vacancy, pause/resume, close/reopen. Approved requirements and headcount are locked. Expired vacancies cannot publish or collect new applications. Active applications must be resolved before closure; pausing stops new applications without deleting ongoing work.
4. **Career page preview:** published jobs display requirements and application form. Name/email and consent are required. Submitting creates an application in the actual pipeline. Duplicate email within a vacancy is blocked; a person may apply to different jobs.
5. **Candidates and pipeline:** search/filter by vacancy; view Applied → Shortlisted → Interviewed → Offered → Accepted → Hired. Rejection, withdrawal and offer decline retain history. Email matching links other applications without sharing their lifecycle. Capture contact, source, consent, resume/portfolio notes, documents and pre-hire evidence. Optional structured background supports multiple education entries (institution, qualification, subject and years), previous/current employment (company, role, dates and achievements), skills with proficiency, and projects with type, contribution, outcomes and an http/https portfolio URL. Recruiter notes stay in the internal candidate editor; the applicant preview collects the optional background without exposing recruiter notes. Existing candidates without a profile remain compatible. Resume/assessment files use local IndexedDB storage and the shared document viewer.
6. **Interviews:** schedule an assigned app contributor with date/time, duration, location and criteria; overlapping interviews for the same interviewer are rejected. Only the assigned interviewer can submit a scored assessment with evidence and recommendation. A successful assessment records evidence on the shortlisted application. Assigned members see their interviews and assessment controls, without candidate compensation or full recruiting records. Reschedule/cancel retain history. Terminal application outcomes cancel remaining scheduled interviews.
7. **Offer reviews:** save candidate evidence, positive monthly pay and proposed start date; request independent approval with explicit terms. Approval is tied to the saved candidate version, offer revision, currency, amount and start date. Saving candidate changes or revising an issued offer supersedes approval; terms above approved budget or in another currency need new headcount approval. Issue only an approved offer, then simulate acceptance/decline/withdrawal. Acceptance creates no employee.
8. **Hire and onboarding:** Employee admin, compensation write and Tasks contributor permissions are required. Verify identity, consent and employment evidence; enforce remaining headcount and duplicate employee-email checks. One conversion creates one employee without a login, one employment episode and three owned onboarding tasks. Future start dates produce Pre-start employment, which cannot start early. Onboarding shows owners, due dates, status and opens the actual shared task editor. Repeated conversion cannot duplicate the handoff.
9. **People, permissions and notifications:** app admins manage the isolated team. App members act as assigned interviewers. Independent reviewers need Recruitment admin and Approvals contributor access. Outstanding assigned approvals/interviews block removal of needed access and employee offboarding. Recruitment changes feed the existing per-channel notification preferences, respecting app and assignment access.

## Record navigation and editing

Dashboard approval and interview queues, activity notifications and returned headcount requests link directly to the corresponding record. Position, requisition, interview and offer editors support reloadable `?tab=…&record=…` links. Missing or inaccessible records show an unavailable state without exposing their contents.

A position can start a requisition with that position selected. A shortlisted/interviewed candidate can start an interview with the candidate selected. Closing dates and interview dates use the shared calendar and persist both typed dates and calendar selections. Approved vacancy fields are visibly read-only; lifecycle actions remain available.

Save edited records before executing workflow actions. Headcount submission uses the saved draft, interview assessment requires saved scheduling details, and candidate offer/stage actions require saved candidate details. A changed recruitment record must be reopened before a stale editor can save or decide.

## Demo

As Dara in Lotus, choose **Load HR examples** when the HR workspace is empty. It adds a fictional position, approved headcount/vacancy and candidate, and gives Alex Recruitment reviewer access. Existing HR data is preserved; existing populated workspaces can create their own positions and explicitly grant reviewers via People & roles.

Explore the seeded candidate, shortlist, schedule Alex's interview, switch persona to Alex to assess, return to Dara to record the interview stage and save offer/pre-hire evidence, request Alex's offer approval, approve as Alex, then return to Dara to issue, accept and hire. Open Onboarding to manage the linked tasks. For a new job, start with Positions and JDs → Requisitions.

## Implementation and evidence

- `src/hr/recruitmentTypes.ts`: typed position/requisition/interview/offer records and history.
- `src/hr/recruitment.ts`: shared validators, immutable command application, approval-request connection and snapshot rules.
- `src/hr/RecruitmentWorkspace.tsx`, `RecruitmentTools.tsx`: dashboard, navigation, pipeline, editor/assessment/review, applicant simulation and onboarding.
- `src/hr/engine.ts`: vacancy/application/employment integration and authorized hire conversion.
- `tests/recruitment-domain.spec.ts`: approval independence, revisions/budget, JD locks, scheduling/assessment permissions, multi-job applications, future employment, capacity and access recovery.
- `tests/recruitment-workspace.spec.ts`: desktop/mobile sections, rich JD → approved vacancy → applicant, scoped assessment, document persistence and Khmer dark UI.
- `tests/hr-workspace.spec.ts`: independently approved offer → employee → working onboarding task editor.
- `src/stories/apps/Recruitment.stories.tsx`: thirteen real application stories including reviewer, interviewer, onboarding, empty and Khmer dark surfaces. Story fixtures use memory state and do not persist to browser storage.

Prototype coverage implements REC-01 through REC-06 at the bounded scope above. Real integrations, external identity, public careers hosting, email/offer signatures, production document security/retention and customer acceptance remain production work. This page records implementation rather than customer or paid-release acceptance.

## Final verification

- Full application regression: **226 passed, 6 existing device-specific skips**.
- Repeated keyboard-menu and recruitment-hiring checks: **12 passed** across desktop/mobile after the navigation focus recovery fix.
- Application build, Storybook build, application/story types and translation audit passed.
- Independent visual review: **ship** for the dashboard, pipeline and Khmer dark position form on desktop/mobile. Other workflow behavior is covered by browser/domain checks; the visual verdict does not assert computed contrast or customer acceptance.
- Full built Storybook browser verification: **488 passed**, covering the 241-story catalogue on desktop/mobile plus interactive examples and documentation.
- `git diff --check` passed.

## Follow-up completion checks

The record-navigation/date-editing follow-up adds reloadable editors, direct queue/notification links, position/candidate creation handoffs, saved-change guards and visibly locked approved vacancies. Browser checks now edit closing/interview dates, use calendar selection, reopen records, verify the approval queue link and confirm restricted records stay hidden.

- Full application run: **226 passed, 6 skipped**, with two unrelated desktop failures (aborted request navigation and sprint layout measurement); both failed cases passed on the subsequent rerun. All recruitment cases passed in the full run.
- Built Storybook checks after these changes: **488 passed**.
- App/Storybook builds, both TypeScript checks, translation audit and `git diff --check` passed.

## Candidate background extension

Education, work experience, skills, projects and recruiter notes now persist with the application. Empty added entries require their essential fields or removal; education/employment date order and project URLs validate before saving. Current study/employment disables and clears the end date. Cancelling edits preserves the saved profile. Existing sample data is never overwritten; fictional background examples are added only by the explicit empty-workspace demo loader.

Verification: **54 affected domain/browser checks passed** on desktop/mobile, including profile validation, multiple entries, reload persistence, cancellation, optional applicant collection and Khmer dark controls.

The rebuilt Storybook passed **26 affected checks**, including the new candidate background story. App/Storybook builds, both TypeScript checks, translation audit and diff whitespace checks passed.

## Job description management extension — 2026-10-03

Positions and JDs now support an optional unique job code, active/archive status, job level, reporting line, responsibilities, measurable success criteria, education/certifications, minimum experience, preferred qualifications, work arrangement/hours, benefits, and an advertised monthly salary range in USD/KHR. The existing rich description and required skills remain required. Other enrichment is optional for compatibility with older saved positions.

Manage the library by searching title, department or job code and filtering active/archived JDs. Duplicate a saved JD into an independent new position with a new ID and cleared code. Archive/restore through the status control and Save. Archived JDs cannot create new requisitions; changing any source version still requires refreshing pending requisitions. Existing approved vacancies retain their approved snapshot.

Preview the applicant-facing description before saving. Salary ranges are internal by default; the applicant preview displays them only when explicitly enabled. Validate unique codes, nonnegative experience and salary ranges, and complete public salary disclosure before saving. Hiring budgets are approved separately in requisitions.

Every position save records a revision and optional revision note. History opens earlier JD descriptions and structured details. Requisition review and the vacancy view show the approved details; Approvals links authorized recruiters to the full requisition snapshot. Approved structured job fields cannot be changed through vacancy edits. The career preview uses that frozen vacancy snapshot.

The shared rich editor now changes editability without emitting an initial content update, so opening a legacy JD does not falsely mark it dirty or block duplication/requisition handoffs.

Verification covered 72 affected domain/browser cases across desktop/mobile: 70 passed in the affected run, and the two archive/history cases passed after their assertions were scoped to the selected revision. Publication and the linked Approvals-to-requisition handoff were also rechecked on both devices. JD editor screenshots were inspected on desktop/mobile. Fictional JD examples are added only by the explicit demo loader; existing workspace data is preserved.

Final JD checks: **38 affected built Storybook checks passed**. Application and Storybook builds, application/story TypeScript checks, Khmer translation audit and diff whitespace checks passed. The catalogue now contains 243 stories, including 13 dedicated Recruitment stories.
