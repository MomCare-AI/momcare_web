# Contributing to MomCare Web

Read [`docs/BRIEF.md`](docs/BRIEF.md) and [`AGENTS.md`](AGENTS.md) first — they're the
authoritative spec for architecture and design decisions. This file is about _process_: how we
work together day to day, not what to build.

## Folder structure — where new code goes

This repo follows Next.js App Router convention: **code lives next to the route it belongs to**,
not in a separate `features/` tree.

- **`src/app/<portal>/`** — pages and their client components for one portal (`doctor/`, `ngo/`,
  `admin/`). If you're building a screen, this is almost always where it goes.
- **`src/app/api/`** — BFF route handlers. Anything the browser needs from the backend goes through
  here, never called directly from a client component (see `AGENTS.md` for why).
- **`src/components/ui/`** — generic, reusable UI primitives with no domain knowledge (`RiskBadge`,
  `EmptyState`, `StatCard`). If it could theoretically be used in any of the three portals, it
  belongs here.
- **`src/components/clinical/`** — components that know about MomCare's domain (patients, vitals,
  alerts) but are still reusable across portals (`VitalsRibbon`, `PatientSettingsForm`).
- **`src/lib/`** — non-UI code: the typed API client, Supabase clients, shared hooks, shared types.
- **`src/config/`** — startup-time configuration, currently just env var validation.

Rule of thumb: if it's one portal's screen, it goes in `app/`. If it's shared across portals but
still MomCare-specific, it goes in `components/clinical/`. If it has zero domain knowledge, it goes
in `components/ui/`.

## Git workflow

- **Never push directly to `main`** — branch protection blocks it anyway, but the habit matters.
- **Branch naming:** `feat/short-description`, `fix/short-description`, `chore/short-description`.
- **Keep PRs small and pull `main` often.** A branch that sits for a week accumulates a much worse
  merge conflict than one merged same-day. If a task is big, look for a way to split it.
- **Commit messages:** short, present-tense, describes the _why_ over the _what_ where it's not
  obvious. No enforced format (we deliberately skipped commitlint/Conventional Commits — not worth
  the friction for a team this size right now).
- **Formatting is automatic.** A pre-commit hook (Husky + lint-staged) runs Prettier and ESLint on
  whatever you've staged. You shouldn't need to think about formatting — if a commit fails, read
  what it printed, it's telling you exactly what's wrong.

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four run in CI on every PR anyway, but running them locally first means you're not waiting on a
CI cycle to find out something's broken.

## Regenerating the API types

`src/lib/api/schema.d.ts` is **generated**, not hand-written — it comes straight from the FastAPI
backend's live OpenAPI spec, so the frontend gets real type safety against what the backend actually
does. Whenever a backend endpoint changes or a new one's added:

```bash
npm run generate:types
```

(Needs the backend running locally at `127.0.0.1:8000` — see `backend/README.md`.) Commit the
regenerated file as part of the same PR that depends on the change, so the two never drift apart
silently.

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values. `src/config/env.ts` validates these at
startup with zod — if something's missing or malformed, you'll get a clear error immediately instead
of a confusing failure three layers deep.

## The one non-negotiable rule, regardless of anything else in this file

This is clinical decision-support software. It never issues a diagnosis, never auto-prescribes, and
never shows an AI-derived risk classification without the underlying vitals next to it. If a task
seems to ask for something that weakens that, stop and ask before building it — see `BRIEF.md`
section 0 and 11.
