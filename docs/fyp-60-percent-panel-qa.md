# MomCare: 60% evaluation, likely panel questions

Panel of five teachers from different domains, 30+ minute slot, whole project.
Answers are written from what is actually built (backend `CLAUDE.md`, the live
site, the frontend). Items marked **[verify]** are numbers or states that went
stale in the docs or that only the owner can confirm. Check them before the day.

## 0. The 60-second pitch

MomCare is a B2B maternal-health platform. A hospital registers, then onboards
its own staff and pregnant patients. Vitals (blood pressure, heart rate,
temperature, glucose, hemoglobin, stress, activity) come from a wearable or are
entered by staff. An AI model scores each reading Low / Medium / High, raises
alerts that escalate if nobody responds, and a care plan (nutrition, exercise,
medication, notes) is generated each week. Doctors review everything. The model
is decision support, never a diagnosis.

Live: `https://momcare.solutions` (portal) and `https://api.momcare.solutions`
(API).

## 1. What is done / partly done / left (say this before they ask)

| Area                                                                                                                 | State                                                                     |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Hospital registration, approval gate, roles (platform admin, hospital admin, provider, nurse, care manager, patient) | Done, live                                                                |
| Staff invitations (invite link, never an admin-set password)                                                         | Done                                                                      |
| Patients, pregnancies, address, care team, clinical notes, statuses, tags                                            | Done                                                                      |
| Vitals ingestion, charts per vital, risk history, average + clinical bands                                           | Done                                                                      |
| AI risk model (XGBoost) scoring every reading, alerts, escalation, review workflow                                   | Done                                                                      |
| Weekly AI care plan (staff view, review, finalize, reopen, preferences)                                              | Done                                                                      |
| Dashboard workflows (risk review, low confidence, care plans to review, missing)                                     | Done                                                                      |
| Security: row-level security in production, security headers/CSP, idle sign-out                                      | Done                                                                      |
| Governance (locations, labels, templates, confidence threshold, care plan preferences)                               | Done                                                                      |
| Patient mobile app                                                                                                   | **[verify]** shell only per the last plan; features depend on the backend |
| NGO emergency-response portal                                                                                        | Designed, not built                                                       |
| Platform-admin API/dashboard                                                                                         | Not built (reviewed through Django admin)                                 |
| Real wearable hardware                                                                                               | Not built; readings are simulated or manual and labelled                  |

Remaining for the final (the other 40%): mobile app features, NGO portal,
clinical validation of thresholds, end-to-end and load testing, hardware
integration if it is in scope. **[verify with the team which of these are
committed]**

## 2. Domain: AI / Machine learning

**Q. What model, what data, how accurate?**
XGBoost classifier, three classes (Low / Medium / High) from nine features
(vitals plus risk context). Reported test accuracy 88.4% **[verify the exact
figure and the dataset in the report]**. Artifacts are versioned
(`models/artifacts/v1`). It is the only risk producer; there is no rules-engine
fallback.

**Q. Accuracy alone is not enough for a medical model. What else do you report?**
Be ready to show precision/recall per class, and especially recall on High
(missing a high-risk patient is worse than a false alarm). **[Ahmed to supply
the confusion matrix]**.

**Q. What happens when the model is unsure?**
Every prediction carries a confidence. Below the hospital's threshold (default
0.80, an admin can change it in System Governance) the assessment is flagged
`flagged_for_review` and goes to a low-confidence queue for a clinician.

**Q. Why does Africa + Medium become High?**
A deliberate regional post-processing rule written in Python: the shown level
(`final_risk_level`) is raised, while the raw model answer is stored untouched.
Region is derived from the hospital's country, never typed in.

**Q. Who checks the model's output?**
A clinician review workflow: pending / reviewed / escalated, with a confirmed
risk level, gated to clinicians and hospital admins. The portal always labels
output "Decision support only, never a diagnosis".

**Q. Is it clinically validated?**
No, and we say so. Thresholds (model data, category cut-offs, escalation timings)
have not been reviewed by an obstetrician. This is a decision-support prototype;
real use would need clinical validation and regulatory review (DRAP in
Pakistan). A clinical-threshold review document exists in `docs/`.

**Q. The care plan is generated by AI. How do you stop it hallucinating?**
Every plan item is labelled by source (suggested automatically vs reviewed by a
provider), shows sources when found, says plainly when no official guideline
was found, and `sources_verified` is always false (we never claim the sources
were checked). Plans are staff-reviewed and finalizable; only a provider can
write medication, and the AI never writes medicines. Plan text is rendered as
plain text, never HTML.

**Q. Does patient age or other data go into the model?**
Age is taken from the registered date of birth, so it is always current.
Gestational age is derived from the expected delivery date, never stored.

## 3. Domain: Software engineering / architecture

**Q. Describe the architecture.**
Modular monolith. Backend: Django + Django REST Framework, API only, PostgreSQL,
JWT auth. Frontend: Next.js 16 (App Router), React 19, TanStack Query, Tailwind
v4, react-hook-form + zod. Layering in the frontend: pages call hooks, hooks call
one API client. The AI model is a separate framework-free Python package. An
import-linter enforces that `modules` may depend on `core` but not the other
way round.

