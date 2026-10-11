# MomCare: 60% evaluation demo script

About 30 minutes, whole project, on the **live site** (`https://momcare.solutions`).
This replaces the older runbook for this evaluation: that one describes the local
setup, an old database and features that have since changed.
Say "decision support, not a diagnosis" whenever the AI comes up.

## Before the day (do these, they decide whether the demo works)

- [ ] Two browser windows signed in on the live site: **hospital admin** and
      **provider** (a different browser or a private window for the second). Passwords
      stay with you; never put them on a slide.
- [ ] A patient with **recent readings** (the plan text says "last week"), a
      **finalized or reviewed care plan**, tags on notes, and at least one risk review
      pending. Today's candidates: Mariam Sheikh and Ayesha Khan (Main Branch).
- [ ] Fill in **West Wing Clinic**'s missing address (Governance, Locations).
- [ ] Confirm the **escalation schedule** is running on the server, and that the
      bell shows a live alert.
- [ ] **Staff invitation email** works (Ahmed). If it does not, **skip the invite
      step** and say email delivery is being finished.
- [ ] Record the whole flow once as a **screen recording** (fallback if the site or
      the internet fails). Keep it on the laptop, not online.
- [ ] Open `https://api.momcare.solutions/health/` once to wake the server.
- [ ] Do **not** use real patient data. Do not demonstrate password entry.

## The story to tell (one line each act)

A hospital registers, is approved, onboards its own staff and patients; readings come
in; an AI scores each one; a human reviews; nobody answering makes the alert climb.

## Act 1: The system is live (2 min)

1. Open `momcare.solutions` (padlock, real domain). Point out it is the deployed
   product, not a laptop demo: portal on Vercel, API and database on Railway.
2. Show the landing page "Built honestly" box: row-level security enforced in
   production; the obstetrician sign-off is still pending.

**Say:** hospitals are separate tenants; one hospital can never see another's data.

## Act 2: A hospital applies (3 min)

1. Open `/register`. Walk the four steps: owner account, organisation, contact,
   location and licence.
2. Type digits in the first name and a short phone number to show the **input
   validation**: digits are refused and each field flags its own mistake as you leave it.
3. Stop before submitting (no real application on the live system).

**Say:** registration is an application, not a sign-up; a platform administrator
approves it before anyone sees patient data.

## Act 3: Admin dashboard and governance (4 min)

Signed in as **hospital admin**.

1. **Clinical Overview** (the dashboard): the workflow tiles (risk review, low
   confidence, plans to review, care plans missing), the patient list with
   latest and this-month risk.
2. **System Governance**: locations, staff, statuses, note templates,
   **Care plan preferences**, **Confidence threshold** (explain what 0.80 means:
   below it a result goes to a clinician).
3. **Executive Dashboard**: enrolment trend, pregnancy status, devices.
4. Say who sees what: a nurse or provider does not see Governance or the Executive Dashboard.

## Act 4: Enrol a patient (3 min)

1. Open **Enrol a patient**. Fill in a made-up demo patient (not a real person).
2. Show validation: digits in the name are blocked, a short phone number gets a
   message the moment you leave the field, a required field left empty is flagged.
3. Enrol (this is the only write to the live system; use a clearly fake name such
   as "Demo Patient" and tell the panel it is test data), or stop before pressing
   Enrol and open an existing patient instead.

## Act 5: The patient record (5 min)

Open **Mariam Sheikh** (or the prepared patient).

1. **Header:** name, gestational age, status chips; scroll down and the header
   collapses smoothly.
2. **Overview:** AI summary (decision support only), reading activity, devices, care team.
3. **Readings:** one chart per vital, average with the clinical bands (ACC/AHA),
   the list view with **All vitals**; add a reading (impossible values are refused;
   200/120 is accepted because it is dangerous but possible).
4. **Risk:** each reading and the risk level it produced, review pending.

## Act 6: AI risk, review and alerts (4 min)

1. Add a high-risk reading (for example 170/110) for the prepared patient. Show the
   new assessment and the **alert** on the bell.
2. As the **provider** window, open the alert: acknowledge it. Explain that only a
   clinician can acknowledge, and that acknowledging stops the escalation.
3. **Review** the assessment with a confirmed level.
4. Mention that unanswered alerts climb to the ward and then the administrator.

## Act 7: Care plan (4 min)

1. Open the **Care Plan** tab: month and week, the status badge (it is a menu).
2. **Exercise & nutrition:** "How she did last week" with the risk and vitals
   highlighted; sources and the "generated by AI" notice.
3. **Medication:** as the **provider**, add a medication (only a provider can; the AI
   never writes medicines). As admin, show the read-only view and say why.
4. **Notes**, then the status menu: **Mark reviewed**, **Finalize**, **Reopen to edit**.
5. Say the plan is decision support, with a review step and reviewed labels.

## Act 8: Clinical notes (2 min)

Open **Clinical Notes**: the note list, search, the tag filter, add a note with a new tag.

## Act 9: Behind the scenes (2 min, only if asked for depth)

- Architecture: Next.js portal, Django REST API, PostgreSQL with row-level security,
  a separate framework-free AI package.
- Tests: backend about 878, frontend about 308 (run the frontend suite if asked).
- Security: strict content security policy, idle sign-out after 30 minutes,
  tenant isolation in the database.

## What to say about what is not built (say it before you are asked)

- The **patient mobile app**: **[state the real status]**.
- The **NGO emergency portal** and the **platform-admin dashboard**: designed, not built.
- **Real wearable hardware**: readings are entered or simulated and labelled as such.
- **Clinical thresholds** have not been reviewed by an obstetrician; this is a
  prototype, not for real clinical use.

## If something fails

| Problem                      | What to do                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Site or internet down        | Play the screen recording and narrate over it.                                           |
| A page spins forever         | Refresh once; the first request after a quiet period wakes the server.                   |
| An email is expected         | Say delivery is being finished; show the account list instead.                           |
| A question you cannot answer | "We have not measured that yet; it is in the plan for the final." Never invent a number. |

## Rehearse

Run this exact script once, timed, the day before. Cut Act 9 first if you run long.
