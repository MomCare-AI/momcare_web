# Platform Admin dashboard — plan (revision 2, 3 Oct 2026)

**Status: for approval. Nothing here has been built.** Revised around a three-portal architecture. NGO backend details are marked _future_ because that backend does not exist.

## 1. Architecture: three separate portals

```
                      MOMCARE PLATFORM
                            |
        +-------------------+-------------------+
        |                   |                   |
  PLATFORM ADMIN         HOSPITAL               NGO
   /platform            /dashboard             /ngo
        |                   |                   |
 manages the platform   manages patients     manages bands,
 and organizations      and monitoring       programs, reports
```

- **Platform Admin is not a Hospital Admin.** A hospital admin manages their own hospital. A platform admin manages the MomCare platform and decides which organizations may use it.
- Platform Admin is its **own application area** with its own layout, sidebar, feature module, queries and services. It does not reuse, and is not the parent of, the hospital dashboard code.
- Frontend layout: `features/platform-admin/{components,hooks,repositories,services,types}` beside `features/hospital*` and `features/ngo*`.
- **Route name:** the existing platform area is already `/platform` (layout, role guard, AI templates page). Recommendation: **keep `/platform`** and add pages under it. `/admin` would be confusing next to the backend's Django admin at `/admin/`. See decision D1.

## 2. What exists today (verified in the code, 3 Oct 2026)

**Backend:**

- The platform-admin API has **only** AI config and AI summary templates. **No endpoint lists, reviews, approves or rejects a registration.**
- Hospital review exists as **Django admin actions** on `Organization` (approve, reject, suspend, deactivate, reactivate) and on `OrganizationDeactivationRequest` (approve, dismiss).
- All of those call one shared model method, **`Organization.set_review_status(status, by, note, notify)`**, which already:
  - stamps `reviewed_by`, `reviewed_at`, `review_note`;
  - on approval creates the hospital's **default Location** (required before it can admit a patient);
  - **emails the owner on a real change to approved or rejected** (`send_application_approved` / `send_application_rejected`). Suspension sends no email.
- Services for deactivation already exist: `deactivate_organization`, `reactivate_organization`, `request_deactivation`, `approve_deactivation_request`, `dismiss_deactivation_request`.
- `IsPlatformAdmin` permission already exists. A non-approved hospital cannot authenticate; login answers with `org_status`.
- `Organization` holds `status` (pending, approved, rejected, suspended), `license_number`, and `license_image` (**image upload is not wired**).
- **No NGO model, endpoint, tenant type or role exists.**
- `CLAUDE.md` says the platform-admin API stays unbuilt "until asked". This plan is that ask.

**Gaps in the current review logic** (these shape the minimum backend work):

1. **No transition rules:** any status can be set from any status.
2. **No required reason:** `note` is optional, and an old `review_note` stays in place if a new decision has none.
3. **No decision history:** only the latest decision is stored (reviewer, time, note). A reject-then-approve overwrites the earlier record.
4. **No suspension email.**
5. **No list or detail API** at all.

**Frontend:** `/platform` shows only AI Summary Templates. The NGO wizard writes to a demo in-memory store.

## 3. Domain separation (important)

The UI can show one **unified inbox** (tabs: All, Hospitals, NGOs), but underneath the two stay **separate concepts**:

- A **hospital application is the `Organization` row itself** while its status is `pending`. There is no separate application table, and none should be added.
- An **NGO application** will be its own model when the NGO backend exists, with its own fields and documents. Do **not** create a vague universal `OrganizationApplication` just to make the frontend convenient.
- Frontend types stay separate (`HospitalApplication`, `NgoApplication`); the inbox maps both into a small shared row type for display only.

## 4. Minimum backend change for hospital approval (Phase 1, Ahmed)

All routes: `IsAuthenticated + IsPlatformAdmin`, run inside `bypass_rls()` (cross-tenant by design, the same sanctioned path Django admin uses).

