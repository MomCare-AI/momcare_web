# MomCare Web — Kickoff Prompt (Gemini / Antigravity)

Paste this whole file into Antigravity as the first message for this project. It is a companion to
`docs/BRIEF.md`, not a replacement — read both, in this order.

---

## 1. Read first, in this order

1. **`docs/BRIEF.md`** — the master spec. Stack, architecture rules, the full design system, all
   three portals in detail, security, performance budgets, accessibility, testing, and a 9-phase
   build order. This is the source of truth for _how_ to build.
2. **`AGENTS.md`** (this folder) — one correction to the brief that matters before you write a
   single line of auth code: **the brief says Firebase, the team actually built Supabase Auth**,
   and it's already working end-to-end in `backend/`. Read the addendum in that file before
   touching login, sessions, or middleware.
3. **This file** — the concrete, currently-true facts neither of the above has, because it
   describes a backend that already exists and is running right now, not one being designed.

## 2. Non-negotiable, repeated because it must never get diluted

This is clinical decision-support software for a maternal mortality problem, not a generic
dashboard. It never issues a diagnosis, never auto-prescribes, and never shows an AI risk
classification without the underlying vitals next to it. Every AI-extracted lab value is provisional
until a doctor signs off field by field — make that structurally impossible to skip, not just
discouraged. If a task would weaken that gate, the audit trail, or a safety bound, refuse it and say
why, per `BRIEF.md` section 11.

## 3. Scope boundary

Build **`web/` only**. Do not modify `backend/` or `mobile/`. If a screen needs data or an action
that has no backend endpoint yet, **do not invent one and do not fake a success response** — build
the UI to spec against a clearly-labeled local/mock state, leave a `// TODO: needs backend support —
<what's missing>` comment, and say so in your summary. A silently-fabricated endpoint is a bug that
looks like a feature.

## 4. The backend that exists right now — full contract

Base URL: `http://127.0.0.1:8000/api/v1`. Live interactive docs (more authoritative than this list
if they ever diverge): `http://127.0.0.1:8000/docs`. Generate your TypeScript types from
`http://127.0.0.1:8000/openapi.json` per `BRIEF.md` section 2 rule 5 — don't hand-write response
interfaces.

### Auth — Supabase Auth directly, not through FastAPI

Sign-in/sign-up goes straight to Supabase (`@supabase/supabase-js` / `@supabase/ssr`), never through
a FastAPI route.

- Local Supabase API URL: `http://127.0.0.1:54321`
- Local anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
  (fixed Supabase CLI local-dev value, not a secret — re-confirm with `supabase status` if it ever
  looks wrong)
- After a Supabase sign-up, call `POST /api/v1/auth/profile` with `Authorization: Bearer <supabase
access_token>` to create the MomCare profile:
  ```
  { "full_name": string, "role": "mother"|"doctor"|"ngo_coordinator"|"admin", "phone_number"?: string }
  ```
- `GET /api/v1/auth/me` (same Bearer token) returns the current profile.
- **No other endpoint below currently checks the Bearer token or enforces role.** That's real,
  not-yet-built hardening (`BRIEF.md` section 6), not an oversight to route around — call it out if
  you're building something that assumes row-level scoping exists server-side, because it doesn't
  yet.

### IoT / Vitals — `/api/v1/iot`

| Method | Path                                     | Notes                                                                                                                                                                                     |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/bands/{band_id}/pair`                  | body `{ "patient_id": uuid }` → `HealthBandOut`                                                                                                                                           |
| `GET`  | `/bands/{band_id}`                       | → `HealthBandOut`                                                                                                                                                                         |
| `POST` | `/vitals`                                | body `{ "patient_id": uuid, "readings": VitalReadingIn[] }` → `VitalReadingOut[]`. Accepts a batch on purpose — a band buffers offline and uploads several readings at once on reconnect. |
| `GET`  | `/patients/{patient_id}/vitals?limit=50` | → `VitalReadingOut[]`, newest first                                                                                                                                                       |
| `GET`  | `/patients/{patient_id}/vitals/latest`   | → `VitalReadingOut`                                                                                                                                                                       |

```ts
VitalReadingOut = {
  id: string; patient_id: string; band_id: string | null;
  systolic_bp: number | null; diastolic_bp: number | null; heart_rate: number | null;
  temperature: number | null; spo2: number | null;
  activity_level: string | null; sleep_quality: string | null;
  recorded_at: string; synced_at: string; // ISO datetimes
}
HealthBandOut = {
  id: string; serial_number: string; patient_id: string | null; ngo_id: string | null;
  status: "available"|"assigned"|"faulty"|"retired";
  battery_level: number | null;
  connectivity: "strong"|"weak"|"offline";
  last_sync_at: string | null; assigned_at: string | null;
}
```

Ingesting a reading that breaches a threshold fires an alert synchronously, same request — see below.
Current threshold defaults (hardcoded in `backend/app/core/config.py`, **not yet DB-backed or
editable** — the Admin Console's threshold screen in `BRIEF.md` 4.3 has no real endpoint to save to
yet): systolic BP ≥140, diastolic BP ≥90, heart rate ≥100 or ≤60, SpO2 ≤94, temperature ≥38.5.

### Alerts — `/api/v1/alerts`

| Method | Path                                   | Notes                                                                                                                                                        |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `?patient_id=&alert_status=&limit=100` | both filters optional → `AlertOut[]`, newest first                                                                                                           |
| `GET`  | `/{alert_id}`                          | → `AlertOut`                                                                                                                                                 |
| `POST` | `/{alert_id}/acknowledge`              | body `{ "user_id": uuid }`. 409 if already acknowledged by someone else — first responder wins, this is intentional (`BRIEF.md`'s acknowledgement tracking). |
| `POST` | `/{alert_id}/resolve`                  | body `{ "user_id": uuid }`. Resolution notes (required by `BRIEF.md` 4.1) are **not yet a field on this endpoint** — flag it.                                |

```ts
AlertOut = {
  id: string; patient_id: string; vital_reading_id: string | null;
  alert_type: string;            // e.g. "hypertensive_crisis", "tachycardia", "low_spo2", "hyperthermia"
  reading_summary: string;       // e.g. "BP 168/112"
  severity: "urgent"|"critical";
  status: "pending"|"acknowledged"|"resolved";
  channels_notified: string[];   // e.g. ["push","sms"] — currently just recorded, not actually sent (no SMS/push provider wired up)
  triggered_at: string;
  acknowledged_by_user_id: string | null; acknowledged_at: string | null;
  resolved_at: string | null;
}
```

### NGOs — `/api/v1/ngos`

| Method  | Path                         | Notes                                                                       |
| ------- | ---------------------------- | --------------------------------------------------------------------------- |
| `POST`  | ``                           | register — see `NGORegisterIn` below → `NGOOut`, starts `pending`           |
| `GET`   | `?ngo_status=&service_area=` | both optional → `NGOOut[]`                                                  |
| `GET`   | `/{ngo_id}`                  | → `NGOOut`                                                                  |
| `PATCH` | `/{ngo_id}/resources`        | partial update, any subset of the resource fields                           |
| `POST`  | `/{ngo_id}/review`           | body `{ "status": NGOStatus, "note"?: string }` — admin approve/reject flow |

```ts
NGOStatus = "pending"|"under_review"|"approved"|"rejected"
NGOOut = {
  id: string; coordinator_user_id: string | null;
  legal_name: string; registration_number: string;
  date_of_incorporation: string | null;   // date, not datetime
  service_area: string | null;
  available_ambulances: number; qualified_nurses: number; field_health_workers: number;
  registration_certificate_path: string | null; operational_license_path: string | null; // string columns only — no actual file storage wired up yet, see below
  status: NGOStatus;
}
NGORegisterIn = { legal_name: string; registration_number: string; date_of_incorporation?: string;
  service_area?: string; available_ambulances?: number; qualified_nurses?: number;
  field_health_workers?: number; coordinator_user_id?: string; }
