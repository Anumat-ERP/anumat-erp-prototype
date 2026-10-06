---
name: Anumat ERP
description: Visual system for Anumat's browser-based ERP prototype, with a Vendure-inspired admin workspace.
colors:
  workspace-canvas: "#f2f6f8"
  workspace-ink: "oklch(.13 .007 231)"
  workspace-card: "#fff"
  workspace-primary: "#16c1fe"
  workspace-primary-foreground: "#08212b"
  workspace-muted: "oklch(.945 .004 231)"
  workspace-muted-foreground: "oklch(.45 .005 231)"
  workspace-accent: "#d5f4ff"
  workspace-border: "oklch(.86 .004 231)"
  workspace-ring: "#087ba7"
  workspace-mint: "oklch(.48 .15 145)"
  workspace-dark-canvas: "oklch(.13 .007 231)"
  workspace-dark-card: "oklch(.18 .007 231)"
  workspace-dark-ink: "oklch(.92 .004 231)"
  workspace-dark-border: "oklch(.32 .007 231)"
  public-primary: "#000000"
  public-canvas: "#f3f5f9"
  public-surface: "#ffffff"
  public-ink: "#20252c"
  auth-navy: "#0e2549"
  auth-card-border: "#d8e0e4"
  auth-dark-canvas: "#101a20"
  auth-dark-card-border: "#42545e"
typography:
  launcher-description:
    fontSize: "1rem"
  launcher-heading:
    fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)"
  launcher-card-title:
    fontSize: "1.125rem"
  app-overview-count:
    fontSize: "2rem"
  workspace-caption:
    fontSize: "0.8125rem"
  auth-note:
    fontSize: "0.75rem"
  workspace-heading:
    fontFamily: "'Public Sans Variable', 'Public Sans', 'Kantumruy Pro', system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  workspace-body:
    fontFamily: "'Inter Variable', Inter, 'Kantumruy Pro', system-ui, sans-serif"
    fontSize: "1rem"
  workspace-supporting:
    fontSize: "0.9375rem"
  public-display:
    fontFamily: "'Plus Jakarta Sans', 'Inter Variable', 'Kantumruy Pro', system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.2vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.04em"
rounded:
  workspace-base: "0.25rem"
  workspace-card: "0.5rem"
  workspace-control: "0.375rem"
  public-panel: "20px"
  public-pill: "999px"
spacing:
  workspace-sidebar: "16rem"
  workspace-sidebar-collapsed: "3.75rem"
  workspace-toolbar-height: "4rem"
  workspace-page-gap: "1.75rem"
  workspace-card-mobile: "1.25rem"
  workspace-card-desktop: "1.5rem"
components:
  workspace-card:
    backgroundColor: "{colors.workspace-card}"
    textColor: "{colors.workspace-ink}"
    rounded: "{rounded.workspace-card}"
    padding: "1.25rem"
  workspace-navigation-selected:
    backgroundColor: "{colors.workspace-accent}"
    textColor: "{colors.workspace-primary-foreground}"
    rounded: "{rounded.workspace-control}"
  public-button-primary:
    backgroundColor: "{colors.public-primary}"
    textColor: "{colors.public-surface}"
    rounded: "{rounded.public-pill}"
---

# Design System: Anumat ERP

## Overview

Anumat has three current visual contexts. The signed-in admin workspace is a compact, Vendure-inspired operating surface for requests, approvals, processes, and related work. Its hierarchy comes from a narrow sidebar, a shallow toolbar, pale blue-gray canvas, fine borders, and bright cyan actions. The application keeps Anumat's logo, names, copy, data, and workflows. This is an interpretation of Vendure's dashboard visual language, not a claim of identical UI or Vendure functionality.

