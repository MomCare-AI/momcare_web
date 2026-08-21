# MomCare — Frontend

A Next.js frontend for a maternal healthcare platform, serving three role-based
portals — **doctor**, **ngo**, and **admin** — from a single app. It's a pure
client for a separate **Django REST API** backend; there is no database or
server-owned data layer in this repo.

Auth is token-based and **connected to the real Django API**. Login returns a JWT
access token; the refresh token lives in an HttpOnly cookie and never passes
through JavaScript. Authenticated requests go through `src/core/api/authFetch.ts`,
which attaches the token and, on a 401, refreshes once and retries before giving
up — so an hour-old session recovers silently instead of dumping a clinician at
the login screen mid-task.

Registration is an **application**, not a sign-up: `/register` submits a hospital
for review and receives no token, and sign-in is refused until a platform admin
approves it. Clinical staff never self-register — a hospital admin invites them,
and they set their own password at `/invite/<token>`.

## Tech stack

| Purpose                      | Library                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework                    | [Next.js](https://nextjs.org) 16 (App Router)                                                                                                                |
| UI                           | [React](https://react.dev) 19                                                                                                                                |
| Language                     | TypeScript                                                                                                                                                   |
| Styling                      | [Tailwind CSS](https://tailwindcss.com) v4, `clsx` + `tailwind-merge` for conditional classes                                                                |
| HTTP client                  | [axios](https://axios-http.com) (see `core/api/api-client.ts`)                                                                                               |
| Server data fetching/caching | [TanStack Query](https://tanstack.com/query) (see `core/query/`)                                                                                             |
| Client-only global state     | _Not yet added_ — planned: [Zustand](https://zustand-demo.pmnd.rs), once a feature actually needs shared client state (see `docs/architecture-decisions.md`) |
| Testing                      | [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react)                                                                    |
| Linting / formatting         | ESLint, Prettier                                                                                                                                             |
| Pre-commit enforcement       | [Husky](https://typicode.github.io/husky) + [lint-staged](https://github.com/lint-staged/lint-staged)                                                        |

## Architecture at a glance

- `src/app/` — routing only, via Next.js App Router. `(auth)` and `(portal)`
  are route groups: `(portal)` further splits into `doctor/`, `ngo/`, and
  `admin/`, one mini-portal per role.
- `src/core/` — infrastructure aware of this specific app (auth, the shared
  API client, authorization, config, and `query/` — a shared TanStack Query
  client for fetching data from Django) but not tied to one clinical domain.
- `src/features/` — one folder per business domain (e.g. `dashboard`), each
  owning its own `components/`, `hooks/`, `services/`, and `types.ts`. This
  is where actual clinical/business logic lives — `app/` should never
  contain it directly.
- `src/shared/`, `src/hooks/`, `src/lib/` — code with zero awareness of this
  app at all; usable in any project unchanged.
- Server Actions live inside whichever feature owns the mutation (not a flat
  top-level folder), used selectively — see `docs/conventions.md`.

Full rules for where new code goes: **`docs/conventions.md`**.

## Prerequisites

- Node.js 20.9+ (minimum required by Next.js 16)
- npm

## Quick start

```bash
npm install                  # installs dependencies and wires up the pre-commit hook
cp .env.example .env.local   # then set NEXT_PUBLIC_API_URL to your Django backend
npm run dev                  # dev server at http://localhost:3000
```

## Environment

Configuration is read from `.env.local` (see `.env.example`). Only variable
currently required:

- `NEXT_PUBLIC_API_URL` — base URL of the Django REST API this app talks to
  (e.g. the staging backend during development).

## Testing

```bash
npm run test          # Vitest, watch mode
npx vitest run         # single run (non-interactive, used by the pre-commit hook)
```

Test files sit next to the code they test (`useAuth.ts` + `useAuth.test.ts`).
Write tests alongside the feature they cover, not after.

## Code quality

Enforced locally via a Husky pre-commit hook (`.husky/pre-commit`) — runs
automatically on every `git commit`, no separate command needed:

```bash
npx lint-staged        # Prettier on staged files
npm run typecheck      # next typegen + tsc --noEmit
npx vitest run          # full test suite
```

Run any of these manually at any time; `npm run lint` (ESLint) is also
available but not currently part of the commit gate.

## Project structure

```text
src/
  app/          routes only (App Router)
  core/         app-aware infrastructure — auth/, api/, authorization/,
                config/, guards/, notifications/, query/
  features/     business domains — dashboard (template), more as they're built
  shared/       zero-business-awareness UI (ui/, components/, widgets/,
                charts/, forms/)
  hooks/        generic cross-feature hooks
  lib/          plain utility functions
  types/        shared TypeScript types
  mockData/     static fixture data (not a fake server) for UI work ahead
                of real Django endpoints — see docs/conventions.md
  proxy.ts      runs before every request (Next.js 16's middleware equivalent)
docs/           architecture decisions, conventions, API Postman collection
public/         static assets + locales (en, ur)
```

Folders with no code yet still exist (as placeholders) — that's intentional,
not incomplete. See `docs/conventions.md` for why.

## Documentation

- [`docs/conventions.md`](docs/conventions.md) — where new code goes, and the
  rules behind this structure
- [`docs/architecture-decisions.md`](docs/architecture-decisions.md) —
  significant decisions and why they were made
- [`docs/postman_collection.json`](docs/postman_collection.json) — the
  contract with the Django backend team: real endpoints, shared and kept
  current by the backend team as they're staged
