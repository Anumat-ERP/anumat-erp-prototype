# Anumat ERP prototype · hackathon edition

A clickable prototype of **Anumat**, the decision and operations ERP:
requests, approvals, meetings, documents, tasks and approval processes in one
workspace. Built with the Anumat design system and deployed to GitHub Pages.

**Live:** https://anumat-erp.github.io/anumat-erp-prototype-hackathon/

This is the **demo-day copy** of [anumat-erp-prototype](https://github.com/Anumat-ERP/anumat-erp-prototype)
in the hackathon brand: **Anumat Blue `#003D96`** and the submitted logo. Same screens
and demo tour. Only fix demo-breaking bugs here; build new features in the main
prototype (or the real app) and copy them over deliberately.

Everything runs in the browser with demo data. Changes you make (approving a
request, adding a task, editing a process) are saved in your browser only.
Use the account menu → **Reset demo data** to start over.

## What you can try

The site opens on the Anumat landing page. Click **See how it works** (or
**Demo tour** in the app's top bar) for a 9-step, 3-minute walkthrough that
resets the data and switches people for you. The full hackathon plan and demo
script are in [docs/HACKATHON.md](docs/HACKATHON.md).

| Screen | Try this |
|---|---|
| Landing (`/`) | The marketing page: what Anumat does, with Start free and See how it works |
| Sign in (`/signin`) | Any email works; `alex@…`, `priya@…` or `sokha@…` sign in as that person |
| Sign-up (`/welcome`) | Create a workspace: company name, invite the team with roles, pick starter processes. Also in the account menu |
| Home (`/home`) | See what is waiting on you, upcoming meetings, your tasks |
| Requests | Search and filter; open **PR-1042** |
| Request detail | **Approve**, **Request changes** or **Decline**; schedule a meeting about it; withdraw your own |
| New request | Pick a type and amount; the approval route updates live. Attach files, save a draft |
| Edit and resubmit | As Alex Tan, open **PR-1036** (changes requested) and resubmit |
| Approvals | Select several requests and approve them in one go |
| Meetings | Schedule one; record a decision; add an action item, which becomes a task |
| Documents | Open a document to see its version history |
| Tasks | **List** grouped by due date (Overdue, Today, This week, Later, Done in the last 7 days) or **Board** by status. Filter by person, source or search; open a task to edit it; **Manage statuses** to add your own, like “QA check” |
| Insights | Time to decision, where requests wait, spend by department |
| Process Builder | Edit a route, add a step, change thresholds; **Try it** shows which steps run |
| People & roles (`/settings/people`) | Owner / Admin / Member, and where each person approves. Admins change roles |
| RACI | Open a task: **R** owner and **A** assigner are shown; add **C**onsulted and **I**nformed people. As **Priya**, filter *Where I’m consulted* and comment. Each request page shows a RACI worked out from its approval route |
| Workspaces | The switcher at the top of the sidebar moves between **Lotus Logistics** and **Mekong Freight**; each has its own people, data and your role there |
| Notifications (`/settings/notifications`) | Pick Email or Telegram per event; **Connect Telegram** with a one-time code |
| Telegram preview (`/telegram`) | As **Priya**, see what the bot sends and tap **Approve**: the request is approved in Anumat |
| Add to calendar | Open a meeting: **Add to Google Calendar** or download an **.ics** for Outlook and Apple |
| New process | As an admin (or a member with *Can build processes*), Processes → **New process**: name, ID prefix, amount on or off, form fields, who can submit |
| Dynamic forms | Request forms, approval-step forms and surveys share one builder with 17 types: short answer, paragraph, email, phone, link, multiple choice, checkboxes, dropdown, yes/no, rating 1–5, scale 0–10, number, money, date, person, department, and section headings. Help text, placeholders, required, reorder, duplicate, and **Only ask when** an earlier answer is (or isn't) a value |
| Approval-step forms | Purchase → Finance review asks **Budget line** (required) and a ledger note. Priya fills it in when approving, on the web or with one tap per budget line on Telegram; the answers show on the approval route. Bulk approve skips steps that need details |
| Routing on answers | Purchase asks **Is this a new supplier?** Yes adds a **Supplier check** by Legal. In Process Builder, a step can run when "A form answer matches…", and **Try it** lets you answer to see the route |
| Surveys (`/surveys`) | As Dara, answer **Hybrid work pulse** (anonymous), then see charts per question. **New survey** → start from a template, add questions, choose everyone or departments, anonymous, closing day; the live preview shows follow-up questions appear. As **Lina**, answer from Home or the bell |
| Pricing (`/pricing`) | Cloud, your own cloud or on-premise; **Contact sales** form |
| Help & support | The **?** menu: contact channels, send feedback, report a problem. Admins see these and sales enquiries under Surveys → **Feedback & enquiries** |
| Permissions | As **Lina**, Alex's tasks are view only. As **Alex**, ticking a task Dara assigned sends it to her for sign-off; moving to Blocked asks why. As **Dara**, sign it off from the list or the bell |

Use the account menu to **view the prototype as** any of the eight people
(requester, manager, finance, legal, CEO…). Each has their own queue and
notifications. Light and dark themes follow your system.

## How it is built

- **Vite + React 19 + TypeScript**, React Router, Tailwind CSS v4.
- **Design system:** `@repo/ui` from
  [anumat-erp-storybooks](https://github.com/Anumat-ERP/anumat-erp-storybooks),
  vendored into `vendor/ui/` (components unchanged; stories and tests left out).
  `vendor/ui/UPSTREAM.md` records the exact upstream commit.
- **Brand:** `src/styles/anumat.css` points the design system's tokens at the
  Anumat palette and fonts from
  [anumat-erp-branding](https://github.com/Anumat-ERP/anumat-erp-branding):
  Anumat Blue #003D96 with white text on it, Navy Ink text, cool Paper background,
  Angkor Gold highlights (values match anumat-erp-web/packages/brand), Plus Jakarta Sans and
  JetBrains Mono.
- **Data:** `src/data/seed.ts` and `src/data/seedMekong.ts` (two demo
  workspaces, dates relative to today) and `src/data/store.tsx` (reducer, saved
  to `localStorage`).
- **Contact details:** `src/config.ts` holds the support Telegram, Facebook and
  email, the sales email, the Telegram bot and optional form-service URLs. They
  are empty until you fill them in, and the app shows "Not set up yet" instead
  of a made-up link.

```
src/
  layout/Shell.tsx     AppShell, navigation, top bar
  pages/               one file per screen
  components/          app-level pieces (logo, approval timeline, decision modal…)
  data/                types, seed data, store
  styles/              app.css (entry) and anumat.css (brand layer)
vendor/ui/             the design system, synced by scripts/sync-ui.sh
```

## Develop

```sh
bun install
bun run dev            # http://localhost:5173
bun run build          # type-check + production build into dist/
```

## Update the design system

```sh
scripts/sync-ui.sh ../anumat-erp-storybooks   # path to a checkout of the design system
bun run build
```

Don't edit files in `vendor/ui/`; change them upstream and sync.

## Deploy

Every push to `main` builds and deploys to GitHub Pages
(`.github/workflows/deploy.yml`). Deep links work because the build copies
`index.html` to `404.html`, which Pages serves for unknown paths.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Share as a single page

`bun run build:artifact` writes `dist-artifact/anumat-prototype.html`: the
whole prototype in one self-contained file (scripts, styles and fonts inlined),
with navigation kept in memory instead of the URL. Use it where you can host a
single HTML page, such as a claude.ai Artifact.
