# Anumat ERP prototype

Anumat is a decision and operations ERP prototype. Its current MVP brings requests,
approvals and configurable approval processes into one workspace. Purchase, leave,
expense and contract requests carry their context, attachments, approval route,
status and activity history. Operations, finance and people teams are the audiences
named in the existing product copy.

The prototype runs entirely in the browser. Its demo workspaces, people and request
history come from `src/data/seed.ts` and `src/data/seedMekong.ts`; changes persist in
local storage. Sign-in, invitations, notifications and sales submission demonstrate
flows. They do not authenticate an account, send messages or provision a server.
The account menu switches demo people and resets demo data. Login and SSO lead
to a six-digit verification demo using code `123456`. Recovery opens a local reset
preview; it sends no email and saves no password. Remember me saves only the
email address on this device.

Public routes include the landing page, sign-in, workspace setup and pricing.
Workspace setup captures the company name and size, teammate access and active
approval processes. The sidebar focuses on Home, Requests, Approvals and their
administration. Historical task, meeting, document and survey routes remain
available without adding them to the MVP navigation.

The app retains Anumat's name and logo, English/Khmer locale support, light/dark
preferences and mobile navigation. The user explicitly selected the Remote
marketing, setup and dashboard screenshots as the visual direction for a complete
redesign. This changes the presentation while retaining Anumat's product and demo
workflows. Visual implementation details belong in DESIGN.md.
