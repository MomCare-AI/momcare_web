"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AlertCircle, ClipboardCheck, UserRoundPlus } from "lucide-react";

import {
  useJoinRequests,
  useRejectJoinRequest,
} from "@/features/join-requests/hooks/useJoinRequests";
import type {
  JoinRequest,
  JoinRequestStatus,
} from "@/features/join-requests/types";
import { formatDate } from "@/shared/lib/formatDateTime";
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
 * one to take her on. Her profile arrives frozen with the request. Staff
 * "review and enrol": the enrolment form opens pre-filled from it, they add
 * the clinical fields, and saving that form is the approval. Rejecting is
 * the only decision made on this list.
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

function JoinRequestRow({
  request,
  index,
}: {
  request: JoinRequest;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const reject = useRejectJoinRequest();

  const profile = request.profile;
  const address = [
    profile.address_line1,
    profile.address_line2,
    profile.city,
    profile.state,
    profile.postal_code,
    profile.country,
  ]
    .filter(Boolean)
    .join(", ");

  const confirmReject = () => {
    reject.mutate(
      { requestId: request.id, note: note.trim() || undefined },
      { onSuccess: () => setRejecting(false) }
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
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div>
          <div className="mc-row-title">
            {profile.first_name} {profile.last_name}
          </div>
          <div className="mc-row-meta">
            {request.applicant_name || request.applicant_email}
            {request.applicant_email && ` · ${request.applicant_email}`}
            {request.location_name && ` · asked for ${request.location_name}`}
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
              value={formatDate(profile.date_of_birth)}
            />
            <Pair label="Phone" value={profile.phone} />
            <Pair label="National ID" value={profile.national_id} />
            <Pair label="Blood group" value={profile.blood_group} />
            <Pair label="Address" value={address} />
            <Pair
              label="Emergency contact"
              value={[
                profile.emergency_contact_name,
                profile.emergency_contact_phone,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          </div>

          {request.status !== "pending" && request.decision_note && (
            <p className="mc-hint" style={{ marginTop: 14 }}>
              Decision note: {request.decision_note}
            </p>
          )}

          {request.status === "pending" && (
            <div style={{ marginTop: 16 }}>
              {rejecting ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <label className="mc-label" htmlFor={`note-${request.id}`}>
                    Note (optional)
                  </label>
                  <input
                    id={`note-${request.id}`}
                    className="mc-input"
                    maxLength={500}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Why is this being rejected?"
                  />

                  {reject.error && (
                    <p
                      className="mc-alert mc-alert-error"
                      style={{ marginTop: 10 }}
                    >
                      {reject.error instanceof Error
                        ? reject.error.message
                        : "Something went wrong."}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      className="mc-btn-ghost mc-btn-sm"
                      onClick={() => setRejecting(false)}
                      disabled={reject.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="mc-btn mc-btn-sm"
                      style={{ background: "var(--c-high)" }}
                      disabled={reject.isPending}
                      onClick={confirmReject}
                    >
                      {reject.isPending ? "Saving…" : "Confirm reject"}
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
                      setRejecting(true);
                    }}
                  >
                    Reject
                  </button>
                  <Link
                    href={`/dashboard/patients/new?request=${request.id}`}
                    className="mc-btn mc-btn-sm"
                  >
                    <ClipboardCheck size={13} strokeWidth={2.2} aria-hidden />
                    Review and enrol
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
