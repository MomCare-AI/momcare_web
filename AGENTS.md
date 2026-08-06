<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Before you build anything here

Read [`docs/BRIEF.md`](docs/BRIEF.md) first — it is the authoritative spec for this portal's stack, architecture, design system, and build order.

**One thing in that brief is out of date: it specifies Firebase Auth. The team switched to Supabase Auth instead** (Firebase is kept only for push notifications) — already built and working in `backend/`, not a proposal. Concretely:

- `backend/` verifies Supabase-issued JWTs against Supabase's JWKS endpoint (ES256, not a shared secret — an actual Supabase CLI version-specific detail, don't assume HS256 from older tutorials)
- Local dev runs the full stack via `supabase start` (from the repo root) — one Postgres for both `auth.users` and all app tables. Cloud Supabase is production-only.
- `public.users.id` is a real foreign key to `auth.users.id` (see `backend/app/models/user.py`)
- There is no FastAPI login/signup endpoint — Supabase Auth already is one. The one auth endpoint FastAPI owns is `POST /api/v1/auth/profile`, called once after a client signs up with Supabase, to say what role (mother/doctor/ngo_coordinator/admin) the identity has

Everywhere the brief's sections 1, 2, and 6 say "Firebase," read "Supabase Auth" instead — same architectural rules (BFF proxying, role checked in middleware + BFF + FastAPI, httpOnly session cookies), different provider. See `backend/README.md` for the working auth flow end to end.