| Method + route                            | Purpose                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/platform-admin/hospitals/`      | List. `?status=`, `?search=` (name, email, licence no.), `?ordering=`, paginated with `DefaultPagination` / `StableOrderingFilter` |
| `GET /api/platform-admin/hospitals/{id}/` | Detail: organization, owner, contact, address, licence number, review fields, counts of locations and staff                        |
| `POST .../hospitals/{id}/approve/`        | `{ note? }`                                                                                                                        |
| `POST .../hospitals/{id}/reject/`         | `{ note }` **required**                                                                                                            |
| `POST .../hospitals/{id}/suspend/`        | `{ note }` **required**                                                                                                            |
| `POST .../hospitals/{id}/reactivate/`     | `{ note? }`, suspended back to approved                                                                                            |

Each action calls the **existing `set_review_status`**, so the API and Django admin share one code path (D3). Minimum changes needed:

1. A `platform_admin` serializer pair (list, detail) and the views above.
2. **Transition rules** in one place: `pending -> approved | rejected`; `approved -> suspended`; `suspended -> approved` (reactivate); `rejected -> approved` only through an explicit re-review (D5); everything else returns 400.
3. **Reason required** for reject and suspend, in the service, so Django admin cannot bypass it.
4. **Decision history:** a small append-only record (organization, from, to, by, at, note) so a later decision never erases an earlier one. This also feeds the activity log.
5. Return the decision's effect in the response (new status, `reviewed_by`, `reviewed_at`).
6. Tests: permission (non-platform roles get 403), transitions, required reason, one email per genuine change, the default Location created on approval, and that an approved owner can log in afterwards.

Out of the first cut: deactivation-request endpoints (`GET/POST .../deactivation-requests/`), the licence-image upload, and any metrics.

## 5. NGO backend (future, Phase 3)

Not designed until the NGO data model is agreed. The frontend already models the intent in `NgoApplication` (statuses pending, under review, verified, rejected, suspended; per-document pending, verified, rejected; information requests). The likely shape mirrors section 4 under `/api/platform-admin/ngos/` plus a public multipart apply endpoint and access-controlled document download. Needs from the backend: an NGO model and tenant type, a role, RLS decisions, and file validation. Not detailed here on purpose.

## 6. Platform Admin screens

Sidebar: **Overview** · **Applications** (All / Hospitals / NGOs) · **Organizations** · **Deactivation requests** · **AI templates** (existing) · **Activity** · **Settings**.

1. **Applications** (first useful feature): tabs All, Hospitals, NGOs plus status filter, search, paging, skeleton loading. Row: name, type, submitted, status. Opens the review page.
2. **Review page:** read-only sections (organization, contact, address, owner / representative, licence, documents later), a status badge, and decision buttons. Reject and suspend open a modal that **requires a reason**. A **review note** records what was checked (registry consulted, date, callback), matching the existing `review_note` field.
3. **Organizations** directory: approved and suspended organizations of both types, with suspend / reactivate (reason required). Shows who approved it and when.
4. **Deactivation requests:** approve or dismiss a hospital's request to close its account.
5. **Activity:** decision history from section 4.
6. **Overview** last: counts (hospitals, NGOs, pending, active), recent applications, recent activity. No analytics until real data exists.

Rules carried over: an uploaded certificate never verifies anything by itself; after approval the label reads **"Verified by MomCare"**, never "Government verified"; the dashboard shows organization data only, **never patient data**; every decision records who, when and why.

## 7. Phases

| Phase | Work                                                                                                                                 | Who           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| 0     | Architecture and API contract (this document), decisions D1 to D6                                                                    | together      |
| 1     | Hospital platform-admin API (section 4)                                                                                              | Ahmed         |
| 2     | Platform Admin shell: layout, sidebar, role guard, `features/platform-admin` module. UI can start on dummy data against the contract | us            |
| 3     | Applications: hospital review end to end on the real API; NGO review once its backend exists                                         | us, then both |
| 4     | Organizations directory, suspend / reactivate, deactivation requests, activity log                                                   | both          |
| 5     | Overview metrics                                                                                                                     | us            |

**Transition:** Django admin stays as a fallback. Both paths call `set_review_status`, so behavior cannot drift. Retire it only after the dashboard is proven.

**Acceptance for "then the hospital works":**

1. Register a hospital; confirm it cannot sign in while pending.
2. Approve it in the dashboard; confirm the owner is emailed, a default location exists, and the owner can sign in and reach `/dashboard`.
3. Suspend it with a reason; confirm sign-in is blocked again.
4. Reject a different application with a reason; confirm the reason is stored and shown.
5. For NGOs (later): the same flow ends with MomCare creating the NGO account.

## 8. Decisions needed

- **D1 Route:** keep `/platform` (recommended) or rename to `/admin`?
- **D2 Roles:** one `platform_admin` role, or reviewer vs super admin (only a super admin approves, rejects or suspends)?
- **D3 Single code path:** confirm the API and Django admin both go through `set_review_status` (recommended).
- **D4 Emails:** approval and rejection emails already exist. Add a suspension email, and emails for NGO decisions and "more information needed"? Volume is low, but it uses the shared email quota.
- **D5 Re-review:** may a rejected application be approved later, or must the applicant reapply?
- **D6 Licence evidence:** wire the licence image upload now, so hospital review has documents like NGO review?
- Later: how platform admins are created, and whether they need MFA.

## 9. Frontend status (3 Oct 2026)

Built first, on sample data, ahead of the backend (Phase 2, plus the hospital and NGO review screens of Phase 3):

- **Route kept as `/platform`** (D1). The old AI templates page moved to `/platform/ai-templates`; `/platform` is now the Overview.
- `features/platform-admin/` is its own module (components, hooks, repository, sample data, types), separate from the hospital and NGO modules. The shell has its own dark sidebar (drawer on mobile) and keeps the existing `platform_admin` role guard.
- Screens: Overview, Applications (unified inbox with type tabs, status chips and search), per-application review pages (hospital and NGO), Organizations, Activity. Every screen carries a "Preview: sample data" notice and loads with skeletons.
- **All data goes through `platformAdminRepository`.** Swapping it for the real API changes only that file. The rules the backend must enforce are already encoded there as two small tables (allowed status transitions, which actions require a reason) and covered by tests.
- Assumed until decided: one admin role (D2), rejected applicants must reapply (D5), licence image shown as "not uploaded yet" (D6).
- NGO applications submitted at `/register/ngo` appear in the same inbox (shared demo store).
- Not built yet: deactivation requests, real documents (no files are kept in the preview), the reviewer vs super-admin split.