Authentication uses a Vendure-inspired centered white card on a pale canvas, with the Anumat logo above it and a cyan submit button. Public marketing and workspace setup retain the accepted spacious, monochrome presentation with established imagery. Marketing uses a white canvas and Inter display type; setup uses a cool gray canvas and Plus Jakarta Sans headings. Black primary actions in light mode become pale actions in dark mode. Prominent public calls to action keep their pill treatment. The admin skin is scoped to `html.an-workspace-theme`, which `Shell.tsx` adds while the signed-in shell is mounted and removes when it unmounts. The auth skin is scoped to `.an-auth`. `src/styles/vendure-dashboard.css` supplies both sets of overrides. `PRODUCT.md` remains the source for product behavior and demo limitations.

**Key characteristics:**

- Task-oriented admin layout with an expandable 256px sidebar, 64px toolbar, larger readable type, and calmer action groups.
- Bordered white workspace cards, dense tables, inline filters, and cyan primary actions.
- Public Sans workspace headings, Inter body text, and Khmer font fallback.
- Light/dark themes, English/Khmer copy, and mobile sheet navigation.
- Anumat identity and the Ask → Approve → Execute → Track flow on Home.

## Colors

The workspace uses a light `#f2f6f8` canvas, white cards and popovers, near-black foreground, and restrained borders. Primary actions use cyan `#16c1fe` with dark text. The active navigation item uses pale cyan `#d5f4ff`; keyboard focus uses the deeper `#087ba7` ring for contrast.

In dark mode, canvas is `oklch(.13 .007 231)`, card is `oklch(.18 .007 231)`, foreground is `oklch(.92 .004 231)`, and border is `oklch(.32 .007 231)`. The primary action remains cyan against dark text. The semantic tokens also define mint, destructive, warning, and five chart colors where status or data needs them. Status must still have a text label.

Workspace plain-text links use the semantic foreground-link token: `#006a8d` in light mode and `#76dfff` in dark mode. Light accent text uses deep cyan rather than the bright action fill. Input borders use `#7b8790` in light workspaces and `#68747d` in dark workspaces; dark authentication inputs use `#7f919b`. Public/base field borders and the base `#303030` focus ring retain visible separation from their surfaces.

Public and setup primary actions and focus accents use black `#000000` in light mode, with `#262626` hover and `#404040` active states. Marketing uses a white canvas; setup retains cool gray `#f3f5f9`. Both use white surfaces and near-black `#20252c` text. Dark mode changes primary actions to `#f5f5f5` and uses dark surfaces. Authentication uses the admin cyan accent and a pale `#f5f9fb` canvas.

## Typography

The workspace uses self-hosted Public Sans for headings and figures, and Inter for body, navigation, and controls. Body and field text use 16px, supporting text 15px, and captions 13px. Page titles use 28px on desktop and 24px below the 768px breakpoint, weight 600, line height 1.3, with `-.025em` tracking. Supporting text keeps a 1.5 line height. Small uppercase sidebar group labels remain 12px with `0.05em` tracking. HR field-group headings use 18px, including inside portal forms; dashboard descriptions and linked summaries use 16px, and recent-record context 15px. Recruitment reading text and candidates use 16px, section navigation and result counts 15px, and small context labels 13px. The app's Khmer font fallback remains in the stacks, and translated copy must be able to wrap.

Marketing headings and body use Inter; setup headings retain Plus Jakarta Sans with Inter body text. Authentication headings use Public Sans. Code and tabular numbers may use the existing mono/tabular treatments where appropriate.

## Layout

On desktop the signed-in shell has a sticky, full-height 16rem (256px) sidebar with a border on its content edge. It can collapse to a 3.75rem (60px) icon rail. The sidebar places the workspace switcher at top, grouped navigation in the scrollable center, and the account control at bottom. The top toolbar is sticky and 4rem (64px) high, with sidebar toggle, breadcrumb, and utility actions. The main region uses 1.5rem vertical padding, a page gap of 1.75rem, and a capped content width. The shell's responsive horizontal gutters come from `AppShell` utilities.

Below the `md` breakpoint, the desktop sidebar gives way to a left sheet with an explicit open and close control; the mobile toolbar retains the account trigger and utilities. Main padding becomes 1rem. Navigation targets in the sheet have a larger minimum height of 2.75rem. Home's four-step flow uses two columns on smaller widths and a single linked sequence with chevrons at `lg` widths.

