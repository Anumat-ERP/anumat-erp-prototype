# Hackathon finish map

**Goal:** win with a polished, low-risk demo that tells one story end to end:
*one request goes from ask → approve → decide → act → track, and nobody chases anyone.*

**Timeline assumed:** a little over two weeks to demo day. The prototype is a
front-end demo with seeded data (no backend), deployed to GitHub Pages.

---

## Where we are

Done and verified in a browser (light, dark, phone width):

| Area | What works |
|---|---|
| Requests | List with search/filters, detail, new request with live approval-route preview, drafts, edit and resubmit after changes, withdraw, attachments (name and size) |
| Approvals | Inbox, approve / request changes / decline with comments, bulk approve, "decided by you" |
| Routing | Rules by type and amount; Process Builder edits steps, approvers, thresholds, SLAs with a "Try it" preview |
| Meetings | List, schedule (also from a request, with suggested invitees), decisions, action items that become tasks |
| Documents | List with filters, version history drawer |
| Tasks | Board by status, "only my tasks", overdue flags |
| Insights | Time to decision vs target, where requests wait, spend by department, weekly volume |
| People | "View as" any of 8 people; notifications bell per person |
| Landing | Marketing page at `/` following the original sketch: hero with a live product preview, problem, flow, modules, use cases, security, pilot, FAQ, closing call to action |
| Sign-in / sign-up | Mock sign-in at `/signin` (any email; `alex@…` signs in as Alex) and "Create your workspace" at `/welcome` |
| Demo | Guided 9-step tour (top bar → **Demo tour**) that resets data and switches people for you |
| Brand | Anumat design system + brand tokens, accessible contrast, dark mode |

Not built: real backend, real sign-in and invites, email, real file storage, AI.

**Accounts model (for judge questions):** the organisation is the account. The first person creates the workspace and becomes its owner; teammates join by invite or invite code; roles are Admin, Approver, Member; approvers mostly come from the org chart; data is kept separate per organisation. After the hackathon, use a managed service with organisations built in (Clerk, Supabase Auth or Auth0) rather than building sign-in.

---

## What judges usually score, and how we answer it

| Criterion | Our answer | Evidence on stage |
|---|---|---|
| Problem is real | Decisions are scattered across email, chat, spreadsheets | Opening line + "Needs your decision" |
| Solution is clear | One request's full journey in 3 minutes | The demo tour |
| Execution / polish | It looks and feels like a product | Design system, dark mode, phone view, no dead ends |
| Innovation | Rules-based routing + (planned) AI decision brief | Process Builder "Try it", AI brief |
| Impact / business | Time to decision, bottlenecks, spend visibility | Insights page |
| Feasibility | Built on a real component library with tokens and tests | Storybook, repo structure |

---

## Plan

Priorities: **P0** must ship for the demo · **P1** strongly recommended · **P2** only if time allows.

### Week 1 — make the story undeniable

| # | Task | Priority | Notes |
|---|---|---|---|
| 1 | Turn on GitHub Pages and confirm the live URL | P0 | Settings → Pages → Source: GitHub Actions, then re-run the workflow |
| 1b | Replace the landing page's pilot block with a real quote once a pilot user agrees to be named | P1 | Never show a made-up testimonial |
| 2 | Rehearse the demo tour 5 times; fix every snag you hit | P0 | Keep a list; each snag is a small fix |
| 3 | **AI decision brief** on request detail: summary, risks, suggested decision | P1 | Biggest "wow" per hour of work. Needs a decision on how to call the model (see below) |
| 4 | Replace seed names, amounts and currency with your team's real context | P1 | Judges trust specific details |
| 5 | Empty, loading and error states on the main screens | P1 | The design system already has the components |
| 6 | Usability test with 3 people outside the team | P1 | Give them one task: "get this approved". Note where they hesitate |

### Week 2 — make it look inevitable

| # | Task | Priority | Notes |
|---|---|---|---|
| 7 | Pitch deck (6 slides, see outline below) | P0 | Use the brand kit and the social card |
| 8 | Record a 90-second backup video of the tour | P0 | Your fallback if Wi-Fi or the projector fails |
| 9 | Mobile approve flow: approve from a phone in 2 taps | P1 | Strong live moment: approve on your phone while the laptop updates |
| 10 | Delegation / out-of-office ("approve on behalf of") | P2 | A common judge question |
| 11 | Real persistence (Supabase or Firebase) behind the store | P2 | Only if a judge criterion rewards working tech; the store is already isolated in `src/data/store.tsx` |
| 12 | Put the Anumat brand into the Storybook tokens | P2 | One design system across repos |

### Final 3 days — freeze and rehearse

- Code freeze 48 hours before. Only fix demo-breaking bugs.
- Rehearse with a timer. Target 2:45 so you finish with margin.
- Test on the actual demo laptop, browser, screen resolution and network.
- Open the site once on the venue Wi-Fi, then keep the tab open (it works offline after loading).
- Bring the backup video on a USB stick and in the cloud.

---

## The AI decision brief (P1): pick one approach

Show a card on the request page: *"Summary · Risks · Suggested decision"*.

