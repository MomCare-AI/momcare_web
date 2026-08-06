# MomCare Web Platform — Master Build Prompt

Paste this into Cursor, Claude Code, or any agentic IDE as the project brief. Feed it once at the start, then reference sections by number as you build. Keep it in the repo as `docs/BRIEF.md` so the AI can re-read it in every session.

---

## 0. Role and mission

You are a senior healthcare product engineer building a clinical-grade web platform. You have shipped HIPAA and GDPR aligned systems, you know that a mis-rendered vital sign is a patient safety event, and you design for clinicians who work at speed on poor hardware and poor networks.

Build **MomCare Web**, the web tier of an AI and IoT maternal health monitoring system for Pakistan. It serves three distinct user types through one codebase:

1. **Doctor Clinical Portal** — real-time patient oversight, lab verification, care instructions, appointments, alert history
2. **NGO Coordination Portal** — regional risk map, patient management, health band inventory, emergency coordination, NGO self-onboarding
3. **Super Admin Console** — user governance, alert threshold configuration, system health, platform analytics

The mobile app for mothers is Flutter and is out of scope. You consume the same backend.

**Non-negotiable clinical framing:** this platform is _decision support_. It never issues a diagnosis, never auto-prescribes, and never presents an AI risk classification without showing the underlying vitals and the model confidence. Every AI-extracted lab value enters the record only after a licensed doctor verifies it. Build the UI so that the human sign-off is structurally impossible to skip.

**Non-negotiable safety disclaimer:** anywhere a mother is enrolled or consents to monitoring — whether that happens in this web tier (e.g. an NGO field worker registering a patient who has no smartphone) or in the mobile app — the flow must include an explicit, unskippable acknowledgment that MomCare is _not_ an emergency service and is _not_ monitored 24/7 in real time, and that a suspected emergency means calling local emergency services (e.g. Rescue 1122) or going to the nearest hospital immediately, not waiting on an app alert. This is a liability and patient-safety requirement, not boilerplate — do not bury it in a terms-of-service link.

---

## 1. Stack (fixed)

**Frontend**

- Next.js 15+, App Router, TypeScript strict mode
- Tailwind CSS v4 with `@theme inline {}` in `globals.css` for tokens. Do not create `tailwind.config.js`
- shadcn/ui as the component base, restyled to the token system in section 3. Do not ship default shadcn look
- TanStack Query v5 for server state, Zustand for ephemeral UI state only
- TanStack Table + TanStack Virtual for all clinical tables
- Recharts for vitals charts, with custom render for the vitals ribbon
- React Hook Form + Zod for every form. One Zod schema shared between client validation and API type inference
- next-intl for English and Urdu with full RTL

**Backend (contract you code against)**

- FastAPI (Python), PostgreSQL, SQLAlchemy + Alembic
- Firebase Auth for identity, custom claims for role
- Redis for caching, rate limiting, and alert dedup
- WebSocket or SSE for live vitals fan-out, MQTT ingest upstream from the bands
- S3-compatible object storage for lab report images, private bucket, signed URLs only

**Infra**

- Vercel or Railway for Next.js, Railway or Fly.io for FastAPI, managed Postgres with PITR
- GitHub Actions CI: typecheck, lint, unit, e2e, build, then deploy

---

## 2. Architecture rules

1. **Server Components by default.** `"use client"` only for interactivity. Never fetch PHI in a client component with an exposed token.
2. **The Next.js server is a BFF.** The browser never calls FastAPI directly. Route Handlers in Next.js proxy to FastAPI with a server-held service token plus the user's verified Firebase ID token. This keeps the API surface small and lets you enforce role checks twice.
3. **Three route groups, one app:**
   ```
   app/
     (auth)/login, /forgot-password
     (doctor)/dashboard, /patients, /patients/[id], /lab-verification, /schedules, /alerts
     (ngo)/dashboard, /patients, /bands, /emergency, /onboarding
     (admin)/dashboard, /users, /thresholds, /monitoring, /audit
     api/                 <- BFF route handlers
   ```
   Each group has its own `layout.tsx` and its own middleware-enforced role gate.
4. **Middleware gate.** `middleware.ts` verifies the session cookie and the role claim before any route in a group renders. Unauthorized redirects to `/login`, wrong-role returns 403 and is written to the audit log.
5. **One typed API client.** Generate TypeScript types from the FastAPI OpenAPI schema (`openapi-typescript`). No hand-written response interfaces, no `any`.
6. **Optimistic UI is banned for clinical writes.** Threshold changes, lab verification, and alert resolution show a real pending state and confirm only on server acknowledgement. Optimistic updates are fine for filters, sorting, and read receipts.

---

## 3. Design system

Do not produce a generic hospital dashboard. Build a distinct, calm, data-dense clinical interface. Align with the deep green of the existing mobile mockups so mothers, doctors, and coordinators feel one product.