The public site keeps its spacious reading rhythm and existing imagery. Workflow overviews use two columns on desktop and one on phones. Setup uses a form column beside a smaller starter-illustration aside within a 1120px maximum width; below 768px the aside disappears and the form takes the available width. Step labels and action groups wrap, while review rows keep their Edit action beside the value. Authentication centers a 450px card and scales it to the viewport on phones. Density preference changes spacing only: compact mode reduces page gaps to 1.25rem and task-row vertical padding to .75rem without reducing type or control targets.

## Elevation & Depth

Workspace depth comes primarily from surface contrast and borders. Shared cards have a 1px semantic border and no resting shadow; the workspace theme sets `--shadow-card: none`. The toolbar, sidebar, cards, and page canvas remain visually distinct without floating panels. Menus and dialogs may retain overlay elevation, and the workspace switcher's small logo tile has a subtle shadow. Public hero imagery retains its own visual depth.

## Shapes

The workspace's base radius is 0.25rem (4px). Controls use 0.375rem (6px); cards use 0.5rem (8px). Borders are thin and restrained. Sidebar selections follow the compact control radius. This flatter geometry is scoped to the signed-in shell. Public and setup panels retain their larger corners, while prominent public/auth actions retain pill shapes.

## Components

### Module catalog

The app launcher pairs a semantic sidebar-accent header with Anumat’s existing folder artwork and groups twelve apps by the shared catalog. Its heading asks what the person wants to work on. Search, wrapping category controls, a result count, and a Quickstart link lead into the app groups. Each card carries a description and three workflow steps. Available apps open their dashboard according to membership; inaccessible apps show an access explanation without a launcher link. The launcher hides Dashboard and app-specific navigation. Selecting an app reveals its Dashboard and menus; the selection is remembered per workspace. Requests & approvals, Tasks, Meetings, and Surveys & evaluations use the established paper-collage illustrations in a two-column grid that becomes one column at narrower widths. People & growth and Operations & reporting use compact icon cards, also stacking on phones. Cards retain the workspace’s 8px radius token, semantic colors, explicit actions, visible keyboard focus, and restrained hover fills. Illustrated cards use 24px desktop and 20px mobile padding; icon cards use 20px padding. Text wraps beside the artwork or icon. Tasks, Meetings and Surveys & evaluations have dedicated overview pages with live counts and upcoming work.

### Task focus and secondary actions

Tasks keeps one New task primary action; Task options groups People & roles and the permitted Create sprint and Manage statuses actions. Search and Whose tasks remain visible. More filters reveals Sprint, Sort tasks, Where tasks came from, and Priority, with a count of non-default choices on the disclosure. List, Board, Hierarchy, and Sprints remain available. Rows omit default Task and Medium badges, keeping title, status, and due date easy to find; sprint, source, notes, and comment context use a separate line. Non-default type and priority remain labelled, and the editor retains every value. Board columns scroll within their own constrained container rather than widening the page. HR headers similarly retain their main creation action while More actions groups secondary actions; phone status and sort fields span the available width. Meeting filters also become full-width single-column controls on small phones. Request discussion forms keep a visible Add a comment label above the textarea.

### Task sprint planning

Tasks has List, Board, Hierarchy, and Sprints views. A sprint filter switches between all work, backlog and named sprints. Sprint summaries show name, planned/active/completed status, inclusive calendar dates, goal and completed-task count. The Sprints view lists active work first, followed by planned and completed periods. Managers create or edit a sprint in a shared form modal with week presets and native date controls. Completion asks where unfinished work should go. Panels use existing Card, Badge, ProgressBar, Select and Button components, workspace typography, semantic tokens and standard spacing; actions wrap below the summary on narrow screens. Task drawers include a sprint selector and completed sprint membership is read-only.

### Recruitment management