**Q. Why a monolith, not microservices?**
Small team, one deployable, transactional consistency (a reading, its risk
assessment and its alert are created in one transaction). Clear module boundaries
keep a later split possible.

**Q. How is the code kept correct?**
Backend about 878 tests on a real PostgreSQL (nothing mocked), security tests
proven by fault injection (remove the protection, watch the test fail).
Frontend 279 tests, type check and lint on every commit via hooks. **[verify
current counts]**

**Q. How does alert escalation work?**
A scheduled command (`escalate_alerts`, every minute) climbs unacknowledged
alerts through tiers; idempotent, tier computed from the clock; every step is an
append-only audit event. Without the scheduler alerts would not climb, which is
a known dependency.

**Q. Deployment?**
Frontend on Vercel (auto-deploys `main`), backend and PostgreSQL on Railway.
Migrations use a separate privileged database user from the one the app runs as.

## 4. Domain: Database / security / privacy

**Q. How do you isolate hospitals' data?**
Two layers. Application: every viewset over tenant data composes a scoping
mixin and cross-tenant reads return 404, not 403. Database: PostgreSQL
row-level security on every tenant table, fail-closed (no tenant set means zero
rows), enforced in production since 1 Sep 2026 through a restricted
`momcare_app` role (no bypass, no DDL). A verification script exercises it.

**Q. Authentication?**
Email + password only (phone login was built and removed because it was
unreliable). Short-lived access token plus HttpOnly refresh cookie. Staff are
invited by emailed one-time link, never given a password by an admin, so alert
acknowledgements are attributable. Idle sign-out after 30 minutes with a 60 s
warning, synced across tabs. Platform-admin sign-in is a separate hidden page,
and the public login rejects platform admins.

**Q. Other protections?**
Security headers and a strict Content Security Policy, login rate limiting,
records never physically deleted (deactivate only), admin cannot delete
patients, readings or alerts, a reading correction is a new reading.

**Q. Known weaknesses?**
Access token is kept in browser storage (readable by injected script; mitigated
by CSP and short life). No end-to-end or load tests yet. No SMS channel. Say
these first.

**Q. Compliance (HIPAA/GDPR)?**
Not certified. The design follows the principles (tenant isolation, audit trail,
least privilege, consent captured at enrolment). Do not claim certification.

## 5. Domain: UI / UX and healthcare domain

**Q. Who are the users and how does the UI serve them?**
Hospital admins, providers, nurses, care managers. The dashboard puts the
actionable work first: workflow tiles (risk review, low confidence, care plans
to review, care plans missing), a patient list with latest and this-month risk,
and a patient page with tabs (Overview, Readings, Risk, Care Plan, Clinical
Notes, Devices, Documents, History). Risk is shown with colour and text, never
colour alone.

**Q. Accessibility and speed?**
Labelled form controls, keyboard-reachable menus, reduced-motion respected in the
new animations, lazy-loaded heavy tabs, a smooth collapsing sticky patient
header. **[run a Lighthouse pass before the day so you can quote real numbers]**

**Q. Why is the clinical information laid out like this?**
Overview cards for the glance, a graph per vital with published clinical
reference lines (explicitly not the model's decision boundary), and an average
with the share of readings in each clinical band (ACC/AHA categories).

## 6. Domain: Project management / research / future work

**Q. What was your method and how is work divided?**
**[Fill in your methodology and the real split.]** Backend and AI are Ahmed's;
the portal is the frontend work; plans live in `docs/PLAN.md`; each change is a
small commit with tests run by a pre-commit hook.

**Q. What would you do with another month?**
Mobile app features, NGO emergency portal, clinician review of thresholds,
end-to-end and load tests, wearable integration, SMS alerts.

**Q. What was the hardest problem?**
Pick one you can tell well: enforcing row-level security without breaking login
(identity resolved under RLS), the smooth sticky header (animating height
re-lays-out the whole page; fixed-height wrapper fixed it), or reconciling
frontend features with backend contracts that changed (risk fields, care plan
endpoints).

**Q. What did the team change its mind about?**
Examples from the record: removed phone login, removed alert emails (shared
sending quota), made risk assessment one row per reading, consolidated queue
endpoints into query parameters on one patient list.

## 7. Questions to expect from any teacher

1. "Show me it running." Have the live site open and logged in as a provider, with
   a patient who has readings, a finalized care plan and a notes timeline.
2. "What is _your_ contribution?" Know your own list cold.
3. "What happens if the internet or the server is down?" Have a recorded
   fallback (screen recording) of the main flow.
4. "Is this safe for real patients?" Say clearly: prototype, not clinically
   validated, decision support only.
5. "How is this different from existing apps?" Hospital-run, B2B, per-hospital
   isolation, AI plus clinician review loop, alert escalation with audit.

## 8. Before the day

- Log in on the live site as hospital admin and as provider (separate browsers).
- Reload the demo patient's data so readings are recent (dates matter; the
  summary quotes "last week").
- Confirm the escalation scheduler is running on the live backend.
- Test the demo on the evaluation room's network; keep a screen recording.
- Do not use real patient data in the demo.