### Color tokens

```css
@theme inline {
  --color-ink: #0b1f1c; /* primary text */
  --color-ink-muted: #5a6b67; /* secondary text */
  --color-surface: #fbfcfb; /* app background */
  --color-panel: #ffffff; /* cards */
  --color-line: #e3eae7; /* hairlines, 1px */
  --color-pine: #0d4f45; /* primary brand, headers, primary buttons */
  --color-pine-deep: #08332c; /* hover, dark surfaces */
  --color-pine-wash: #edf5f2; /* selected rows, subtle fills */
  --color-marigold: #e0a32e; /* accent, medium risk, pending states */
  --color-clay: #b3261e; /* high risk, critical, destructive */
  --color-sage: #1f8a70; /* low risk, resolved, healthy */
  --color-slate: #64748b; /* routine, informational */
}
```

Risk color is never the only signal. Every risk state carries **color + text label + shape/icon**. A colorblind clinician at 2am must not be able to misread a triage list.

### Typography

- **Display:** `Bricolage Grotesque` for page titles and stat numerals only, weights 600/700, tight tracking
- **Body/UI:** `Inter` variable, 400/500/600
- **Data:** `IBM Plex Mono` for all vital values, IDs, timestamps, and lab numbers, with `font-variant-numeric: tabular-nums` so digits never jitter as values stream
- **Urdu:** `Noto Naskh Arabic` for UI, `Noto Nastaliq Urdu` for headings only. Nastaliq at UI sizes destroys legibility, so keep it for display type
- Scale: 12 / 14 / 16 / 20 / 26 / 34 / 46. No sizes outside the scale
- Minimum body size 14px, minimum touch/click target 40px

### Layout

- 8px spacing base. Density is a feature: clinical tables use 44px rows, not 64px
- Persistent left rail (240px, collapsible to 64px icon rail), sticky top bar with global patient search and alert bell
- Cards use 1px `--color-line` borders and radius 10px. Shadows only on floating layers (dropdowns, dialogs, toasts), never on static cards
- Max content width 1600px, comfortable at 1366px, functional at 1024px, read-only responsive down to 768px for tablets on ward rounds

### Signature element: the Vitals Ribbon

The one thing this product is remembered by, and the visual answer to the "Snapshot Gap" problem statement.

A horizontal strip pinned under the patient header on every patient view. It renders the trailing 24 hours as four stacked micro-sparklines (BP, HR, SpO2, temperature) on a shared time axis. Safe ranges are shaded in `--color-pine-wash`, excursions render as filled `--color-clay` or `--color-marigold` wedges, and clinical events (lab uploaded, alert fired, doctor instruction sent) drop as small markers on the axis. Hover scrubs a synchronized crosshair across all four lanes with exact values and timestamp. Clicking a time range zooms the full chart below.

The message: no gaps. Build this component first and build it well.

### Motion

Restrained. 150ms ease-out for state changes, 250ms for panel transitions. Live vital updates cross-fade the number, never slide or bounce. Full `prefers-reduced-motion` support. No decorative animation anywhere in a clinical context.

### Copy rules

Active voice. Buttons name the exact action and the resulting toast reuses the same word: "Verify report" produces "Report verified". Errors state what happened and the next step, never apologize, never say "something went wrong". Empty states tell the user what to do next. Never expose system vocabulary to users: coordinators manage "health bands", not "IoT device registry entries".

---

## 4. Portal specifications

### 4.1 Doctor Clinical Portal

**Dashboard**

- KPI row: total patients, high-risk count, pending lab verifications, today's appointments. Each is a link, not decoration
- High-risk alert feed, newest first, with patient name, triggering vital, time elapsed, and a one-click "Open patient" action
- Patient roster with filter chips (All / High / Medium / Low), sorted so high risk is always at the top regardless of user sort. Columns: name, gestational week, risk level, last reading, last active, band connectivity
- Today's schedule column with next appointment highlighted
- AI insight panel: population-level observation with the reasoning shown and a link to the cohort it describes. Never a bare assertion

**Patient detail (`/patients/[id]`)**

- Header: name, age, gestational week and days, EDD, assigned NGO, band status, risk badge with model confidence
- The Vitals Ribbon, then tabs: Vitals, Lab Reports, Risk History, Care Plans, Notes
- Vitals tab: time range selector (24h / 7d / 30d / all), synchronized multi-metric charts, quick stats (blood type, weight, BMI)
- Risk History tab: a timeline showing every reclassification, what triggered it (which vitals or which lab), and what the system did in response. This is the model's audit trail and it is mandatory
- "Send instruction to patient" opens a composer with templates, pushes to the Flutter app, and logs delivery and read receipt

**Lab verification queue (`/lab-verification`)**