```

Document upload for the onboarding wizard (`BRIEF.md` 4.2) has **no real storage backend yet** — the
path fields are plain strings with nothing behind them. Build the upload UI, but the actual
persisted-file part needs Supabase Storage wired up first; flag it rather than pretending it works.

### Not yet built at all — don't build UI that assumes these exist server-side

- Lab report upload / OCR / verification queue (`BRIEF.md` 4.1's Lab Verification phase)
- A real patient registration endpoint (patients currently only exist via the backend's seed script)
- Doctor registration/credentialing endpoint
- Appointments
- Threshold configuration endpoint (values are hardcoded, per above)
- AI risk classification engine
- WebSocket/SSE live fan-out (poll `GET .../vitals/latest` and `GET /alerts` instead, per `BRIEF.md`
  section 5's polling fallback)

## 5. Local dev environment

```bash
supabase start                                                    # from repo root, one-time per boot
cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
cd web && npm run dev
```

## 6. Real seed data to develop against — already live, not placeholders

- Demo mother: `fatima.malik@example.com` / `demo-password-123`, patient_id `d63b9af2-8eb4-479d-929c-f17819e058e7`
- Demo doctor: `ayesha.raza@example.com` / `demo-password-123`, doctor_id `9809a676-498c-4425-9708-3626efb44bb3`
- Health band `de07fdcf-b919-4f23-b495-1b99c6b1bd21`, paired to the demo patient, with real vitals
  history and several fired alerts already in the database (`backend/scripts/device_simulator.py`
  generated them — includes hypertensive-crisis-range spikes, so the alert feed has real data to
  render, not an empty state)
- To generate more: `cd backend && .venv/Scripts/python.exe scripts/device_simulator.py --patient-id d63b9af2-8eb4-479d-929c-f17819e058e7 --band-id de07fdcf-b919-4f23-b495-1b99c6b1bd21`

## 7. Design system

Follow `BRIEF.md` section 3 exactly — the deep pine/clay/marigold clinical palette, Bricolage
Grotesque + Inter + IBM Plex Mono, the Vitals Ribbon as the signature component. **Do not default to
a generic shadcn-blue admin dashboard.** This is the one thing the product is meant to be remembered
by — build the Vitals Ribbon early and build it well, per the brief's own instruction.

## 8. Where to actually start

Per `BRIEF.md` section 10 Phase 1, scoped concretely against what's real today:

1. Design tokens + the three route-group layout shells (`(doctor)`, `(ngo)`, `(admin)`) — empty
   pages are fine at this stage
2. Real Supabase auth: login page, session handling, `middleware.ts` role gate — test it against the
   two seeded accounts above, not a stub
3. Typed API client generated from the running backend's OpenAPI
4. Doctor Portal dashboard, wired to live data: the one seeded patient in the roster, the real fired
   alerts in the high-risk feed — not mock JSON

Get that fully working and demoable end to end before starting Lab Verification or the other two
portals. Small, reviewable, working slices — not everything at once.

## 9. What "done" actually means here

Per `BRIEF.md` section 12: a doctor logs in, sees her highest-risk patient at the top of the list
within 2 seconds, scrubs 24 hours of that patient's vitals, and every action is in an audit log an
admin can export. That is the bar — not "looks impressive in a screenshot." If a design choice trades
real functionality for visual polish, don't make it without flagging the trade-off.
