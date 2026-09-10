"use client";

import { useState } from "react";
import { GraduationCap, KeyRound, ShieldCheck, Gauge } from "lucide-react";

import { authFetch, clearAccessToken } from "@/core/api/authFetch";
import { clearQueryCache } from "@/core/query/queryClient";
import { usePortal } from "../layout";
import {
  useUpdateConfidenceThreshold,
  type OrgSummary,
} from "@/features/portal/hooks/usePortalData";
import { useStaffList } from "@/features/staff/hooks/useStaff";
import { StaffCredentialsPanel } from "@/features/staff/components/StaffCredentialsPanel";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Account settings.
 *
 * Only the password lives here so far. Name, phone and gender are set by the
 * hospital when the account is created and are not yet editable — showing them
 * as read-only is more honest than a form that silently discards what is typed.
 *
 * Email, role and hospital are deliberately not editable at all. The email is
 * the sign-in identifier and changing it needs a verification round trip; role
 * and hospital are granted by the organisation, never chosen by the person
 * holding the account.
 */
/**
 * DRF wraps validation messages in lists, even when a serializer raised a
 * single string — {"detail": ["..."]}. Rendering that array happens to look
 * right, which is what makes it easy to miss: the text appears, while any code
 * checking the shape silently takes the wrong branch.
 */
function firstMessage(value: unknown): string | null {
  if (Array.isArray(value))
    return typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" ? value : null;
}

