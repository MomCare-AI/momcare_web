"use client";

import { useState } from "react";
import { AlertCircle, ClipboardCheck } from "lucide-react";

import { formatDateTime } from "@/shared/lib/formatDateTime";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import {
  usePreference,
  usePreferenceActions,
  usePreferences,
} from "@/features/care-plans/hooks/usePreferences";
import type {
  CarePlanPreference,
  PreferenceStatus,
} from "@/features/care-plans/types";

const STATUSES: { value: PreferenceStatus; label: string }[] = [
  { value: "suggested", label: "Suggested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Inactive" },
];

const BADGE: Record<PreferenceStatus, string> = {
  suggested: "mc-badge-info",
  approved: "mc-badge-stable",
  rejected: "mc-badge-neutral",
  inactive: "mc-badge-neutral",
};

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "Asia · Trimester 2 · Nutrition" — what the preference applies to. */
function scopeOf(p: CarePlanPreference): string {
  return [
    cap(p.region),
    p.trimester ? `Trimester ${p.trimester}` : null,
    cap(p.section),
  ]
    .filter(Boolean)
    .join(" · ");
}

const staffCount = (p: CarePlanPreference) =>
  Array.isArray(p.supporting_staff)
    ? p.supporting_staff.length
    : p.supporting_staff;

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : null;

/**
 * Hospital settings -> Care plan preferences (hospital admin only).
 *
 * When three different staff members make the same correction to a care plan,
 * the system suggests a hospital-wide preference. The admin approves or
 * rejects it; an approved one is passed to the AI for this hospital's future
 * plans. It is per hospital and never shared.
 */
