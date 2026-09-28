# Anumat ERP prototype

A clickable prototype of **Anumat**, the decision and operations ERP:
requests, approvals, meetings, documents, tasks and approval processes in one
workspace. Built with the Anumat design system and deployed to GitHub Pages.

**Live:** https://anumat-erp.github.io/anumat-erp-prototype/

Everything runs in the browser with demo data. Changes you make (approving a
request, adding a task, editing a process) are saved in your browser only.
Use the account menu → **Reset demo data** to start over.

## What you can try

| Screen | Try this |
|---|---|
| Home | See what is waiting on you, upcoming meetings, your tasks |
| Requests | Search and filter; open **PR-1042** |
| Request detail | **Approve**, **Request changes** or **Decline**; watch the approval route move on |
| New request | Pick a type and amount; the approval route updates live |
| Approvals | Select several requests and approve them in one go |
| Meetings | Record a decision; add an action item, which becomes a task |
| Documents | Open a document to see its version history |
| Tasks | Tick tasks off or move them between columns |
| Process Builder | Edit a route, add a step, change thresholds; **Try it** shows which steps run |

You are signed in as **Dara Sok**, Operations Manager. Light and dark themes
follow your system; switch with the moon/sun button.

## How it is built

- **Vite + React 19 + TypeScript**, React Router, Tailwind CSS v4.
- **Design system:** `@repo/ui` from
  [anumat-erp-storybooks](https://github.com/Anumat-ERP/anumat-erp-storybooks),
  vendored into `vendor/ui/` (components unchanged; stories and tests left out).
  `vendor/ui/UPSTREAM.md` records the exact upstream commit.
- **Brand:** `src/styles/anumat.css` points the design system's tokens at the
  Anumat palette and fonts from
  [anumat-erp-branding](https://github.com/Anumat-ERP/anumat-erp-branding):
  Anumat Orange with Ink text, warm Paper background, Plus Jakarta Sans and
  JetBrains Mono.
- **Data:** `src/data/seed.ts` (demo data, dates relative to today) and
  `src/data/store.tsx` (reducer, saved to `localStorage`).

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