Recruitment keeps the compact workspace shell, Public Sans headings, shared Radix-based controls, semantic light/dark tokens, and cyan actions. Its wrapping section navigation uses muted labels, an accent fill and semibold text for the current destination, visible keyboard focus, and 44px link targets. Plain-language labels lead: Roles & job descriptions, Hiring requests, Offers & approvals, and Preview careers page. The phone Recruitment sections selector includes a translated Dashboard option opening `/home?app=recruitment`; other section routes stay the same. The dashboard places a six-stage linked funnel above approval and interview panels, with a hiring-plan action card. Counts use tabular figures; statuses and empty states remain explicit text. Publishing, applications, and offer responses are labelled as local prototype simulations.

The pipeline shows Applied, Shortlisted, Interviewed, Offered, Accepted, and Hired in muted columns with bordered candidate links; each link carries name, job opening, and source. Search, job-opening selection, and Add candidate align above the board. Six columns become three at 1100px and one at 640px; the dashboard panels and filters also stack at 640px, while the funnel becomes three columns. Candidate text wraps within its card. Positions, requisitions, interviews, and offer reviews use shared searchable tables and extra-large form modals. Position forms pair a two-column metadata grid with the shared rich-text editor; interview forms use DatePicker and TimePicker. English/Khmer labels, theme colors, role-dependent actions, decision reasons, revision context, and expandable history follow the existing shared patterns.

### Workspace guide

Below the launcher, four accessible tabs lead with Work steps, Team roles, Answer privacy, and Decision history. Labelled diagrams carry the explanation: a numbered approval flow, four role definitions, named versus anonymous answer visibility, and a request activity timeline. Explanations lead with what to do and who does it rather than SOP or RACI terminology; role diagrams retain R, A, C, and I beside their full names and meanings. Examples are labelled and link to the existing workflows. Survey privacy copy uses the same anonymous-response threshold as the results UI; it does not imply confidential access controls for all workspace data. The guide uses shared Tabs, semantic colors, 8px panels, and a two-by-two tab arrangement on phones.

### Workspace shell and navigation

`AppShell` provides sidebar, toolbar, main region, mobile sheet, and skip link. Navigation rows are compact with icons and labels; the active destination uses a neutral accent fill, semibold text, and `aria-current="page"`. Collapsed rail items keep accessible names and tooltips. The top sidebar control is `WorkspaceSwitcher`: it displays the Anumat mark, current organization, and access role, then opens a menu of demo workspaces and a create-workspace route. The account menu sits at the bottom of the sidebar and appears as an avatar control in the mobile toolbar.

The workspace theme hides the floating support control so help remains within the admin navigation and toolbar.

### Cards and data

The shared `Card` is a bordered, shadowless section with a white or muted surface, 0.5rem radius, and `1.25rem` padding that grows to `1.5rem` at `sm`. Its flush variant leaves spacing to headers and rows. `CardHeader` pairs a semibold title with smaller muted description and optional actions. Home's `FlowStrip` is a distinct four-card summary for Ask, Approve, Execute, and Track. Each step links to an Anumat route, shows a count and caption, and gives Approve stronger emphasis when items are waiting. On the approvals Home dashboard, the flow, Waiting on you, and Your requests remain immediately visible. A native Reports & recent activity disclosure, collapsed by default, contains the request chart, average decision timing, and activity history with their existing controls. Its summary uses a 44px target and visible keyboard focus. Other data areas should keep borders, labels, and textual statuses legible in both themes.

### Controls and feedback

Workspace buttons, inputs, textareas, and selects use the compact control radius and semantic foreground, surface, border, and ring tokens. Main-area controls and navigation targets use a 44px minimum height, with a 44px tab container and 38px tab buttons. Inline task-title actions retain their compact text treatment. Portal modals and drawers share the same 16px reading and field text, 44px controls, and labelled icon buttons at least 44px wide, including close controls. Keyboard focus remains visible. The existing app-owned UI components handle menus, cards, buttons, fields, chips, and dialogs. Workspace tables use a flush white header and 4rem body rows; filters align search, options, and actions on one line where space permits. Public/setup forms use shared labelled Field, Input, Select, Textarea, and RadioGroup controls with monochrome primary actions. Authentication retains password visibility and six-digit verification controls inside the new centered card. Those routes are browser-only demonstrations as described in `PRODUCT.md`.

### Operate foundation surfaces

