# Anumat Storybook

Interactive documentation for the prototype's actual React UI, in this project. Built with Storybook 10.6, React/Vite, Docs, and Accessibility addons following the [official React/Vite integration](https://storybook.js.org/docs/get-started/frameworks/react-vite/).

## Run and build

```sh
bun install
bun run storybook
```

Open http://localhost:6006. If that port is occupied, run `bun run storybook --port 6008`.

```sh
bun run check:storybook
bun run build-storybook
bun run test:storybook
```

The static site is generated in `storybook-static/`, which is ignored by Git. Serve that directory over HTTP to share it. No deployment or publishing is configured. The browser tests require the current static build and use port 6007 independently of the development server. Install Chromium with `bunx playwright install chromium` if it is missing.

## Catalog

| Area | Coverage |
| --- | --- |
| Welcome | Product rules, usage, accessibility, localization, contribution guide |
| Foundations | Semantic color tokens, typography, spacing, Lucide icons, focus and control states |
| Actions | Button variants/sizes/loading/disabled, named IconButton, ActionMenu |
| Forms | Field labels/help/errors/floating, Input, Textarea, Select/grouped options, Checkbox, Switch, RadioGroup, DatePicker, Calendar, TimePicker, SearchField, PasswordInput, CodeInput, DropZone, Label, SelectionCheckbox |
| Content | Text roles, FigureValue, Card/CardHeader, Avatar, Badge, Tag, List, DescriptionList, Divider, KbdShortcut, Accordion |
| Feedback | Banner tones, ProgressBar, Spinner, Toast, EmptyState |
| Overlays | Modal/destructive confirmation, Drawer, Popover, Tooltip |
| Navigation | PageHeader, expanded/collapsed Navigation, AppShell, SidebarProvider/Trigger/Expanded, Link |
| Data | DataTable sorting/selection/density/loading/error/empty, IndexTable resource mode, Filters, BulkActions, ChartContainer/ChartTooltipContent |
| Workflow patterns | All dynamic field types, conditional questions, FormBuilder, rich descriptions/read-only editor, acceptance criteria, DoR, DoD, evidence, priorities, React Flow simulation, SOP/RACI/privacy/history guidance, app context bars, animated/static Discover welcome banner |
| Apps | Discover, collaboration dashboards, requests/new request, approvals, process list/builder, task list/empty/member/viewer, app people/roles, surveys/empty/member/builder, meetings/empty/new meeting, personal notification preferences, workspace people, documents, insights, Telegram preview, not found |

Compound component children are documented with their parent. Hooks, utilities, and internal implementation helpers do not get meaningless standalone visual stories. Apps/HR lifecycle adds 22 examples for the eight HR modules, employee details, scoped self-service, viewer access, empty records, people/roles, candidates, attendance periods, courses, reservations, dashboards, and Khmer dark mode. The catalogue contains 260 stories, including the nine shared foundation examples and eight workflow completion examples. These examples demonstrate local prototypes; they do not establish commercial or production acceptance.

## Fixtures and persistence

`src/stories/fixtures.ts` copies the existing seed and adds a deterministic purchase process with manager review and finance review above 1,000. English demo content represents user-entered content and is preserved across interface languages.

The shared preview supplies the real ThemeProvider, LocaleProvider, MemoryRouter, StoreProvider, TooltipProvider, ToastProvider, and TourProvider. App stories render the actual `App` routes and shell, so navigation and permission checks work normally.

StoreProvider accepts an optional `initialState` and `persist={false}`. These defaults do not change the app: without those props, it still loads and saves the normal workspace. Stories initialize independent in-memory state and never write `anumat-hackathon-v1`. Changing story/language or reloading remounts the fixture. Display preferences may still use their normal localStorage keys on Storybook's separate origin.

Nothing is sent externally. Invitation and notification setup examples retain the app's prototype behavior. Simulation mutates only preview state. Uploaded files are selected locally; no upload endpoint is provided.

## Themes, languages, and responsive review

Use the global light/dark and English/Khmer toolbar controls. Use Storybook's viewport tools for phone/tablet/desktop. Canvas is the useful view for full app screens and interactive overlays; Docs provides props and examples for components.

System copy in actual components uses the app translator. English documentation and illustrative fixture labels intentionally remain English; the application translation audit excludes `src/stories` while continuing to scan all product source. This prevents demo/technical documentation strings from polluting the product dictionary.

The Accessibility panel supports inspection. Existing app accessibility issues should be triaged rather than claiming a global WCAG pass from a component scan. Charts include text data; process simulation has a list view. Test keyboard behavior, focus return, accessible names, and recovery states as well as appearance.

## Add a story

1. Add a `.stories.tsx` file under foundations, components, patterns, or apps.
2. Use `Meta` / `StoryObj` from `@storybook/react-vite`; import the actual shared component.
3. Supply meaningful args and document the usage rule. Use a React demo with local state for controlled inputs.
4. Include relevant disabled, read-only, error, empty, loading, long-content, and permission states.
5. For app screens set `parameters: { layout: 'fullscreen', route: '/tasks', role: 'viewer' }`. `role` accepts admin/member/viewer; `empty: true` removes work records.
6. Add focused interactions when a new behavior matters. Catalog smoke tests discover every exported story from the build's `index.json` automatically.

The dedicated Storybook TypeScript configuration checks both stories and configuration. Browser tests run the production static build on desktop and mobile, reject render exceptions, exercise critical interactions, and capture representative app/pattern screenshots. The standard application Playwright suite remains separate.

Apps/Recruitment adds thirteen stories covering its dashboard, pipeline, JD management and details, structured candidate background, independent headcount and offer reviews, interviews, career preview, onboarding, empty state and Khmer dark mode. See `docs/roadmap/RECRUITMENT_PROTOTYPE.md` for the connected demo.

The shared foundation now has nine `Apps/Workspace foundation` examples for My work (including empty/member), company settings (including read-only/Khmer-dark), owner workspace data and delivery previews. The built catalog has 260 stories. Verify this addition with `bun run test:storybook -g apps-workspace-foundation` after rebuilding.

`src/stories/apps/Completion.stories.tsx` adds eight `Apps/Workflow completion` examples: meeting notes, meeting notes in Khmer/dark, closed-survey follow-up, packages, packages as a member, packages in Khmer/dark, operator preview and operator owner-required access. They render the actual routes with isolated fictional state. The scoped static-build check passed all 16 desktop/mobile renders. After rebuilding, run `bun run test:storybook -g apps-workflow-completion`. These stories cover the named surfaces; they do not claim exhaustive coverage of HR advanced actions or production commercial services.
