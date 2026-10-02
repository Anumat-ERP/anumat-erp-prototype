# Anumat ERP prototype

The current Anumat browser prototype, merged from the hackathon app. It demonstrates requests, approvals, configurable approval processes, people, insights, and supporting task, meeting, document, and survey flows. Demo data and changes stay in the browser; sign-in, notifications, and sales contacts are interactive previews rather than connected services.

**Live:** https://anumat-erp.github.io/anumat-erp-prototype/

The interface supports English and Khmer, light and dark themes, and desktop and mobile layouts. Its component system uses React, Radix primitives, Tailwind CSS, and app-owned controls in `src/ui/`. The production build is a static Vite site.

## Develop and verify

```sh
bun install --frozen-lockfile
bun run dev
bun run check-types
bun run check:i18n
bun run build
bun run test:e2e
```

The browser tests cover the main request and approval workflows, setup, authentication previews, document viewing, the process marketplace, public pages, and responsive English/Khmer layouts. The demo verification code is `123456`.

## Deploy

Every push to `main` builds and deploys to GitHub Pages through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The workflow sets the base path from this repository's name, so assets load under `/anumat-erp-prototype/`. The build also copies `index.html` to `404.html` for direct links to app routes.

`bun run build:artifact` creates a self-contained HTML version in `dist-artifact/` for sharing as a single file.