My work, Company settings, Workspace data, and Delivery previews extend the existing Vendure workspace system: Public Sans headings, Inter reading text, Khmer fallback, cyan primary actions, semantic light/dark surfaces, and shared cards, fields, banners, and dialogs. My work is a workspace navigation destination; company, data, and delivery tools remain reachable from the account menu and command palette. Keep page titles, record links, and action labels explicit.

My work uses bordered queue cards with divided, full-row links. Titles lead; due dates, status labels, and record context support the next action. Rows wrap with a readable gap, underline their title on hover, and show a visible focus ring. Queue cards form two columns at large widths and one on phones; employee context and actions wrap above them. Preserve real record destinations and the All caught up recovery action rather than introducing decorative totals.

Company details use two field columns where space permits and stack on phones. The working calendar stays in its own card, with weekday labels vertically centered beside checkboxes inside 44px targets. Holiday entry keeps its format hint visible. Read-only and stale-setting banners explain access or provide a named reload action; save controls retain their primary emphasis. Workspace data separates download, restore review, and removal into distinct cards. File errors stay beside the file field; removal uses the critical action and an exact-name confirmation dialog. Delivery previews lead with the simulation banner, followed by labelled configuration fields that stack on phones and a divided attempt history with textual success/failure badges and contextual retry feedback.

Reviewer handoff uses the shared modal with a required eligible-person selector and reason field, a clear confirm action, and Keep current reviewer cancellation. Validation appears in the dialog. Keep the stacked field spacing, wrapping English/Khmer labels, and shared portal reading and control scale so recovery and cancellation remain usable on phones.

### Advanced workflow disclosure and completion

Additional workflows is a bordered native disclosure within the existing HR record editor, collapsed initially. Its heading retains the shared section scale and a 44px target. A workflow selector reveals only the fields for the chosen action; labels, date controls, reasons, eligibility messages, and the cyan action stay together in the same reading order on desktop and phones. Keep the immediate-save notice adjacent to that action: it closes the record, so ordinary edits must be saved first. Existing plan tasks, verification outcomes, employee responses, and payroll attempt history use labelled rows and links rather than extra dashboard totals.

Approved non-hiring request details add an Execution preview card with a textual status badge, date, revision, outcome reason, wrapping actions, and divided attempt history. The simulation explanation precedes the actions. Failed attempts retain their history beside Retry execution preview; applied/cancelled outcomes remain readable without editable actions. This card records a browser simulation, separate from the employee-change scheduling and independent-review interface.

Meeting note forms put Note type and Note visibility together in two columns where space permits and one on phones. Selecting restricted visibility reveals Additional readers with an explicit author-inclusion hint. Visible entries carry Decision or Meeting minutes and Restricted note labels; hidden note content is withheld rather than styled as disabled content. Closed-survey follow-up uses a separate bordered card with a privacy instruction, aggregate interpretation, task title, responsible teammate and optional due date. Permission/error banners remain near these fields, and the saved task link stays beside its interpretation. Preserve the existing English/Khmer wrapping, semantic themes, shared controls and focus treatments.

### Package and support previews

Package & support (`/settings/package`) and Operator preview (`/operator`) use the existing workspace shell, capped page column, Public Sans headings, Inter/Khmer reading text, neutral bordered cards and cyan primary actions. Sections use readable spacing rather than metric-card dashboards. The package simulation banner comes before a simple package/illustrative-need table and owner decision form. Trial is primary; confirmation and cancellation use secondary/tertiary actions. Retained package history stays in a disclosure below the form. Table overflow stays within its container, and actions wrap on narrow screens.

Support privacy copy precedes the subject, affected-app and problem fields. Request cards pair wrapping titles with translated textual status badges; decision reasons and permission-dependent actions remain within the affected request card. Operator metadata uses divided company-name rows. Approved support scope is a banner naming only the selected app, record count and expiry; expiry automatically removes the count while keeping an explanatory banner and history. Recovery and operator/package links sit after the workflow sections. These surfaces retain light/dark and English/Khmer behavior and explicitly identify browser-local billing/support simulations.

