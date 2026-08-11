# Project Conventions

Rules for where code goes and how it's built. This is documentation, not
enforcement — the pre-commit hook (see below) is what actually blocks bad
code from being committed; this file is what tells you the structural rules
nobody else can check for you automatically.

## The three tiers: `core/`, `features/`, `shared/`

Every piece of code answers one question: does it know about MomCare
specifically, or not? And if it does, is it infrastructure or a business
domain?

- **`core/`** — infrastructure that's aware of _this app_ (its roles, its
  auth flow, its API) but isn't tied to one clinical domain. Examples:
  `core/auth/`, `core/api/`, `core/authorization/`, `core/config/`,
  `core/guards/`, `core/notifications/`, `core/query/`.
- **`features/`** — one folder per real clinical/business domain (patients,
  appointments, dashboard, ...). Knows about MomCare _and_ about one
  specific thing MomCare manages.
- **`shared/`** — zero awareness of MomCare at all. A Button doesn't know
  what a Patient is. Could be copy-pasted into an unrelated project and
  still work.

If you're not sure which one something belongs in, ask: "does this need to
know MomCare has doctors, NGOs, and admins?" If no → `shared/`. If yes, but
it's not about one specific clinical thing → `core/`. If yes, and it's
about one specific clinical thing → `features/`.

## `core/` and `features/` folder shape

Both follow the same internal shape. `core/auth/` is the reference
implementation:

```text
core/auth/
  components/   UI used only by this concern
  hooks/        hooks used only by this concern (e.g. useAuth)
  services/     calls to the Django API for this concern (e.g. auth.ts)
  types.ts      TypeScript shapes for this concern's data (e.g. User)
```

`features/dashboard/` is the same shape, kept as an empty template so the
pattern is visible in the repo itself, not just described here.

When you start a new feature (e.g. `patients`) or a new core concern (e.g.
`notifications`), copy this shape. Don't create a `components/`, `hooks/`,
or `services/` folder until you actually have a file to put in it — an
empty folder is fine as a placeholder (tracked with `.gitkeep`), but don't
add fake/no-op files just to look finished.

## Fetching data: `useQuery`, not manual `useState`/`useEffect`

`core/query/queryClient.ts` sets up a shared TanStack Query client, wired
into the whole app via `core/query/QueryProvider.tsx` in the root layout.
Any feature's `hooks/` file that fetches data should use `useQuery`
against its `services/` function, instead of hand-rolling loading/error
state with `useState`/`useEffect`:

```ts
export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: patientsService.getAll,
  });
}
```

This is for **server data** (anything from Django — patients, appointments,
...). It is not for client-only state (is the sidebar open, who's
currently logged in) — that's what a store (see below) is for.

## `services/` vs `actions/`

- **Default: a `services/*.ts` file** calls Django directly from the
  client through `core/api/api-client.ts`. This is the normal path for
  reads and most writes.
- **`actions/` (Next.js Server Actions)** live _inside whichever feature
  owns the mutation_ (e.g. `features/patients/actions/patient.actions.ts`)
  — there is no flat top-level `actions/` folder. Only reach for a Server
  Action when you specifically need one of:
  - hiding something from the browser that shouldn't be public
  - avoiding a CORS round-trip
  - a form that should still work with JavaScript disabled

If none of those apply, don't reach for a Server Action by default — it
adds an extra network hop (browser → Next.js server → Django) that isn't
free.

## State: no flat `store/` folder

State colocates with whatever owns it, the same way `services/` and
`types.ts` do — e.g. `core/auth/auth.store.ts`, not a shared `store/`
folder mixing unrelated state together. Only create a store file once
something genuinely needs state shared across unrelated parts of the app;
local component state (`useState`) is the default until then.

## `shared/` internal tiers

`shared/` is split by how composed something is:

- **`shared/ui/`** — atoms: `Button`, `Input`, `Card`. No composition, no
  business meaning.
- **`shared/components/`** — molecules: combinations of atoms
  (`ActionMenu`, `SearchBar`, `ConfirmDialog`). Still generic.
- **`shared/widgets/`** — organisms: bigger compound blocks
  (`StatCard`, `DashboardGrid`). Still not tied to one clinical domain,
  but shaped for a specific kind of layout (e.g. dashboards).
- **`shared/charts/`**, **`shared/forms/`** — specialized generic building
  blocks (chart primitives, schema-validated form fields).

## `hooks/`, `lib/`, `types/` (top-level, outside `shared/`)

These stay as their own top-level folders, not nested inside `shared/`:

- **`src/hooks/`** — generic cross-feature hooks with no business
  awareness (e.g. `useDebounce`).
- **`src/lib/`** — plain utility functions, no React (e.g. `cn`, date
  formatting).
- **`src/types/`** — TypeScript shapes shared across more than one
  `core/`/`features/` concern. If a type is only used within one concern,
  it stays in that concern's own `types.ts` instead.

## Testing

- Every test file lives **next to** the code it tests: `useAuth.ts` +
  `useAuth.test.ts` in the same folder.
- Tests are written **alongside** the feature/functionality they cover, in
  the same piece of work — not added later, and not stubbed out in advance
  for code that doesn't exist yet.
- Test runner is Vitest + React Testing Library (`npm run test` for local
  watch mode).

## Empty folders are fine, fake code is not

A folder with nothing but a `.gitkeep` is a legitimate placeholder — it
shows where something will go. A file with fake logic (a component that
`return null`s, a function with no implementation) is not — it's dead code
that looks finished but isn't. If it's not built yet, the folder can exist;
the file should not.

## Import paths

Always import via the `@/` alias (`@/core/auth/...`, `@/core/api/api-client`,
`@/features/dashboard/...`), which maps to `src/`. Don't use deep relative
paths like `../../../core/auth`.

## `src/mockData/`

Static JSON fixtures — **data, not a fake server** — so UI work isn't
blocked waiting for the backend team to stage a real endpoint. Lives inside
`src/` (not the project root) specifically so it's reachable via the `@/`
alias like everything else: `@/mockData/users.json`.

**Do not build fake API routes** (e.g. `app/api/.../route.ts`) to simulate
a backend, even temporarily. Two reasons:

1. This repo has no server-owned data layer, on purpose — a live route
   that validates credentials and issues tokens is backend logic running
   on the Next.js server, which is exactly what we said this repo doesn't
   have.
2. It invites **contract drift**: if the frontend invents its own
   endpoint shape (URL, field names, status codes) without the backend
   team's input, there's a real chance the actual Django endpoint ends up
   different, and integration becomes a rewrite instead of a config swap.
   The real contract belongs in `docs/postman_collection.json`, defined
   by whoever owns the Django side — even before the endpoint is built —
   not guessed from the frontend.

Instead: a `services/*.ts` function reads the mock data directly (e.g.
`authService.login` checks `mockData/users.json` in plain JS) and returns
whatever shape the real endpoint is expected to return. When the real
endpoint exists, that function gets rewritten to call `api` instead — this
_is_ a real code change, not just a URL swap, and that's fine; pretending
otherwise is what got us into this in the first place.

## Pre-commit gate

Every commit runs `.husky/pre-commit` automatically, which:

1. Formats staged files with Prettier (`lint-staged`)
2. Runs `npm run typecheck` (fails the commit on any TypeScript error)
3. Runs `npx vitest run` (fails the commit on any failing test)

If a commit is blocked, fix the reported issue and commit again — don't
bypass the hook (`--no-verify`) to force a broken commit through.
