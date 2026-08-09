# Architecture Decisions

A log of _why_, not _what_ — the code shows what exists, this records the
reasoning behind decisions that aren't obvious from reading it. New entries
go at the bottom, oldest first.

## 2026-08-09 — Feature-based folder structure

Chosen over grouping by file type (all pages together, all components
together, etc.). Each real-world domain (`auth`, later `patients`,
`appointments`, ...) owns its own `components/`, `hooks/`, `services/`,
`types.ts`. Scales better across three portals and multiple contributors
because logic for one thing lives in one place instead of scattered across
parallel type-based folders. See `docs/conventions.md` for the exact shape.

## 2026-08-09 — `app/` cannot be renamed or reordered

Next.js hardcodes the `app/` folder name to locate routes — confirmed by
testing (`01-app` broke the build with "Couldn't find any pages or app
directory"). This ruled out forcing a custom on-disk folder order via
numeric prefixes across `src/`, since digits sort before letters and would
always push `app` out of first position. Standard alphabetical folder names
were kept instead of a prefix scheme, because the cosmetic ordering benefit
didn't outweigh making every `@/` import path permanently uglier
(`@/b-features/...`) for the life of the project.

## 2026-08-09 — `middleware.ts` → `proxy.ts`

Next.js 16 deprecates the `middleware` file/export name in favor of `proxy`
(confirmed in `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
`AGENTS.md` requires heeding deprecation notices in this repo, so the file
is `src/proxy.ts` exporting `proxy()`, not `middleware()`.

## 2026-08-09 — Auth token in `localStorage` + `Authorization` header, not a cookie

The backend is a separate Django REST API that re-validates the token on
every request — Django is the real authorization boundary, not anything in
Next.js. That means client-held token + header (as `services/api-client.ts`
already does) is the standard, correct pattern for a decoupled backend, not
a gap to fix. Route-gating in `proxy.ts` (e.g. redirecting an NGO user away
from `/doctor`) is UX polish on top of that, not the security layer.
**Future option, not yet needed:** if instant server-side redirects become
worth it, drop just the user's _role_ (not the token) into a plain
readable cookie at login so `proxy.ts` can act on it without exposing the
real token there.

## 2026-08-09 — Only build what's real; empty folders over fake code

Feature domains with no real implementation (`nutrition`, `exercise`,
`ngo-management`, `admin-control`, and later `patients`, `alerts`,
`appointments`, `lab-reports`, `risk-engine`) were removed entirely rather
than kept as empty scaffolding, keeping only `auth` since it's the one
feature with real, working code. Same rule applied project-wide: fake
placeholder components (`return null`) and empty `actions/`/`store/`/
`types/` files were deleted, while their parent folders were kept (via
`.gitkeep`) as signposts for where future code goes. Rule: an empty folder
is an honest placeholder; a file with no real implementation is not.

## 2026-08-09 — `services/` is the default; `actions/` is opt-in

Next.js Server Actions do work with a Django backend (they can call it like
any server-side fetch), but they add a network hop (browser → Next server →
Django) that's only worth it for hiding a secret, avoiding CORS, or a
no-JS-fallback form. Since the API base URL is already public
(`NEXT_PUBLIC_API_URL`) and auth is a client-held token, most calls go
through `services/` (client → Django directly), matching what
`features/auth/services/auth.ts` already does. `actions/` stays available
for the specific cases above, not as the default path.

## 2026-08-09 — Pre-commit hooks: Husky + lint-staged + typecheck, no test step (initially)

Set up via the `setup-pre-commit` skill: Prettier on staged files, then
`npm run typecheck`. A `test` step was deliberately left out at first
because no test framework existed yet — adding a `test` command that would
just fail with "no test command found" would have blocked every commit.

`typecheck` runs `next typegen && tsc --noEmit`, not plain `tsc`, because
Next.js only generates route types (e.g. `LayoutProps`) via `next dev`,
`next build`, or `next typegen` — plain `tsc` fails on a clean checkout
where `.next/` doesn't exist yet (as it wouldn't after a fresh clone).

## 2026-08-09 — Vitest + React Testing Library for testing

Chosen by following Next.js's own current documentation
(`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`) rather
than defaulting to Jest. First test written was a real one, against the
only real code that existed (`useAuth`) — not a placeholder test for
unbuilt features. `npx vitest run` (one-shot) was added to the pre-commit
hook once this existed; `npm run test` stays in watch mode for local dev.

## 2026-08-09 — No CI / branch protection yet; PR review instead

Given the small, trusted three-person team and how early-stage the project
is, GitHub Actions CI + branch protection was deliberately deferred rather
than set up preemptively. A required PR review (configured directly on
GitHub) covers the immediate risk instead. Revisit CI when the team grows,
multiple people are merging into `main` concurrently, or a broken `main`
would actually cost something (e.g. near a demo/deadline). Note the real
gap this leaves: PR review confirms a human looked at the diff, not that
tests/types were automatically re-verified — CI would add that guarantee
when it becomes worth the setup cost.

## 2026-08-09 — `core/` / `features/` / `shared/` three-tier split

Adopted after comparing against a real production RPM (Remote Patient
Monitoring) frontend a team member had worked on. That project's `core/`
vs `modules/` vs `shared/` split exposed a real gap in ours: `auth` was
sitting inside `features/` as if it were a business domain like `patients`
would be, when it's actually infrastructure every feature depends on.

Reconciled version (not a direct copy — several of their patterns exist
only because they're on Vite/React Router, not Next.js):

- **`core/`** — app-aware infrastructure: `auth/`, `api/` (the shared HTTP
  client, moved from `src/services/`), `authorization/`, `config/`
  (moved from `src/config/`), `guards/`, `notifications/`, `query/`.
  `features/auth/` moved to `core/auth/` wholesale, since authentication
  isn't a clinical domain.
- **`features/`** — business domains only. `dashboard/` added as an empty
  template (mirrors `auth`'s old shape) purely so the folder pattern is
  visible in the repo itself, not just described in `conventions.md`.
- **`shared/`** — renamed from `components/`, internally tiered by how
  composed something is: `ui/` (atoms), `components/` (molecules),
  `widgets/` (organisms), plus `charts/` and `forms/`. `hooks/` and `lib/`
  deliberately stay separate top-level folders, not folded into `shared/`
  — kept as their own thing rather than over-consolidating.
- **Flat `store/` and `actions/` folders removed.** State and Server
  Actions colocate with whatever owns them instead (`core/auth/auth.store.ts`
  once genuinely needed; `features/patients/actions/` once a feature needs
  a Server Action) rather than being dumped in a shared bucket with
  unrelated concerns.
- **`core/layouts/` and the reference project's module self-registration
  system were deliberately not adopted.** Next.js's `app/(group)/layout.tsx`
  already solves what their hand-built layout system solves (Vite has no
  file-based layouts). The registry pattern solves "toggle whole clinical
  programs on/off per tenant without redeploying" — not a problem MomCare
  has with three fixed portals.
- **`mockData/`** added at the project root — fake JSON shaped like real
  Django responses, so UI work isn't blocked waiting for the backend team
  to stage an endpoint.

## 2026-08-09 — Vitest pool set to `threads`, not the default `forks`

After moving `useAuth.test.ts` into `core/auth/hooks/`, `npx vitest run`
started failing consistently with `Timeout waiting for worker to respond`
— the default `forks` pool couldn't spawn a child process in this
environment (spawning processes vs. threads have different permission
requirements, and this environment restricts the former). Confirmed with
`--pool=threads`, which worked immediately. Set `pool: "threads"` in
`vitest.config.mts` so this doesn't randomly break for anyone whose
machine/CI environment has the same restriction.

## 2026-08-10 — TanStack Query for server data, set up now (not deferred)

Unlike the state-library question (still deferred — no second consumer of
shared client state exists yet), a data-fetching library was implemented
immediately once discussed, because the payoff is immediate: nearly every
real feature (patients, appointments, alerts) will fetch data from Django,
and each one would otherwise hand-roll its own loading/error/caching logic
with `useState`/`useEffect`, the way `useAuth.ts` currently does in miniature.

`core/query/queryClient.ts` follows TanStack Query's official Next.js App
Router pattern: a `makeQueryClient()` factory, called fresh on every
request on the server (`isServer` check) but memoized as a singleton in
the browser — this avoids both leaking one user's cached data into another
user's server-rendered request, and recreating the client on every client
render. `core/query/QueryProvider.tsx` is a client component wrapping
`app/layout.tsx`'s children, giving every route access to `useQuery`.
`staleTime: 60_000` is TanStack's own documented default recommendation
for this setup, not a MomCare-specific tuning decision — worth revisiting
once real endpoints exist and actual staleness needs are known.

Zustand (client-only state) remains explicitly not implemented, per the
"no second consumer yet" reasoning from the state-library discussion.

## 2026-08-10 — `useAuth` no longer uses a `useEffect` to set `loading: false`

`useAuth` had `loading` start `true`, then a `useEffect` immediately called
`setLoading(false)` — causing two renders to reach the final state
(`react-hooks/set-state-in-effect` lint error), plus an unused `setUser`
(nothing calls it yet). The effect existed as a placeholder for "check the
token, then stop loading" — genuinely async work that will need an effect
once there's a real backend to check against.

With no backend connected yet, that check can't happen at all, so the
honest fix isn't to keep the effect and silence the warning — it's to
recognize there's currently nothing to load: `loading` now initializes
directly to `false`, no effect, no unused setter. The return shape
(`{ user, loading }`) is unchanged, so nothing consuming this hook needs
to change when real token verification is added later — that's the point
at which the `useEffect` legitimately comes back, doing real async work
instead of immediately flipping a boolean.
