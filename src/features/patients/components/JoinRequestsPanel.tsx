"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, ClipboardCheck, UserRoundPlus } from "lucide-react";

import {
  useApproveJoinRequest,
  useJoinRequests,
  useRejectJoinRequest,
} from "@/features/join-requests/hooks/useJoinRequests";
import type {
  JoinRequest,
  JoinRequestStatus,
} from "@/features/join-requests/types";
import { RISK_FACTORS } from "@/features/patients/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pair } from "@/shared/ui/Pair";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

const FILTERS: { value: JoinRequestStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

/**
 * A woman self-registers in the mobile app with no hospital yet, and asks
 * one to take her on. Approving needs nothing from the hospital — no
 * location, no care team, no MRN, all deliberately excluded from what she
 * can report (core/patients/api/serializers.py::PatientDraftSerializer) —
 * so this is a pure accept/reject decision, not a mini-enrollment form.
 */
export function JoinRequestsPanel() {
  const [filter, setFilter] = useState<JoinRequestStatus | "all">("pending");
  const query = useJoinRequests(filter === "all" ? undefined : filter);

  const rows = query.data?.results ?? [];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            style={
              filter === f.value
                ? { background: "var(--c-ground)", fontWeight: 700 }
                : undefined
            }
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isPending && (
        <div className="mc-rows">
          <RowSkeleton count={3} variant="plain" />
        </div>
      )}

      {query.isError && (
        <EmptyState
          icon={<AlertCircle size={20} strokeWidth={1.9} aria-hidden />}
          title="Couldn't load join requests"
          text="This is a problem reaching the server, not an empty queue. Refresh to try again."
        />
      )}

      {query.isSuccess &&
        (rows.length === 0 ? (
          <EmptyState
            icon={<UserRoundPlus size={20} strokeWidth={1.9} aria-hidden />}
            title={
              filter === "pending"
                ? "Nothing waiting on you"
                : "No requests here"
            }
            text={
              filter === "pending"
                ? "Requests from women registering themselves through the mobile app will appear here."
                : "Try a different filter."
            }
          />
        ) : (
          <div className="mc-rows">
            {rows.map((r, index) => (
              <JoinRequestRow key={r.id} request={r} index={index} />
            ))}
          </div>
        ))}
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function JoinRequestRow({
  request,
  index,
}: {
  request: JoinRequest;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "approve" | "reject" | null
  >(null);
  const approve = useApproveJoinRequest();
  const reject = useRejectJoinRequest();

  const draft = request.draft;
  const presentFactors = RISK_FACTORS.filter(
    ({ field }) => draft[field] && draft[field] !== "unknown"
  );

  const busy = approve.isPending || reject.isPending;
  const error = approve.error ?? reject.error;

  const confirm = (decision: "approve" | "reject") => {
    const mutate = decision === "approve" ? approve.mutate : reject.mutate;
    mutate(
      { requestId: request.id, note: note.trim() || undefined },
      { onSuccess: () => setPendingAction(null) }
    );
  };

  return (
    <motion.div
      className="mc-card"
      style={{ padding: 14, marginBottom: 10 }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <div className="mc-row-title">
            {draft.first_name} {draft.last_name}
          </div>
          <div className="mc-row-meta">
            {request.applicant_name || request.applicant_email}
            {request.applicant_email && ` · ${request.applicant_email}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className={`mc-badge mc-badge-${
              request.status === "pending"
                ? "moderate"
                : request.status === "approved"
                  ? "stable"
                  : request.status === "rejected"
                    ? "high"
                    : "neutral"
            }`}
          >
            {request.status_display}
          </span>
          <span className="mc-row-meta">{formatDate(request.created_at)}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14 }}>
          <div className="mc-pairs">
            <Pair
              label="Date of birth"
              value={formatDate(draft.date_of_birth)}
            />
            <Pair label="Phone" value={draft.phone} />
            <Pair label="CNIC" value={draft.cnic} />
            <Pair label="Blood group" value={draft.blood_group} />
            <Pair
              label="Emergency contact"
              value={[
                draft.emergency_contact_name,
                draft.emergency_contact_phone,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
            <Pair
              label="Pregnancy dating"
              value={
                draft.lmp || draft.edd
                  ? [
                      draft.lmp && `LMP ${formatDate(draft.lmp)}`,
                      draft.edd && `EDD ${formatDate(draft.edd)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "Not reported"
              }
            />
            <Pair
              label="Gravida / Para"
              value={
                draft.gravida != null || draft.para != null
                  ? `G${draft.gravida ?? "?"} P${draft.para ?? "?"}`
                  : ""
              }
            />
          </div>

          {presentFactors.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="mc-pair-label" style={{ marginBottom: 6 }}>
                Reported risk factors
              </div>
              <div className="mc-risklist">
                {presentFactors.map(({ field, label }) => (
                  <div key={field} className="mc-riskrow">
                    <span className="mc-riskrow-label">{label}</span>
                    <span
                      className={`mc-badge mc-badge-${draft[field] === "yes" ? "high" : "stable"}`}
                    >
                      {draft[field] === "yes" ? "Yes" : "No"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request.status !== "pending" && request.decision_note && (
            <p className="mc-hint" style={{ marginTop: 14 }}>
              Decision note: {request.decision_note}
            </p>
          )}

          {request.status === "pending" && (
            <div style={{ marginTop: 16 }}>
              {pendingAction ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <label className="mc-label" htmlFor={`note-${request.id}`}>
                    Note (optional)
                  </label>
                  <input
                    id={`note-${request.id}`}
                    className="mc-input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      pendingAction === "approve"
                        ? "Optional"
                        : "Why is this being rejected?"
                    }
                  />

                  {error && (
                    <p
                      className="mc-alert mc-alert-error"
                      style={{ marginTop: 10 }}
                    >
                      {error instanceof Error
                        ? error.message
                        : "Something went wrong."}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      className="mc-btn-ghost mc-btn-sm"
                      onClick={() => setPendingAction(null)}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="mc-btn mc-btn-sm"
                      style={
                        pendingAction === "reject"
                          ? { background: "var(--c-high)" }
                          : undefined
                      }
                      disabled={busy}
                      onClick={() => confirm(pendingAction)}
                    >
                      {busy
                        ? "Saving…"
                        : pendingAction === "approve"
                          ? "Confirm approve"
                          : "Confirm reject"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", gap: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="mc-btn-ghost mc-btn-sm mc-btn-danger"
                    onClick={() => {
                      setNote("");
                      setPendingAction("reject");
                    }}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="mc-btn mc-btn-sm"
                    onClick={() => {
                      setNote("");
                      setPendingAction("approve");
                    }}
                  >
                    <ClipboardCheck size={13} strokeWidth={2.2} aria-hidden />
                    Approve
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
