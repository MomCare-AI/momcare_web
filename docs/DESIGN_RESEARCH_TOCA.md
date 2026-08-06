# Design research — TOCA Health reference review

Notes from walking through TOCA Health (dev.tocahealth.com), a comparable RPM/CCM telehealth
platform, screen by screen. TOCA is a US Medicare billing-heavy cardiology/chronic-care platform —
a lot of what it does is solving a problem MomCare doesn't have (insurance reimbursement codes,
monitoring-minutes compliance). This doc separates what's worth adopting from what isn't, so it
doesn't get re-litigated from scratch when we actually start building each phase.

Read alongside `BRIEF.md` (still the authoritative spec) — this is supplementary research, not a
replacement.

---

## Login / auth screens

**Direction agreed:** split-screen layout, brand story on one side, floating auth card on the
other — same mechanic as TOCA, not the same palette or imagery.

- Central visual: **mother + child silhouette (pregnancy, not post-birth embrace)** — minimal
  single-stroke line art, not a literal/detailed illustration. Keeps it universal across the
  mothers MomCare serves rather than depicting one specific look.
- A heartbeat/pulse line integrated into the illustration (ties to vitals monitoring, natural spot
  for real animation — a soft pulse, not frantic)
- Thin lines radiating from the central figure to icon nodes representing platform modules: vitals,
  alerts, lab verification, doctor consultation, NGO coordination, the health band
- **Same image across all three portals** (Doctor/NGO/Admin) — only the headline copy rotates per
  role, e.g. "Built for doctors — track high-risk pregnancies in real time" / "Built for NGOs —
  coordinate care across your service area" / "Built for admins — full system oversight"
- Stays in **our** palette (`BRIEF.md` section 3) — dark pine (`--color-pine-deep`) hero panel, not
  TOCA's navy/teal