### Public workflow discovery and navigation

Landing introduces three shared Tabs starting points: Approvals & tasks, People & HR, and Explore every app. Each panel pairs a numbered workflow from the app catalog with linked app descriptions and a setup action that preserves the chosen starting point. Use shared keyboard-operable tabs, wrapping labels, borders, and monochrome tokens. PublicHeader keeps desktop navigation and a compact mobile ActionMenu for Product, How it works, Pricing & deployment, Docs, and Sign in; language selection and Create a workspace remain reachable on phones.

### Company setup and workspace activation

Welcome presents three steps: Your company, Your starting point, and Review & create. A labelled progress indicator and numbered step list show position; they do not imply that business work is complete. Company name errors appear with the field, starting points use shared radio choices, and review values offer explicit Edit actions. Heading focus moves with each step; motion respects reduced-motion preferences. Draft progress resumes on this device. Copy explains that the starting point leaves all twelve apps available and does not change permissions. New companies contain the owner and empty business records; teammates are added within apps after setup. The selected starting point’s supplementary illustration supports the desktop aside without competing with the form; Explore every app retains the existing folder artwork.

WorkspaceActivation uses the compact cyan workspace system: one bordered card, a completed-step count, ordered rows with status icons and explicit Complete or Start labels, and Hide for now / Show getting started controls. It appears for owners with a configured starting point and disappears when all relevant records exist. Completion reflects saved records and accepted app membership, not clicks on tutorial checkboxes. The People & HR sequence covers an employee, a teammate, and leave; the work sequence covers a teammate, an active approval process, a submitted request, and a follow-up task. The request action directs the person to process setup when its prerequisite is missing. Phone rows retain readable context and 44px action targets. Keep this record-backed checklist distinct from the instructional How this app works disclosure.

### Deployment discussion and enquiry

Pricing presents starting scopes, prototype capabilities, and deployment options to discuss. The three bordered deployment columns use Quote after scoping, responsibility comparisons, and Discuss this option actions; starting scopes are not paid subscriptions or feature limits. Selection moves to the shared enquiry form and focuses its first input. Required-field errors retain the entered values. Preparing an enquiry saves a browser-local draft and reveals a read-only summary with Copy enquiry, Open email draft when configured, and Edit enquiry. Copy failure explains manual copying. The email action opens a user-controlled mailto draft; success copy must describe local preparation and never imply delivery. Stacked phone layouts, wrapping actions, and a keyboard-focusable horizontally scrollable comparison preserve the desktop information. All new copy supports English/Khmer and existing theme behavior.

### Imagery

Marketing retains the existing dashboard preview in the hero. Landing workflow introductions and the desktop Welcome aside use `WorkflowIllustration`: Approvals & tasks selects `src/assets/illustrations/generated/approvals-tasks.webp`, People & HR selects `people-hr.webp` in the same directory, and Explore every app selects the original `workspace-folder.webp`. The two generated assets are transparent 1024px-square raster illustrations, approximately 113KB each, with tactile paper/cardboard/clay forms, fine grain, cobalt, mint, lavender, and cream that match the existing folder art. Their symbolic objects carry no text or simulated interface. Prompts, provenance sidecars, dimensions, transparency checks, and optimization details are recorded in `src/assets/illustrations/generated/promptset.json` and its referenced files.

Workflow art supplements semantic HTML headings, descriptions, ordered steps, and actions. Images have empty alt text and `aria-hidden="true"`, explicit 1024px dimensions, and asynchronous decoding. Landing loads them lazily in a 10rem introduction slot, reduced to 7rem on small phones; Welcome loads the selected art eagerly at up to 280px in its desktop aside, which is hidden below 768px. Keep the artwork within these reserved areas so it does not cover instructions or controls. The homepage excludes the floating Telegram support control; footer contact channels remain available.

The app launcher reuses the folder artwork in its accent header, with the existing decorative welcome animation and static fallback, and four matching collaboration app illustrations. The eight People & growth and Operations & reporting apps use catalog icons; other compact admin and auth layouts use no decorative art.

## Do's and Don'ts

