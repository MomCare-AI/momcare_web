"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";

import {
  useAddCareTeamMember,
  useCareTeam,
  useClinicians,
  useEndCareTeamMembership,
} from "@/features/patients/hooks/usePatients";
import type { CareTeamRole } from "@/features/patients/types";

const ROLE_OPTIONS: { value: CareTeamRole; label: string }[] = [
  { value: "nurse", label: "Nurse" },
  { value: "provider", label: "Provider" },
  { value: "care_manager", label: "Care manager" },
];

/**
 * A pregnancy's care team — supporting members alongside the one lead
 * clinician (`Pregnancy.assigned_staff`, shown here read-only, unchanged and
 * written through the pregnancy endpoints exactly as before).
 *
 * Read is open to any hospital staff. Write (`canWrite`) is a convenience
 * the caller computes from who's logged in and who's currently on this
 * team — the server re-checks the identical rule on every request and is
 * the actual authorization boundary; a stale or wrong `canWrite` here can
 * only ever hide a button, never grant an action the API would refuse.
 */
export function CareTeamPanel({
  patientId,
  pregnancyId,
  leadProviderName,
  leadProviderActive,
  canWrite,
}: {
  patientId: string;
  pregnancyId: string;
  leadProviderName: string;
  leadProviderActive: boolean;
  canWrite: boolean;
}) {
  const teamQuery = useCareTeam(patientId, pregnancyId);
  const cliniciansQuery = useClinicians();
  const addMember = useAddCareTeamMember(patientId, pregnancyId);
  const endMembership = useEndCareTeamMembership(patientId, pregnancyId);

  const [formOpen, setFormOpen] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [role, setRole] = useState<CareTeamRole>("nurse");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const members = (teamQuery.data ?? []).filter((m) => m.is_active);
  const clinicians = cliniciansQuery.data ?? [];

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) return;
    addMember.mutate(
      { staff: staffId, role },
      {
        onSuccess: () => {
          setFormOpen(false);
          setStaffId("");
          setRole("nurse");
        },
      }
    );
  }

  function confirmEnd(membershipId: string) {
    endMembership.mutate(membershipId, {
      onSuccess: () => setConfirmingId(null),
    });
  }

  return (
    <section className="mc-card" style={{ marginTop: 18 }}>
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Care team</div>
          <div className="mc-card-sub">
            Supporting members alongside the lead clinician — never a
            replacement for that assignment.
          </div>
        </div>
        {canWrite && !formOpen && (
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            onClick={() => setFormOpen(true)}
          >
            <UserPlus size={14} strokeWidth={2.2} aria-hidden />
            Add member
          </button>
        )}
      </div>

      <div className="mc-card-body">
        <div className="mc-pair-label">Lead clinician</div>
        <p className="mc-pair-value" style={{ marginBottom: 18 }}>
          {leadProviderName
            ? leadProviderActive
              ? leadProviderName
              : `${leadProviderName} (no longer active)`
            : "Not yet assigned"}
        </p>

        {canWrite && formOpen && (
          <form
            onSubmit={submitAdd}
            className="mc-card"
            style={{
              padding: 14,
              marginBottom: 16,
              background: "var(--c-ground)",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                className="mc-input"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                disabled={cliniciansQuery.isPending}
                style={{ flex: "1 1 220px" }}
                aria-label="Staff member"
              >
                <option value="">Select a staff member…</option>
                {clinicians.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.role_name}
                  </option>
                ))}
              </select>
              <select
                className="mc-input"
                value={role}
                onChange={(e) => setRole(e.target.value as CareTeamRole)}
                style={{ flex: "0 1 160px" }}
                aria-label="Role on this care team"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {addMember.isError && (
              <p
                className="mc-hint"
                style={{ color: "var(--c-high)", marginTop: 8 }}
              >
                {addMember.error instanceof Error
                  ? addMember.error.message
                  : "Could not add this member."}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 10,
              }}
            >
              <button
                type="button"
                className="mc-btn-ghost mc-btn-sm"
                onClick={() => setFormOpen(false)}
                disabled={addMember.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="mc-btn mc-btn-sm"
                disabled={addMember.isPending || !staffId}
              >
                {addMember.isPending ? "Adding…" : "Add to care team"}
              </button>
            </div>
          </form>
        )}

        {teamQuery.isError && (
          <div className="mc-hint">The care team could not be loaded.</div>
        )}

        {teamQuery.isSuccess && members.length === 0 && (
          <div className="mc-empty">
            <span className="mc-empty-icon">
              <Users size={20} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="mc-empty-title">No supporting members yet</span>
            <span className="mc-empty-text">
              {canWrite
                ? "Add a nurse, co-provider or care manager to this pregnancy's team."
                : "Nobody has been added to this pregnancy's care team yet."}
            </span>
          </div>
        )}

        {members.length > 0 && (
          <div className="mc-rows">
            {members.map((m) => (
              <div key={m.id} className="mc-row">
                <div className="mc-row-main">
                  <div className="mc-row-title">{m.staff_name}</div>
                  <div className="mc-row-meta">{m.role_display}</div>
                </div>

                {canWrite &&
                  (confirmingId === m.id ? (
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <span className="mc-hint">Remove from care team?</span>
                      <button
                        type="button"
                        className="mc-btn-ghost mc-btn-sm"
                        onClick={() => setConfirmingId(null)}
                        disabled={endMembership.isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="mc-btn mc-btn-sm"
                        style={{ background: "var(--c-high)" }}
                        onClick={() => confirmEnd(m.id)}
                        disabled={endMembership.isPending}
                      >
                        {endMembership.isPending ? "Ending…" : "Confirm"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mc-btn-ghost mc-btn-sm"
                      onClick={() => setConfirmingId(m.id)}
                    >
                      End
                    </button>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