| Option | How | Pros | Cons |
|---|---|---|---|
| A. Presenter's own API key | The page asks for a key once and stores it in the browser; calls the model directly | Real AI, no server | Key lives in the browser: only for the demo laptop, never commit it |
| B. Small serverless proxy | A Cloudflare Worker or Vercel function holds the key; the page calls it | Real AI, key stays secret, shareable | A bit of setup; needs an account |
| C. Scripted brief | Pre-written briefs for the demo requests, clearly labelled "sample" | Zero risk | Not real; don't claim it is |

Recommendation: **B** if you have a day, otherwise **A** for stage only. Keep **C** as the offline fallback.

---

## 3-minute demo script

Run **Demo tour** from the top bar; it follows this script and resets the data.

| Time | Step | As | Say | Do |
|---|---|---|---|---|
| 0:00 | Sign up | Dara | "Dara's company runs approvals on email. She sets up Anumat for everyone in under a minute." | On the landing page, Start free → name is pre-filled → Continue → glance at invites and roles → Continue → Create workspace |
| 0:30 | Problem → one place | Dara | "Everything waiting on Dara is now in one place." | Point at "Needs your decision" and the company name |
| 0:45 | Ask | Alex | "Alex needs laptops. One form, and Anumat already shows who approves." | Change amount 7500 → 500 → 7500, Submit |
| 1:10 | Approve | Dara | "It's at the top of Dara's queue with everything she needs." | Open it, Approve |
| 1:25 | Rules route it | Priya | "Over $1,000, so Finance is next. Nobody chased anyone." | Open the bell, Approve |
| 1:45 | Decide together | Dara | "Bigger calls happen in meetings, recorded next to the request." | Record a decision, add an action item for Alex |
| 2:10 | Act | Alex | "That's now Alex's task, linked to the decision." | "Only my tasks", tick one off |
| 2:25 | Change the rules | Dara | "Operations owns the process, not IT." | Raise the Finance threshold, Try it |
| 2:45 | Track | Sokha | "Leadership sees how fast decisions happen, and where they stick. Ask, approve, move forward." | Hover "Where requests are waiting" |

**Presenting:** open the live URL's landing page and click **See how it works**.
- The panel shows only the step name and Next, so the audience can't read your
  script. The eye button shows the script; keep it on your laptop or on cards.
- **Page Down / Page Up** (what most clickers send) move between steps; the arrow
  keys work too when no control is focused. Keys typed into a form never change steps.
- The chevron minimizes the panel; pages leave room at the bottom so it never
  covers their last buttons.

---|---|---|---|---|
| 0:00 | Problem | Dara | "Requests live in email, chat and spreadsheets. Nobody knows who decides or what's next." | Point at "Needs your decision" |
| 0:20 | Ask | Alex | "Alex needs laptops. One form, and Anumat already shows who approves." | Change amount 7500 → 500 → 7500, Submit |
| 0:50 | Approve | Dara | "It's at the top of Dara's queue with everything she needs." | Open it, Approve |
| 1:10 | Rules route it | Priya | "Over $1,000, so Finance is next. Nobody chased anyone." | Open the bell, Approve |
| 1:35 | Decide together | Dara | "Bigger calls happen in meetings, recorded next to the request." | Record a decision, add an action item for Alex |
| 2:00 | Act | Alex | "That's now Alex's task, linked to the decision." | "Only my tasks", tick one off |
| 2:20 | Change the rules | Dara | "Operations owns the process, not IT." | Raise the Finance threshold, Try it |
| 2:40 | Track | Sokha | "Leadership sees how fast decisions happen, and where they stick. Ask, approve, move forward." | Hover "Where requests are waiting" |

---

## Pitch deck outline (6 slides)

1. **Title** — Anumat logo, "Every request becomes a clear decision."
2. **Problem** — one real story of a request lost in email; the cost in days.
3. **Solution** — Ask → Approve → Move forward; the six modules in one picture.
4. **Live demo** — switch to the browser (the tour).
5. **Why now / why us** — design system, rules engine, AI brief; what's next.
6. **Ask** — what you want from the judges or partners; team; contact.

---

## Likely judge questions

| Question | Answer |
|---|---|
| Is this real or a mock-up? | A working front end with seeded data; routing rules, notifications and insights are computed live. The backend is the next step. |
| How is this different from Kissflow or Odoo? | Focused on decisions, not a full ERP: request, meeting, decision and task are one linked record. |
| Who buys it? | Operations leads at 50–500 person companies who approve spend and time off in email today. |
| How do people sign up? | A company creates a workspace; teammates join by invite or code with a role (the sign-up step of the demo). |
| How do you handle permissions? | Admin, Approver and Member roles; the prototype shows each person's view through "View as". |
| What about data security? | Planned: encryption in transit and at rest, an audit trail (already visible as request activity), version history. |

---

## Demo-day checklist

- [ ] Live URL opens on the demo laptop
- [ ] **Reset demo data** done; tour starts from step 1
- [ ] Browser zoom set so the audience can read it (125–150%)
- [ ] Notifications and other apps silenced
- [ ] Backup video ready
- [ ] Deck exported to PDF as a fallback
- [ ] Someone watches the clock