- Split view: source document (zoom, rotate, pan) on the left, extracted fields on the right
- Every extracted field shows the OCR confidence. Fields below the confidence threshold are pre-flagged, highlighted, and cannot be submitted until explicitly touched by the doctor
- Each field has an unchecked "Verified" checkbox. The submit button stays disabled until all fields are verified. Out-of-range values are flagged against reference ranges
- "Flag issue" path for unreadable reports, which notifies the mother to re-upload with guidance on what went wrong
- Nothing enters the patient record without this signature. Log the verifying doctor, timestamp, and every field the doctor changed from the AI value

**Schedules** — month and list view, availability slot management, patient bookings with confirmed/pending states, no-show marking that fires the NGO notification

**Alert history** — full log, filters by type, date range, status, response time metrics, resolution notes required on close

### 4.2 NGO Coordination Portal

**Dashboard** — zone-level totals, high-risk count, active band connectivity percentage, open emergencies

**Patient management** — patients within the NGO's assigned geographic zones only, hard-scoped at the database query level. Filters by risk, zone, band status, assigned doctor

**Health band management** — inventory table (band ID, assigned patient, assignment date, battery, connectivity, device health), assign and reclaim flows, faulty device reporting, subsidy tier tracking, grant balance, low-battery and offline-device alerts

**Emergency coordination** — live alert feed, map view of active emergencies, response actions (dispatch ambulance, assign field health worker, contact doctor), and an append-only response log with timestamps. Mark the map view clearly as a later phase if it is deferred

**NGO onboarding** — 3-step wizard: organization details (legal name, registration number, incorporation date), service area and resources (region, ambulances, nurses, field workers), document upload (registration certificate, operational license). Save draft at each step, submit for admin approval, show submitted → under review → approved status

### 4.3 Super Admin Console

**Dashboard** — platform totals, growth chart, service health cards (API, OCR engine, Firebase, SMS gateway, MQTT broker) with uptime, recent activity log

**User management** — tabs for patients, doctors, NGOs. Approve, suspend, reactivate, audit. Doctor approval requires license verification with the uploaded credential visible in the approval dialog

**Alert threshold configuration** — this is the most dangerous screen in the product. Treat it accordingly:

- Editable thresholds for systolic BP, diastolic BP, SpO2, heart rate, temperature, and fetal heart rate high/low
- Every field shows the current value, the clinical default, the source guideline (WHO or ACOG), and last modified by whom and when
- Changes require a confirmation dialog that states in plain words how many patients the change affects and in which direction
- Hard-coded absolute safety bounds that the admin cannot exceed in either direction. Reject the save server-side, not just in the UI
- Full configuration history sidebar and a one-click "Reset to clinical defaults"

**System monitoring** — service uptime, response time chart, error log with severity, refresh action

**Audit log** — immutable, append-only, filterable, exportable. Every PHI read, every threshold change, every lab verification, every role change, every failed authorization

---

## 5. Real-time vitals

- FastAPI ingests from MQTT, writes to Postgres (consider TimescaleDB or a partitioned hypertable pattern for the vitals table), and fans out over WebSocket
- Frontend subscribes per patient on the detail view and per cohort on dashboards. Exponential backoff reconnect, and a visible connection state chip: Live / Reconnecting / Stale
- **Never render a stale reading as current.** If the last packet is older than the freshness window, grey the value, show relative age ("last sync 14 min ago"), and suppress it from live risk display
- Batch DOM updates to at most 1Hz. Ingest can be faster, rendering does not need to be
- The band buffers offline and batch-uploads on reconnect. Handle out-of-order and backfilled timestamps correctly, and mark backfilled points visually distinct on charts

---

## 6. Security requirements

This is health data. Build to a standard you could defend in an audit.

**Authentication and authorization**

- Firebase Auth, ID token verified server-side on every request, never trusted from the client
- Role and scope in custom claims, checked in middleware, again in the BFF handler, and again in FastAPI. Three layers, no exceptions
- Session cookies: `httpOnly`, `secure`, `sameSite=strict`, short expiry with silent refresh
- Mandatory 2FA (TOTP or SMS) for doctor and admin roles
- Row-level scoping: doctors see only assigned patients, NGOs see only their zones, enforced in the SQL query, never by filtering in the client

**Data protection**

- TLS 1.3 in transit, AES-256 at rest, encrypted database backups
- Lab report images in a private bucket, accessed only via short-lived signed URLs, never a public path
- **No PHI in URLs, query strings, logs, error messages, or analytics events.** Use opaque UUIDs for patient IDs, never national ID or phone numbers in a route
- Scrub PHI from Sentry and all telemetry with a `beforeSend` filter
- Field-level encryption for national ID and phone number
- Data retention and deletion policy implemented, not just documented

**Application hardening**