export function CarePlanPreferencesTab() {
  const [status, setStatus] = useState<PreferenceStatus>("suggested");
  const [openId, setOpenId] = useState<string | null>(null);
  const query = usePreferences(status);

  const rows = query.data?.results ?? [];

  return (
    <>
      <Card>
        <div className="mc-table-toolbar">
          <div>
            <div className="mc-card-title">Care plan preferences</div>
            <div className="mc-card-sub">
              Corrections three or more staff made the same way. Approve one and
              the AI follows it in this hospital&rsquo;s future plans.
            </div>
          </div>
          <div className="mc-segmented" role="group" aria-label="Status">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                className="mc-segment"
                aria-pressed={status === s.value}
                onClick={() => setStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {query.isPending && (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={3} variant="plain" />
            </div>
          </CardBody>
        )}

        {query.isError && (
          <EmptyState
            icon={<ClipboardCheck size={20} strokeWidth={1.9} aria-hidden />}
            title="Preferences could not be loaded"
            text="This is a problem reaching the server, not a statement that there are none."
            actions={
              <button className="mc-btn" onClick={() => query.refetch()}>
                Try again
              </button>
            }
          />
        )}

        {query.isSuccess && rows.length === 0 && (
          <EmptyState
            icon={<ClipboardCheck size={20} strokeWidth={1.9} aria-hidden />}
            title={`No ${status} preferences`}
            text={
              status === "suggested"
                ? "A preference is suggested once three different staff members make the same correction to a care plan."
                : "Nothing has been moved here yet."
            }
          />
        )}

        {query.isSuccess && rows.length > 0 && (
          <div className="mc-rows">
            {rows.map((p) => (
              <button
                key={p.id}
                type="button"
                className="mc-row"
                onClick={() => setOpenId(p.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <div className="mc-row-main">
                  <div className="mc-row-title">{scopeOf(p)}</div>
                  <div className="mc-row-meta">
                    {p.guidance || "No guidance wording yet"}
                  </div>
                  <div className="mc-row-meta">
                    Suggested by {staffCount(p)} staff ·{" "}
                    {formatDateTime(p.created_at)}
                  </div>
                </div>
                <span className={`mc-badge ${BADGE[p.status]}`}>
                  {cap(p.status)}
                </span>
              </button>
            ))}
          </div>
        )}

        {query.isSuccess && query.data.count > rows.length && (
          <p className="mc-hint" style={{ padding: "0 20px 14px" }}>
            Showing the first {rows.length} of {query.data.count}.
          </p>
        )}
      </Card>

      {openId && (
        <PreferenceDetail id={openId} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

function PreferenceDetail({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const query = usePreference(id);
  const actions = usePreferenceActions();
  const pref = query.data;

  return (
    <Modal
      open
      onClose={onClose}
      title="Care plan preference"
      subtitle={pref ? scopeOf(pref) : undefined}
    >
      {query.isPending && <RowSkeleton count={2} variant="plain" />}

      {query.isError && (
        <p className="mc-alert mc-alert-error" role="alert">
          <AlertCircle size={14} strokeWidth={2} aria-hidden />
          {messageOf(query.error) ?? "Could not load this preference."}
        </p>
      )}

      {pref && (
        // Keyed by id and status so the text box restarts from the saved
        // wording whenever the preference changes underneath it.
        <PreferenceForm
          key={`${pref.id}-${pref.status}-${pref.guidance}`}
          pref={pref}
          actions={actions}
          onDone={onClose}
        />
      )}
    </Modal>
  );
}

function PreferenceForm({
  pref,
  actions,
  onDone,
}: {
  pref: CarePlanPreference;
  actions: ReturnType<typeof usePreferenceActions>;
  onDone: () => void;
}) {
  const [guidance, setGuidance] = useState(pref.guidance);
  const suggested = pref.status === "suggested";
  const changed = guidance.trim() !== pref.guidance;

  const writes = Object.values(actions);
  const busy = writes.some((a) => a.isPending);
  const error = messageOf(writes.find((a) => a.isError)?.error);
  const reset = () => writes.forEach((a) => a.reset());

  const replacements = pref.replacements.filter(
    (r): r is string => typeof r === "string" && r.trim() !== ""
  );

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <span className={`mc-badge ${BADGE[pref.status]}`}>
          {cap(pref.status)}
        </span>
        <p className="mc-hint" style={{ margin: "8px 0 0" }}>
          Suggested by {staffCount(pref)} staff ·{" "}
          {formatDateTime(pref.created_at)}
          {pref.decided_by &&
            pref.decided_at &&
            ` · Decided by ${pref.decided_by}, ${formatDateTime(pref.decided_at)}`}
        </p>
      </div>

      <label className="mc-label" htmlFor="pref-guidance">
        Guidance the AI will follow
      </label>
      {suggested ? (
        <textarea
          id="pref-guidance"
          className="mc-input"
          rows={4}
          maxLength={1000}
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
        />
      ) : (
        <p style={{ margin: 0, fontSize: 13.5, whiteSpace: "pre-wrap" }}>
          {pref.guidance || "No guidance wording."}
        </p>
      )}

      {replacements.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="mc-card-sub" style={{ fontWeight: 600 }}>
            Suggested replacements
          </div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13.5 }}>
            {replacements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p
          className="mc-alert mc-alert-error"
          role="alert"
          style={{ marginTop: 12 }}
        >
          <AlertCircle size={14} strokeWidth={2} aria-hidden />
          {error}
        </p>
      )}

      <div className="mc-actions" style={{ marginTop: 16 }}>
        {suggested && (
          <>
            <button
              type="button"
              className="mc-btn"
              disabled={busy || !guidance.trim()}
              onClick={() => {
                reset();
                actions.approve.mutate(
                  {
                    id: pref.id,
                    guidance: changed ? guidance.trim() : undefined,
                  },
                  { onSuccess: onDone }
                );
              }}
            >
              {actions.approve.isPending ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              className="mc-btn-ghost"
              disabled={busy || !changed || !guidance.trim()}
              onClick={() => {
                reset();
                actions.saveGuidance.mutate({
                  id: pref.id,
                  guidance: guidance.trim(),
                });
              }}
            >
              {actions.saveGuidance.isPending ? "Saving…" : "Save wording"}
            </button>
            <button
              type="button"
              className="mc-btn-ghost"
              disabled={busy}
              onClick={() => {
                reset();
                actions.reject.mutate(pref.id, { onSuccess: onDone });
              }}
            >
              {actions.reject.isPending ? "Rejecting…" : "Reject"}
            </button>
          </>
        )}
        {pref.status === "approved" && (
          <button
            type="button"
            className="mc-btn-ghost"
            disabled={busy}
            onClick={() => {
              reset();
              actions.deactivate.mutate(pref.id, { onSuccess: onDone });
            }}
          >
            {actions.deactivate.isPending ? "Switching off…" : "Deactivate"}
          </button>
        )}
        <button
          type="button"
          className="mc-btn-ghost"
          disabled={busy}
          onClick={onDone}
        >
          Close
        </button>
      </div>
    </div>
  );
}