### Do:

- **Do** scope admin tokens and compact component geometry to `html.an-workspace-theme`, and the centered login treatment to `.an-auth`.
- **Do** use semantic tokens so cards, text, focus, status, and controls remain legible in light and dark themes.
- **Do** preserve Anumat's logo, route names, approval workflow, locale support, and mobile navigation.
- **Do** keep status meaning in words as well as color, and maintain accessible focus and navigation labels.

### Don't:

- **Don't** describe the workspace as a pixel-identical Vendure dashboard or imply Vendure backend integration.
- **Don't** replace the public or setup presentation with workspace tokens unless those surfaces are deliberately redesigned.
- **Don't** add floating shadows or large pill corners to routine workspace cards and controls.
- **Don't** imply real authentication, sent invitations, or server provisioning in visual copy.

Task expectations use the existing drawer, labelled form fields, and compact editable checklists. Plain-language headings lead: Expected outcome, Acceptance criteria, Ready to start, Completion requirements, Completion evidence, and People involved. Responsible, Accountable, Consulted, and Informed still name the underlying task responsibilities. Work item type and parent sit beside status/owner controls. The Hierarchy view uses indented task rows with type labels and parent context. Manage statuses includes workspace defaults and per-destination R/A/admin permissions and allowed previous statuses, preserving the shared modal, tokens, keyboard behavior, and responsive wrapping. Checklist gates and the recommended workflow are explicit configuration, not silently applied to existing workspaces.

The task editor now uses a wide shared modal (up to 76rem), filling the phone viewport. A main content column and 19rem details column separate writing from metadata. Summary, semantic rich-text toolbar, description, requirements, and activity share the established compact typography, border, focus, spacing, and color tokens. The details shortcut supports long mobile forms. Priority badges pair a directional icon with text; color supplements the label. Editor tool buttons expose their selected state, keyboard commands, and translated labels. Rich content uses standard document typography and wraps long code and URLs within the available width.

Shared controls are mandatory at application call sites: Field with Input/Textarea/Select, DatePicker, TimePicker, SearchField, Button/IconButton, and Tabs. DatePicker combines ISO keyboard entry with the shared themed calendar; month and year menus use Select. Calendar focus, bounds, disabled/read-only states, errors, and Khmer labels follow the same tokens and accessibility conventions. TimePicker uses 24-hour hour and minute selectors. Native elements remain inside shared primitives and file-upload internals.

App People & roles pages preserve the compact shared header, themed search, member rows with avatars and labelled role selectors, and a separate permission explanation. The header names the current app and offers Invite member to app admins. Invitation creation uses a shared modal, tabs for email versus an existing workspace person, shared fields/selects, and a copyable link with an explicit browser-local prototype note. Pending invitations show role, expiry, copy, and revoke actions. Role and access errors preserve the selected value and explain unfinished-task reassignment. Member rows wrap controls below identity on phones; explanatory content follows the team.

Current-app wayfinding on desktop uses the sidebar app icon/name, an accessible icon in the collapsed rail, and the toolbar breadcrumb; the duplicate bar below the toolbar is hidden at 768px and wider. Phones retain the sticky app-context bar with the app icon/name and Switch app menu. Approvals use the existing mint tokens, Tasks the sidebar accent, Meetings the warning tokens, and Surveys a neutral surface. Text carries the identity; color is supplementary. App illustrations remain on Discover. Switching apps opens that app’s dashboard and closes mobile navigation; apps without membership remain disabled with a reason. Discover shows no selected-app bar.

Candidate stage management uses the shared modal, fields, input, select, icon buttons
and footer actions. Stages are grouped by their immutable hiring phase; labelled
up/down controls reorder within that group, and removal is disabled for required
or occupied stages. The add-stage form stacks on phones. Pipeline and Candidates
expose Manage candidate stages beside section guidance for recruitment admins.
The candidate's Hiring progress panel labels immediate stage saves and retains
separate hiring actions for phase progression. Custom names are user content;
default interface labels and validation support English/Khmer and both themes.