- Strict CSP with nonces, plus HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
- Zod validation on every input at the boundary, parameterized queries only
- Rate limiting per IP and per user, aggressive on auth endpoints, with account lockout and a notification email on repeated failures
- File uploads: validate magic bytes not extension, cap size, virus scan, strip EXIF, re-encode images
- CSRF tokens on all mutations, idempotency keys on alert and appointment writes
- Dependency scanning in CI (`npm audit`, Dependabot, `pip-audit`)
- Auto-logout after inactivity with a warning countdown, and a screen-blur privacy mode for shared ward terminals

---

## 7. Performance targets

Hard budgets. Fail the CI build if they regress.

| Metric               | Target              |
| -------------------- | ------------------- |
| LCP                  | under 2.0s on 4G    |
| INP                  | under 200ms         |
| CLS                  | under 0.05          |
| Initial JS per route | under 180KB gzipped |
| Patient detail TTI   | under 2.5s          |
| API p95              | under 300ms         |

Techniques: RSC and streaming with meaningful Suspense boundaries, route-level code splitting, `next/font` self-hosting with subsetting for both Latin and Arabic ranges, `next/image` with AVIF and WebP, virtualized tables beyond 50 rows, cursor pagination not offset, TanStack Query with `staleTime` tuned per data type (thresholds cache long, vitals do not cache), Redis caching of aggregates, database indexes on every filter and sort column, and skeleton states that match final layout so nothing shifts.

Also: this runs in Pakistan on variable connections. Test on throttled 3G. Ship a service worker that keeps the shell and the last viewed patient roster available read-only when the network drops, with an unmissable offline banner.

---

## 8. Accessibility and localization

- WCAG 2.2 AA minimum. Contrast 4.5:1 for text, 3:1 for UI components and chart strokes
- Full keyboard operation with a visible focus ring, logical tab order, skip links, and a command palette (Cmd+K) for patient search
- Semantic HTML, correct ARIA, `aria-live="assertive"` for critical alerts and `polite` for routine updates
- Every chart has a screen-reader accessible data table equivalent
- Full English and Urdu with RTL: use CSS logical properties (`margin-inline-start`, not `margin-left`) throughout so RTL is a one-line direction flip, not a rewrite
- Urdu is not an afterthought translation. Get medical terminology reviewed by a clinician who speaks it. Numbers, dates, and units follow locale conventions

---

## 9. Testing and quality

- Vitest + React Testing Library for components, with mandatory coverage on risk badge rendering, threshold validation, and lab verification gating
- Playwright e2e for the critical paths: doctor login → high-risk patient → review vitals → send instruction; lab verification end to end; threshold change with confirmation; NGO onboarding submission; alert fires → acknowledged → resolved
- MSW for API mocking
- Axe accessibility assertions in CI
- Lighthouse CI with the budgets from section 7 as failing thresholds
- Seed script generating 500 synthetic patients with realistic vitals distributions, including edge cases: missing data, sensor spikes, offline gaps, out-of-order backfill
- Never use real patient data in any non-production environment

---

## 10. Build order

Ship in vertical slices. Each phase must be deployable and demo-able.

1. **Foundation** — Next.js scaffold, token system, layout shells, auth with role routing, typed API client, seed data
2. **Design system** — restyled shadcn primitives, the Vitals Ribbon component, table system, chart system, empty and error and loading states
3. **Doctor portal** — dashboard, patient roster, patient detail, vitals streaming
4. **Lab verification** — the queue, the split view, the mandatory sign-off flow
5. **Alerts** — real-time delivery, acknowledgement, escalation, history
6. **NGO portal** — dashboard, zone-scoped patients, band inventory, onboarding wizard
7. **Admin console** — user governance, thresholds with safety bounds, monitoring, audit log
8. **Urdu and RTL** — full localization pass across all three portals
9. **Hardening** — security headers, pen-test pass, performance budgets, load testing, accessibility audit

---

## 11. Working rules for the AI agent

- Ask before inventing a clinical rule. If a threshold, reference range, or escalation policy is not specified here, stop and ask rather than guessing. Wrong numbers in a maternal health system are not a cosmetic bug
- Propose the data model before writing endpoints. Get the schema reviewed first
- One feature per commit, conventional commit messages
- Every new component gets a Storybook entry or an equivalent isolated demo route
- Explain trade-offs when you make an architectural choice, in two sentences, in the PR description
- If asked to add something that weakens the doctor-verification gate, the audit trail, or the threshold safety bounds, refuse and explain why
- Write the README as you go, not at the end

---

## 12. Definition of done for the web tier

A doctor can log in on a 3G connection, see her highest-risk patient at the top of the list within 2 seconds, scrub the last 24 hours of that patient's vitals, verify a lab report field by field, send a care instruction that reaches the mother's phone, and switch the entire interface to Urdu, and every one of those actions is recorded in an immutable audit log that an administrator can export.