export default function SettingsPage() {
  usePageTitle("Settings");
  const { user, org, isHospitalAdmin } = usePortal();
  // Reuses the same cached query the Staff page uses - free for anyone
  // who's already visited it this session, and cheap enough regardless.
  const staffQuery = useStaffList();
  const myProfile = staffQuery.data?.find((m) => m.id === user.staff_id);

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setDone(false);

    // Read the fields themselves — a password manager fills the DOM without
    // firing the events React listens for, so state could be empty while the
    // boxes visibly hold values.
    // Held before the await: after one, React may have detached the event
    // and e.currentTarget can be null, so resetting the form later would throw.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const current = String(form.get("current_password") ?? "");
    const next = String(form.get("new_password") ?? "");
    const confirm = String(form.get("confirm_password") ?? "");

    if (!current || !next) {
      setError("Fill in your current and new password.");
      return;
    }
    if (next !== confirm) {
      setError("The two new passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch("/api/auth/password/change/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_password: current, new_password: next }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // The server sends the password validator's own words — too short, too
        // common, too similar to your email. They are more useful than anything
        // this page could invent.
        const detail =
          firstMessage(data?.detail) ??
          firstMessage(data?.new_password) ??
          firstMessage(data?.current_password);
        setError(
          res.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : (detail ?? "Could not change your password. Please try again.")
        );
        return;
      }

      setDone(true);
      formEl.reset();

      // Changing a password ends every session that used the old one,
      // including this one. Sending the user to sign in again is the honest
      // consequence rather than leaving a dead session that fails on the next
      // request for no visible reason.
      clearQueryCache();
      clearAccessToken();
      window.setTimeout(() => {
        // A full page load, not router.push, and deliberately so. The access
        // token and every refresh token for this account have just been
        // invalidated, and a client-side navigation would keep this tab's React
        // tree — including the portal layout's copy of the signed-in user —
        // alive against credentials that no longer work. Reloading is the only
        // way to be certain nothing survives the change.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }, 2500);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">Settings</h1>
          <p className="mc-sub">Your account at {org.name}.</p>
        </div>
      </div>

      <section className="mc-card">
        <div className="mc-card-head">
          <div>
            <h2 className="mc-card-title">Your details</h2>
            <p className="mc-card-sub">
              Set by your hospital when your account was created.
            </p>
          </div>
        </div>
        <div className="mc-card-body">
          <div className="mc-pairs">
            <Pair
              label="Name"
              value={`${user.first_name} ${user.last_name}`.trim()}
            />
            <Pair label="Email" value={user.email} />
            <Pair label="Role" value={user.role_code.replace(/_/g, " ")} />
            <Pair label="Hospital" value={org.name} />
          </div>
          <p className="mc-foot-note">
            Your email is how you sign in, and your role and hospital are
            granted by {org.name}. To change any of them, ask your hospital
            administrator.
          </p>
        </div>
      </section>

      {user.staff_id && (
        <section className="mc-card">
          <div className="mc-card-head">
            <div>
              <h2 className="mc-card-title">
                <GraduationCap size={17} strokeWidth={1.9} aria-hidden />{" "}
                Professional details
              </h2>
              <p className="mc-card-sub">
                Shown on your profile in Doctors &amp; Staff — self-reported,
                not independently verified.
              </p>
            </div>
          </div>
          <div className="mc-card-body">
            {staffQuery.isPending && <div className="mc-hint">Loading…</div>}
            {myProfile && <StaffCredentialsPanel member={myProfile} canEdit />}
          </div>
        </section>
      )}

      {isHospitalAdmin && <ConfidenceThresholdCard org={org} />}

      <section className="mc-card">
        <div className="mc-card-head">
          <div>
            <h2 className="mc-card-title">
              <KeyRound size={17} strokeWidth={1.9} aria-hidden /> Change
              password
            </h2>
            <p className="mc-card-sub">
              You will be signed out everywhere and asked to sign in again.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mc-card-body">
          <div>
            <label className="mc-label" htmlFor="current_password">
              Current password <span className="mc-req">*</span>
            </label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              className="mc-input"
              required
            />
            <span className="mc-hint">
              Confirms it is you, not whoever found the screen unlocked.
            </span>
          </div>

          <div className="mc-formgrid" style={{ marginTop: 18 }}>
            <div>
              <label className="mc-label" htmlFor="new_password">
                New password <span className="mc-req">*</span>
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="mc-input"
                required
              />
            </div>

            <div>
              <label className="mc-label" htmlFor="confirm_password">
                Confirm new password <span className="mc-req">*</span>
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat it"
                className="mc-input"
                required
              />
            </div>
          </div>

          {error && <p className="mc-alert mc-alert-error">{error}</p>}
          {done && (
            <p className="mc-alert mc-alert-success">
              <ShieldCheck size={16} strokeWidth={2} aria-hidden /> Password
              changed. Signing you out — sign in again with the new one.
            </p>
          )}

          <div className="mc-card-foot">
            <button type="submit" className="mc-btn" disabled={saving || done}>
              {saving ? "Changing…" : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

/**
 * How sure the model has to be before its answer is accepted without a second
 * look.
 *
 * Entered as a percentage because that is how the result is read everywhere
 * else in the portal; stored as the 0-1 fraction the API expects. Raising it
 * flags more assessments for review, which is the safer direction and also
 * the noisier one — so the consequence is stated rather than left to be
 * discovered from the review queue filling up.
 */
function ConfidenceThresholdCard({ org }: { org: OrgSummary }) {
  const update = useUpdateConfidenceThreshold();
  const effectivePercent = Math.round(
    Number(org.effective_confidence_threshold) * 100
  );
  const hasOverride = org.confidence_threshold !== null;

  const [value, setValue] = useState(String(effectivePercent));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const percent = Number(value);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return;
    update.mutate(percent / 100);
  };

  return (
    <section className="mc-card">
      <div className="mc-card-head">
        <div>
          <h2 className="mc-card-title">
            <Gauge size={17} strokeWidth={1.9} aria-hidden /> Model confidence
            threshold
          </h2>
          <p className="mc-card-sub">
            An assessment the model is less sure of than this is flagged for a
            clinician to look again — whatever risk level it landed on.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mc-card-body">
        <div className="mc-pairs" style={{ marginBottom: 16 }}>
          <Pair label="Currently in use" value={`${effectivePercent}%`} />
          <Pair
            label="Source"
            value={
              hasOverride
                ? `${org.name}'s own setting`
                : "Platform default (this hospital has not set one)"
            }
          />
        </div>

        <div>
          <label className="mc-label" htmlFor="confidence_threshold">
            Threshold <span className="mc-unit">(%)</span>
          </label>
          <input
            id="confidence_threshold"
            className="mc-input"
            type="number"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        {update.isError && (
          <p className="mc-alert mc-alert-error">
            {update.error instanceof Error
              ? update.error.message
              : "Could not save this threshold."}
          </p>
        )}
        {update.isSuccess && !update.isPending && (
          <p className="mc-alert mc-alert-success">Threshold saved.</p>
        )}

        <div className="mc-row-actions" style={{ marginTop: 14 }}>
          <button type="submit" className="mc-btn" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save threshold"}
          </button>
          {hasOverride && (
            <button
              type="button"
              className="mc-btn-ghost"
              disabled={update.isPending}
              // Clearing is not the same as setting the default's current
              // number: it follows the platform default from now on, including
              // any later change to it.
              onClick={() => update.mutate(null)}
            >
              Follow the platform default instead
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

/** Matches the dashboard's own pair renderer. The label and value are block
 *  elements: as spans they sit on one line and read as "EMAILyou@example.com". */
function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mc-pair-label">{label}</div>
      <div className="mc-pair-value">{value || "—"}</div>
    </div>
  );
}