Operational app dashboards use compact linked summary strips, app-specific quick
actions and two columns for attention and recent activity. HR queues and recent
records precede the optional workflow guide. Summary rows stack on
phones and keyboard focus remains visible. Lists use text, status and record
context, with wrapped titles and content-sized action buttons. Existing app
navigation stays in place; no extra sidebar menu is added for dashboard actions.
HR section guidance, URL-backed filters and contextual record details support
moving between dashboard, list and editor without losing the user's context.
Meeting and survey dashboards use the same layout and shared controls. All new
interface copy supports English/Khmer and the existing light/dark tokens.

HR workspace lists now use one bordered surface with collection navigation above
it, an All records / Needs attention switch, and an integrated search/status/sort
row. Contextual copy replaces duplicate introductions. Revisions are retained in
the record editor and history, removing an administrative column from the index.
Names and status stay visible on phones; long record context wraps within the
name column. Lists sort before pagination, and page/filter state lives in the URL. Optional HR
workflow guidance follows the list so records and actions remain first.

The shared HR editor groups related fields under short 18px section headings. Desktop
uses a narrow heading column alongside the fields; phones use the full viewport
and a persistent save/close footer. Available workflow actions precede the form.
Closing a changed record offers Keep editing or Discard changes. A compact,
expandable Workflow guide explains each app's sequence without adding sidebar
navigation. This extends the existing workspace colors, typography, shared controls
and English/Khmer support. Layout references: Shopify Polaris resource indexes
and Atlassian form sections; the application keeps its own brand and domain rules.


## App organization and workflow guidance

All twelve apps share one information architecture in `src/lib/appCatalog.ts`:
Work & collaboration (Requests & approvals, Tasks, Meetings, Surveys), People &
growth (Employees, Recruitment, Performance, Training), and Operations & reporting
(Attendance, Payroll, Assets, Reports). Discovery, the app switcher, documentation,
and global workflow search consume this catalog. Catalog search and category
filters live in the URL and recover through Clear filters. Searching uses translated
app descriptions and workflow steps; inaccessible apps explain the required access
and never act as launcher links. Global search omits apps without membership.

An optional, keyboard-operable How this app works disclosure follows the main
dashboard or collaboration list content and introduces three ordered steps.
The owner’s record-backed activation checklist remains before dashboard content. Guidance
links to real collections, names administrative steps, and links to the full guide.
These are instructions, not completion indicators. Administrative or cross-app
steps show an access explanation when the person lacks permission. Existing HR
list guides remain in their task context. Documentation shares the app groups,
searches section text, and folds its navigation on phones to prioritize the article.
Search reveals matching guides; selecting one clears the search and collapses
mobile navigation. Browse guides also clears an active search when collapsing
the navigation. Native fragment links connect the desktop table of contents to
real section IDs.

This extends the incumbent Anumat typography, semantic tokens, English/Khmer copy,
light/dark behavior, and shared `@app/ui` components built on shadcn/Radix. It adds
no new component framework or ornamental dashboard metrics.

References reviewed on 3 October 2026:
- [Enterprise SaaS UX course, all 16 lessons](https://www.chamrong.com/courses/enterprise-saas-ux/start-here-enterprise-ux-is-workflow-design).
  The lessons share a recurring task/context → states/permissions → prototype →
  keyboard and viewport verification → reusable guidance model. Applied here to
  app discovery, permission explanations, optional onboarding, and actionable help.
- [Supabase documentation](https://supabase.com/docs): task-led content groups,
  quickstarts, product guides, and searchable documentation. This informs content
  organization; it does not imply an integration with Supabase.
- [shadcn/ui documentation](https://ui.shadcn.com/docs): app-owned components
  underpin the existing shared layer. Workflow rules belong in Anumat's domain and
  app catalog rather than inside generic UI primitives.

Release verification covers catalog search/recovery, remembered filters, all twelve
guides and destinations, access restrictions, keyboard disclosure, Khmer copy,
dark mode, and desktop/mobile overflow. Further product decisions should be tested
with actual requesters, reviewers, and HR operators; automated checks establish
behavior, not measured user comprehension.
