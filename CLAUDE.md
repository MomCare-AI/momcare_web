@AGENTS.md

---

# MomCare frontend

The hospital-facing portal for a maternal-health monitoring platform. Talks to the
Django API in the sibling `backend/` repo (a **separate git repository** — a change
touching both produces two commits).

Read `../docs/PLAN.md` first: it holds the current status, the decisions not to
revisit, and the rules below in fuller form.

## Layout

```
src/
├── app/
│   ├── (auth)/        login · register · invite/[token]
│   └── (portal)/dashboard/   layout.tsx is the shell; exports usePortal()
├── core/              infrastructure that knows this app, not one clinical domain
│   ├── api/authFetch.ts      THE api client — do not add a second one
│   └── query/                TanStack Query client + clearQueryCache()
├── features/          one folder per clinical domain, owning its types/api/hooks
│   ├── patients/  monitoring/  alerts/  staff/  portal/
└── shared/            zero MomCare awareness — a button must not know what a patient is
```

## Rules specific to this codebase

**One API client.** Everything goes through `authFetch` / `authJson`. It handles
refresh-on-401 with a shared in-flight promise so parallel expiries trigger one
refresh, not several. Never call `fetch` directly against `/api/` from a component,
and never add axios.

**Clear the query cache on identity change.** The browser query client is a
module-level singleton that survives sign-out. `clearQueryCache()` is called on both
sign-out and sign-in — without it the portal renders the _previous_ user, which is
one person's clinical data in another person's session. Tests cover this.

**Server state belongs to TanStack Query.** Mutations invalidate; pages never
refetch each other. Search and pagination run on the server — the browser must
never receive rows it would then filter away.

**A 403 is sometimes the answer, not a failure.** The invite list resolves to `[]`
for non-admins. `SessionExpiredError` is never retried.

## Two design systems, deliberately

| Where            | File          | Prefix                            | Feel                                          |
| ---------------- | ------------- | --------------------------------- | --------------------------------------------- |
| Marketing + auth | `globals.css` | `hw-*`                            | Warm neumorphic — speaks to expectant mothers |
| Clinical portal  | `portal.css`  | `mc-*`, scoped under `.mc-portal` | Clinical teal on near-white — read for hours  |

Portal specifics: teal `#087F73`, ground `#F6F9F9`, white cards, 1px `#E2EBE9`
borders, 12–14px radii, Lucide icons (**never emoji**), tabular numerals,
**top navbar — never a sidebar**, mobile drawer under 860px.

## Interface rules that are not negotiable

- **Never fabricate clinical data.** Modules that do not exist show designed empty
  states, not placeholder numbers.
- **Colour is reserved for clinical state** — stable `#17866F`, moderate `#D99A32`,
  high `#D9685F`, critical `#B83C3C`. If the accent were decorative, a real alert
  could not stand out.
- **Never colour alone.** Every state carries a text label, for accessibility and
  for printing.
- **Absent data stays visibly absent** — "No reading", never a normal-looking
  default, and never "Stable" for a patient nobody has measured.
- **An error must not render as emptiness.** "Nothing to review" and "we could not
  find out" are opposite messages to a clinician.
- **AI output is always labelled** decision support, never diagnosis.

## Working efficiently in this codebase

Small/medium tasks (a single-file fix, a CSS/layout tweak, a small component
change): locate the target file, read only what's directly relevant, make
the smallest correct change, run the smallest relevant check, stop. Don't
scan the repo, read unrelated files, or re-read files already inspected in
the same task.

Frontend-only by default — don't inspect or run `../backend` unless the
task genuinely can't be resolved without checking an API contract.

**Subagent rule.** No subagents for: single-file changes, CSS/layout fixes,
simple UI/component changes, straightforward CRUD UI work, simple bug fixes,
simple TypeScript fixes, locating symbols/files, or other similarly small,
well-scoped tasks. Use `Grep`/`Glob` directly instead.

**Verification rule.** Verification matches the change size:

- CSS/UI change → targeted visual check; typecheck only if relevant.
- TypeScript change → typecheck, plus lint when appropriate.
- Behavior change → the relevant test.
- Larger feature → broader verification.
- Avoid expensive full-project verification (e.g. a full `vitest run`) for
  small changes.

**Long-session context rule.** Trust current repository state and
`../docs/PLAN.md` over old conversational context, not what was said many
turns ago (the path is relative to this file — `docs/` sits beside
`frontend/`, not inside it). Use `PLAN.md` as the single project-state
document — update it when project state genuinely changes, never create a
second summary/state document.

## Commands

```bash
npm run dev          # localhost:3000
npx tsc --noEmit     # typecheck
npx vitest run       # tests
npx next build       # production build
```
