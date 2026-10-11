# Backend request: server-side input validation, invitation email feedback, evaluation evidence

**For:** Ahmed (backend / AI) **From:** Frontend **Needed by:** before the 60% evaluation
**Suggested labels:** `backend`, `validation`, `priority: high`

## Context

During the evaluation rehearsal a patient was enrolled with the first name "123".
The portal now blocks this in the browser, but the browser is not a security or
data-quality boundary: the API still accepts the same input if it is called
directly (Postman, another client, the mobile app). The rules below should be
enforced on the server as well. The reference implementation of every rule is in
the frontend repo: `src/shared/lib/validation.ts` (and `src/features/monitoring/vitalLimits.ts`
for vitals), with tests next to them.

## 1. Server-side input validation (high priority)

Return a normal 400 with a field-level message, like the existing validators.

| Field                                                                                                                 | Rule                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Person names (patient first/last, emergency contact name and relationship, staff, secondary provider, representative) | Letters (any alphabet), spaces, hyphen, apostrophe, full stop only. 2 to 60 characters. No digits. No repeated punctuation. Must start with a letter.                                 |
| Phone numbers (patient, emergency contact, staff, hospital, location)                                                 | Digits, spaces, dashes, brackets and one leading `+` only. 7 to 15 digits. Reject all-same-digit numbers. Blank stays allowed where it is optional (keep converting blank to `NULL`). |
| City, state / province, country                                                                                       | Letters, spaces, hyphen, apostrophe, full stop. No digits. 2 to 80 characters.                                                                                                        |
| Hospital, location and organisation names                                                                             | 2 to 200 characters, must contain at least one letter. Allowed: letters, digits, space and `& . , ' ( ) / -`.                                                                         |
| Address lines                                                                                                         | 3 to 200 characters, must contain a letter or digit. Allowed: letters, digits, space and `, . # / & ' ( ) -`.                                                                         |
| Postal code                                                                                                           | 3 to 10 letters, digits, spaces or hyphens.                                                                                                                                           |
| Registration / licence numbers, device serial numbers                                                                 | 3 to 40 letters, digits, spaces, `. / -`.                                                                                                                                             |
| Email                                                                                                                 | Valid format, at most 254 characters.                                                                                                                                                 |
| Date of birth                                                                                                         | Not in the future, not more than 120 years ago.                                                                                                                                       |
| Gravida / para                                                                                                        | Whole numbers. Gravida 1 to 20, para 0 to 20, para not above gravida.                                                                                                                 |
| Last menstrual period                                                                                                 | Not in the future, not more than about 44 weeks ago.                                                                                                                                  |
| Tag, status and note-template names                                                                                   | Must contain a letter or digit; keep the current length limits.                                                                                                                       |

### Vitals (a reading can never be edited, so bad values must not be saved)

Reject values outside what a person can physically have. These are not clinical
alarm levels: dangerous values such as 200/120 must still be accepted so the
model can score them.

| Vital                           | Min | Max |
| ------------------------------- | --- | --- |
| Systolic BP (mmHg)              | 50  | 300 |
| Diastolic BP (mmHg)             | 20  | 200 |
| Heart rate (bpm)                | 20  | 250 |
| Temperature (°F)                | 80  | 115 |
| Hemoglobin (g/dL)               | 2   | 25  |
| Blood glucose (mg/dL)           | 20  | 800 |
| Stress score, physical activity | 0   | 10  |

Also: blood pressure needs both halves (the API already requires this), and the
diastolic must be lower than the systolic.

**Done when:** each rule has a test that fails without it (the project's
fault-injection convention), and a request with `first_name: "123"` returns 400.

## 2. Staff invitation emails (high priority)

Invitations are not arriving. Resend shows `momcare.solutions` as verified and the
Railway email variables are present, so the cause is not yet known.

- [ ] Check the Railway logs immediately after sending an invite for
      `Resend refused` / `Could not reach Resend` / `Failed to send`, and confirm the
      active deployment is the latest `main`.
- [ ] The invitation currently returns **201 even when the email fails** (the send is
      best-effort and only logged). Please return whether the email was sent
      (for example `email_sent: true/false`) so the portal can warn the administrator
      and offer a resend, instead of showing a false success.
- [ ] Clarify the intended behaviour: the Postman collection says staff receive
      their credentials by email with no invite link, but the code emails a
      one-time set-password link. Please make the documentation match the code.

## 3. Patient onboarding email (decision needed)

Enrolling a patient sends no email at all. Is that intended? If a patient or an
emergency contact should be notified, please say what it should contain and I
will adapt the portal wording.

## 4. Evidence for the evaluation panel

- [ ] Confusion matrix for the risk model, and the recall for the **High** class
      (missing a high-risk patient is the costly error).
- [ ] How the reported 88.4% test accuracy was measured: data source, size, split.
- [ ] Short note on what the confidence threshold (default 0.800) means and how it
      was chosen.

## 5. Please confirm

- [ ] Only a **provider** can write medication on a care plan; a **hospital admin**
      can finalize and reopen. Is this enforced on every medication endpoint, not
      only described in the guide?

---

_Please comment here when each item is done so the frontend can retest._
