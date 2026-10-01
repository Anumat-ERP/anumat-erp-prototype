# Anumat ERP prototype · hackathon edition

A clickable prototype of **Anumat**, the decision and operations ERP:
requests, approvals and approval processes in one
workspace. Built with the Anumat design system and deployed to GitHub Pages.

**Live:** https://anumat-erp.github.io/anumat-erp-prototype-hackathon/

This is the **demo-day copy** of [anumat-erp-prototype](https://github.com/Anumat-ERP/anumat-erp-prototype)
in the hackathon brand: **Anumat Blue `#003D96`** and the submitted logo. Same screens
and demo tour. The product UI follows the calm back-office principles in
[anumat-erp-web/packages/brand](https://github.com/Anumat-ERP/anumat-erp-web/tree/main/packages/brand):
⌘K / Ctrl+K search, A/R/D shortcuts for approvers, exact times on hover, compact
spacing in the account menu. Motion is quiet and explains changes: pages settle in, what you just added or changed is briefly highlighted, charts grow once, and light/dark cross-fade (all off with reduced motion). Only fix demo-breaking bugs here; build new features in the main
prototype (or the real app) and copy them over deliberately.

Everything runs in the browser with demo data. Changes you make (approving a
request, adding a task, editing a process) are saved in your browser only.
Use the account menu → **Reset demo data** to start over.

## MVP experience

The main menu focuses on **Home, Requests and Approvals**. **Administration**
contains approval processes, people and roles, and insights. Meetings, tasks,
documents and surveys remain accessible by their existing routes for historical
prototype demos, but are hidden from navigation, search and the home screen.
The guided tour follows the approval MVP.

Under **Approval processes → Preset marketplace**, search six starter presets by
name or purpose, filter by category, and preview form fields and approval rules.
Choose an approver for every step and select **Use this preset** to create an
independent, paused process. Review it in the editor, save any changes, then enable
it from **Your processes**. Only admins and members with process-building access
can add presets. All preset installations remain browser-local demo data.

Choose **English / ខ្មែរ** in the header or sign-in screen. The core approval
interface supports Khmer; the choice is remembered on this device and switching
preserves unsaved forms. Company names, configured process names, form questions
and entered content retain their original language. Some marketing, tour narration,
advanced configuration and legacy module copy remains English.

Light and dark themes use Anumat Blue, warm light surfaces and navy dark surfaces,
with a self-hosted Noto Sans Khmer font. Existing design-system components are kept.

Everything here is a browser-only demo. Use the account menu to switch among demo
people, choose a theme, or reset demo data. No real email or Telegram messages are sent.

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