- Borrowed form details: icon-prefixed inputs, password visibility toggle, "keep me signed in,"
  security/trust badge in the footer (ours: reference Pakistan's data protection framework or just
  "Encrypted and secure," not "HIPAA-compliant" — doesn't apply here), Google sign-in via Supabase

---

## Dashboard / patient roster

**Adopt:**

- Filter chips with embedded counts + info tooltips — `All Patients | High Risk | Pending Alerts |
Lab Verification Needed`, each chip clickable and self-explanatory via a tooltip on hover
- Prominent **"last reading X days ago"** / data-freshness indicator on the roster — real clinical
  signal for us given the connectivity-gap problem the scope doc calls out (a band gone silent for
  days is itself worth a doctor's attention, not just an abnormal reading)
- A contextual completion/progress indicator tied to whichever filter is currently active (TOCA
  shows "0% Reading Reminder Completed" only when that chip is selected) — nice detail, avoids
  cluttering the default view

**Avoid:**

- Showing the same count twice — TOCA's stat card ("Active Patients: 33") duplicates the filter
  chip ("All Patients (33)") right below it. Pick one place.
- RPM/CCM program badges and the `Time (hr:mm:ss)` billing-minutes column — Medicare
  reimbursement-specific, meaningless here

**Our roster columns, informed by this but simpler:** `Name | Risk badge (our pine/marigold/clay
system) | Latest vitals summary | Last reading (X ago) | Band status | Action`

---

## Patient detail page

**Adopt:**

- **Prev/next patient navigation** with position indicator ("Patient 1/33") — lets a doctor page
  through their roster sequentially without returning to the list. Cheap to build, real workflow
  value for systematic rounds.
- **AI-generated clinical summary paragraph** — TOCA's cites exact numbers and dates inline ("last
  BP reading was 180/145 mmHg... recorded on 2026-07-16"), which is the right pattern: never let the
  AI's interpretation stand without the source data next to it. What TOCA's version is missing (as
  far as the screenshot shows): **an explicit "AI-generated" label**. Ours must always carry one —
  ties directly to the non-negotiable clinical-framing rule already in `BRIEF.md` section 0.
- Sub-tab structure for organizing a patient's info (`Details | Settings | Devices | Documents |
...`) — ours: something like `Overview | Vitals History | Lab Reports | Alerts History | Assigned
Band`
- The `—` vs `0` convention: "not applicable" (e.g. a program the patient isn't enrolled in) should
  visually differ from "applicable but currently zero"
- **Save + Deactivate** (not Delete) as the bottom actions — soft-deactivation is the right instinct
  for clinical records; nothing patient-related should be hard-deleted

**Avoid:**

- Live billing-minutes timer ("00:20 RPM" + pause button) and the RPM/CCM/RTM/PCM time-tracking bar
  — 100% US billing infrastructure
- "Sticky Notes can go here" — literal leftover placeholder text in what looks like a live/staging
  build. Not a feature to copy; a reminder to QA our own screens for exactly this before calling
  anything done.

---

## Patient settings (the big accordion form)

- **Section "Patient" (basic info):** TOCA lets the _provider_ set a patient's login
  username/password directly. **Does not apply to us** — mothers self-register via the mobile app
  through Supabase Auth; a doctor never creates or sets a mother's password. Worth remembering this
  explicitly so nobody copies that sub-pattern by default into our patient-management screen.
- **Section "Additional" (demographics + care team):** address fields matter _more_ for us than for
  TOCA — MomCare's NGO Portal has real ambulance/emergency dispatch as a core feature (`BRIEF.md`
  4.2), so a patient's physical location is load-bearing, not incidental. Provider/Secondary
  Provider/Nurse assignment maps loosely to assigning a doctor + NGO coordinator per patient.
  **Skip:** ICD-10 "CCM/RPM Diagnosis Codes" — insurance coding, not relevant.
- **Section "Data bounds" (per-patient vital thresholds) — the single most important finding of this
  whole review.** TOCA lets each patient have individually tuned Low/High ranges for
  glucose/BP/heart rate/weight, confirmed with two different patients having genuinely different
  numbers (90–120 systolic vs. 95–170 systolic). `BRIEF.md`'s current plan only has **global**
  threshold configuration in the Admin Console; the backend's thresholds are hardcoded system-wide.
  **Recommendation, not yet decided:** admin sets safe outer bounds (a floor/ceiling a doctor can't
  loosen past), doctors can narrow within that range per patient. Keeps the safety-critical logic
  centralized while allowing real clinical judgment — pre-eclampsia risk genuinely varies by patient
  history and gestational stage. **This needs an explicit decision before the Admin Console phase is
  scoped**, since it changes the threshold data model (per-patient overrides, not just global config)
  and possibly the alerts API.
- **Section "Statuses":** configurable workflow tags (`off-track`, `not-called`), separate from
  clinical risk. Not core, possibly useful later for NGO field-coordination tagging ("needs home
  visit," "awaiting lab results"). Not a v1 priority.
- **Section "Notes":** adopt directly — Note Type + Description + Actions, "+ Add Note." Ours should
  additionally show **who wrote it and when**, for the audit-trail requirement already in
  `BRIEF.md`.

---

## Devices tab

TOCA's `Serial/IMEI | Type | Assigned At | Last Signal Strength | Status | HWI Id | Unlink Device`
columns line up almost exactly with fields already in our `HealthBandOut` schema (`serial_number`,
`assigned_at`, `connectivity`, `BandStatus`) — built independently, before this review. Good
confirmation the schema was on the right track.

- **Skip:** the "Orders" sub-section (per-patient device procurement/shipping). MomCare solves
  device distribution differently — NGOs hand bands out physically, which is why "Band Inventory"
  already has its own home in the **NGO Portal**, not the Doctor Portal's patient page.
- **Open question, not yet decided:** who gets an "assign/unlink device" action? Leaning toward: the
  Doctor Portal shows the band **read-only** (serial, status, last signal, last sync) with maybe an
  emergency-unlink action for troubleshooting, since the actual pairing flow lives with
  NGO-hands-mother-the-band → mother's-phone-does-BLE-pairing, not a doctor-initiated assignment.
- Their device catalog step (`Device Type: Cellular`, a specific branded SKU, IMEI) reveals TOCA's
  hardware has its **own cellular connection**, reporting directly without routing through a
  patient's phone — a real, different architecture from our BLE-to-phone design. Confirms our
  approach is a deliberate cost/context tradeoff (avoiding per-device recurring cellular cost), not
  an oversight.

---

## Patient documents / export

- **Adopt (add to backlog, not urgent):** date-range vitals export ("select a range, download a
  report of all readings in that window") — real clinical workflow, e.g. exporting a BP trend for a
  hospital referral. Nothing like this currently exists in `BRIEF.md`.
- **Naming collision to avoid:** TOCA's "Audit Report" is a _monthly patient activity summary_ for
  billing-compliance paperwork — **not the same thing** as `BRIEF.md`'s planned Admin Console "Audit
  log," which is a security/access-tracking feature. Don't let the shared word cause the two to get
  conflated when either gets scoped.
- **Flag before adopting:** any "Share" action on a report needs real access-control and
  audit-logging design before it ships — this is maternal-health PHI, not a casual one-click send.

---

## Instructional videos — the other standout finding

A curated library of short videos a doctor can select and push directly to a specific patient.
**More valuable for MomCare than it is for TOCA** — the scope doc's whole framing is about closing
an information/access gap for underserved mothers, and this feature already has a home waiting for
it: `mobile/README.md` lists **"Care Plan"** as a built-but-empty placeholder tab. This gives that
placeholder real shape — doctor-curated, patient-specific education content (in Urdu, addressing
things like "how to use your health band" or pre-eclampsia warning signs), not just a generic feed.

Two shapes worth deciding between later: a push model (doctor selects, sends to one mother) vs. a
self-serve library (mother browses "Care Plan" herself) — realistically probably both. Worth
carrying the same illustration style as the login page's mother/child artwork into this content too,
for visual consistency across the product.

---

## Add-patient / onboarding flow

- **The mandatory safety disclaimer finding — already added directly to `BRIEF.md` section 0**, not
  just noted here, since it's a safety requirement, not a design preference. See that file for the
  actual wording.
- Per-patient threshold defaults are set **at creation time**, with sensible pre-filled numbers —
  confirms section "Data bounds" above happens during onboarding, not as a separate later step.
- Emergency contact capture ("Add Contact") is worth having — relevant for an NGO's response
  workflow, not just a nice-to-have.
- **Skip:** Medical Record Number, RPM/CCM program enrollment toggles, ICD-10 diagnosis search — all
  either US-billing-specific or tied to a chronic-disease model that doesn't match pregnancy
  monitoring.

---

## Billing module — full skip, no adaptable parts

`Billed This Month / Total Billable`, a claims lifecycle (`Billable → Billed → Paid → Denied →
Appealed`), `CCM Billing`/`RPM Billing` tabs, ICD-10 codes, CCM disenrollment tracking. This is US
Medicare/insurance reimbursement infrastructure end to end — nothing here has a MomCare analog,
since Pakistan doesn't have this billing model and MomCare isn't charging per monitored minute.
Skip the entire module, not just trim it.

One naming note: its `Consent` column tracks consent **as a billing-compliance requirement**
(Medicare requires documented consent before CCM can be billed) — a different purpose from the
safety-disclaimer consent already added to `BRIEF.md` section 0. Same word, unrelated concepts;
don't conflate them.

---

## Device Orders (top-level nav module) — same skip, one useful nuance

The portal-wide version of the per-patient "Orders" tab already flagged above: individual RPM
hardware (BPM cuffs, watches, glucometers, thermometers) courier-dropshipped straight to each
patient's home address, tracked like an e-commerce order (`Dropship Requested → Pending →
Delivered`). Confirmed skip, same reasoning — NGOs distribute bands physically, not via courier.

One nuance worth keeping: this screen also has a `Bulk` tab (ship a batch to a facility) alongside
`Dropshipped` (ship one device to one home). If Band Inventory's logistics side ever gets built out,
model it closer to **bulk-to-NGO** than **dropship-to-mother** — matches how distribution actually
works here, and preserves the NGO field worker's in-person help with first-time device setup and BLE
pairing, which courier delivery would lose.

---

## Account Insights (staff performance analytics) — mostly skip, two ideas worth reframing

Almost the entire module is call-center productivity tracking downstream of CCM's billable-minutes
requirement (`Avg Time 2-Way`, `Voicemails/Day`, `Call Success Rate`, `Monitoring Time Distribution`
by minutes captured). Skip essentially all of it — no MomCare analog.

**Two ideas worth keeping, reframed away from billing/productivity toward safety:**

- `Out of Range: Avg time on out of range` → for us: **average time a critical alert sits
  unacknowledged**, or average time a patient stays in a high-risk state before a doctor intervenes.
  A real clinical-quality signal, not a productivity metric — worth considering for the Admin
  Console's system-health view.
- The general "staff audit report" concept → reframed as **alert responsiveness per doctor**: whose
  alert queue is backing up, who's slow to acknowledge. Operational visibility for an admin to catch
  an overloaded or unresponsive doctor, not to measure "performance" the way TOCA does.

**Worth stealing regardless:** the empty-state pattern on the compliance ring charts — "No data
available for this period, patient activity will appear here once recorded" instead of a blank or
broken-looking 0. Good general pattern for our own dashboards early on, when real data is thin.

**Another QA catch:** `Welcome Back Siam Hassan ___` has a blank placeholder, same pattern as
"Sticky Notes can go here" flagged earlier. Two instances of unfinished placeholder text shipping to
what looks like a live/staging build — worth remembering as a QA lesson before calling our own
screens done.

---

## Admin module — maps directly to our (unbuilt) Admin Console, several real findings

- **Staff caseload limits — worth adding to `BRIEF.md` 4.3's user governance, framed around safety
  not productivity.** TOCA caps each care manager's patient count (`Max Patient Limit: 25`,
  `Assigned Patients: 0-2`). For us: a doctor carrying more high-risk pregnancies than they can
  actually track is a real clinical risk, not just an ops inefficiency — connects directly to the
  "alert responsiveness" idea from the Account Insights review. Recommend adding caseload
  limit + live assigned-count to Admin Console's user governance feature.
- **Org-level KPI overview** (Total Locations/Patients/Active/Inactive, each with an info tooltip) —
  reasonable pattern for the Admin dashboard's top-level view.
- **Threshold configuration appears at a third level here** ("Configure Data Bounds" at org/location
  level, on top of the per-patient override already found on the patient settings page) — reinforces
  that per-patient thresholds are a real, commonly-modeled need, but we likely only need **two**
  tiers for MomCare (admin global default, doctor per-patient override within it), not three.
- **A persistent "Inventory" button lives in the global header**, not buried in a tab — given
  TOCA's business is physical hardware, this is likely device/stock management. Lesson for us
  regardless of contents: our own Band Inventory (NGO Portal, `BRIEF.md` 4.2) probably deserves
  similarly prominent placement, not a buried sub-tab, since a device shortage can directly block a
  mother from being monitored.
- **Correction to an earlier note:** the "Statuses" tag list (`off-track`, `not-called`) seen on the
  patient settings page is actually **defined once at the org/admin level and applied across
  patients**, not a per-patient custom field — this Admin screen has the same "Statuses" tab,
  confirming it's centrally managed.
- **"Locations" — flagged as uncertain, not adopted.** Each one is named after a doctor with a large
  staff count, possibly meaning "a provider's whole care team" rather than a literal clinic address.
  Not confident enough in the interpretation to build on it, and `BRIEF.md`'s current three-portal
  structure doesn't need this level of nested org hierarchy anyway — skip unless a real need for
  multi-tenant nesting shows up later.
- **Skip:** org-wide RPM/CCM billing report exports, the `Toca`/`Non Toca` staff filter (internal to
  TOCA's own business relationship with the clinic).

---

## Open decisions surfaced by this review, not yet resolved

1. **Per-patient threshold overrides** — admin sets safe global bounds, doctor narrows per patient?
   Needs deciding before the Admin Console phase is scoped.
2. **Who can assign/unlink a health band from the Doctor Portal** — read-only view with emergency
   unlink only, or a fuller assignment flow? Leaning read-mostly, not fully decided.
3. **Instructional videos — push model, self-serve library, or both?** Not urgent, but worth deciding
   before the mobile "Care Plan" tab gets built out.
