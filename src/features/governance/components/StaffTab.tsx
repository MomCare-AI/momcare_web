"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Power,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import { usePortal } from "@/app/(portal)/dashboard/layout";
import { SessionExpiredError } from "@/core/api/authFetch";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import {
  useCreateStaff,
  useDeactivateStaff,
  useReactivateStaff,
  useStaffAssignmentStatus,
  useStaffList,
  type CreateStaffInput,
} from "@/features/staff/hooks/useStaff";
import { StaffCredentialsPanel } from "@/features/staff/components/StaffCredentialsPanel";
import { useLocations } from "@/features/locations/hooks/useLocations";

const ROLES = [
  { code: "provider", label: "Doctor / Provider" },
  { code: "nurse", label: "Nurse" },
  { code: "care_manager", label: "Care manager" },
  { code: "hospital_admin", label: "Hospital admin" },
];

const EMPTY_FORM: CreateStaffInput = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role_code: "provider",
  locations: [],
};

export function StaffTab() {
  const { isHospitalAdmin, user, refresh } = usePortal();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateStaffInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const staffQuery = useStaffList();
  const locationsQuery = useLocations();
  const createStaff = useCreateStaff();
  const deactivateStaff = useDeactivateStaff();
  const reactivateStaff = useReactivateStaff();

  const staff = staffQuery.data ?? [];
  const locations = locationsQuery.data?.results ?? [];
  const submitting = createStaff.isPending;
  const needsLocations = form.role_code !== "hospital_admin";

  // A failed request must not render as "no staff yet" — an empty team and a
  // broken server look identical to the user otherwise, which is a bad failure
  // mode in clinical software.
  const loadFailed = staffQuery.isError;
  const error =
    staffQuery.error && !(staffQuery.error instanceof SessionExpiredError)
      ? staffQuery.error instanceof Error
        ? staffQuery.error.message
        : "Could not load your team."
      : null;

  useEffect(() => {
    if (staffQuery.error instanceof SessionExpiredError)
      router.replace("/login");
  }, [staffQuery.error, router]);

  // The shell shows the staff count, so it refetches once the team is known.
  useEffect(() => {
    if (!staffQuery.isPending) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff.length]);

  const toggleLocation = (id: string) => {
    setForm((f) => ({
      ...f,
      locations: f.locations.includes(id)
        ? f.locations.filter((l) => l !== id)
        : [...f.locations, id],
    }));
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createStaff.mutateAsync({
        ...form,
        locations: needsLocations ? form.locations : [],
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.replace("/login");
        return;
      }
      setFormError(
        err instanceof Error ? err.message : "Could not reach the server."
      );
    }
  };

  if (staffQuery.isPending)
    return (
      <Card>
        <div className="mc-rows">
          <RowSkeleton count={5} variant="plain" />
        </div>
      </Card>
    );

  return (
    <>
      <div className="mc-head">
        <div>
          <p className="mc-sub">
            {staff.length} {staff.length === 1 ? "person" : "people"} on your
            clinical team
          </p>
        </div>
        {isHospitalAdmin && (
          <button className="mc-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <X size={15} strokeWidth={2} />
            ) : (
              <UserPlus size={15} strokeWidth={2} />
            )}
            {showForm ? "Cancel" : "Add staff"}
          </button>
        )}
      </div>

      {error && (
        <p className="mc-alert mc-alert-error">
          <AlertCircle size={15} strokeWidth={2} aria-hidden />
          {error}
        </p>
      )}

      {isHospitalAdmin && showForm && (
        <Card style={{ marginBottom: 18 }}>
          <CardHeader>
            <div>
              <div className="mc-card-title">Add a team member</div>
              <div className="mc-card-sub">
                Their account is created right away — a one-time link to set
                their own password is emailed to them.
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={submitCreate}>
              <div className="mc-formgrid">
                <div>
                  <label className="mc-label" htmlFor="staff-email">
                    Email address <span className="mc-req">*</span>
                  </label>
                  <input
                    id="staff-email"
                    className="mc-input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="doctor@yourhospital.pk"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="staff-role">
                    Role <span className="mc-req">*</span>
                  </label>
                  <select
                    id="staff-role"
                    className="mc-input"
                    value={form.role_code}
                    onChange={(e) =>
                      setForm({ ...form, role_code: e.target.value })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mc-label" htmlFor="staff-first">
                    First name
                  </label>
                  <input
                    id="staff-first"
                    className="mc-input"
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="staff-last">
                    Last name
                  </label>
                  <input
                    id="staff-last"
                    className="mc-input"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="staff-phone">
                    Phone
                  </label>
                  <input
                    id="staff-phone"
                    className="mc-input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              {needsLocations && (
                <div style={{ marginTop: 14 }}>
                  <div className="mc-label">
                    Locations <span className="mc-req">*</span>
                  </div>
                  {locations.length === 0 ? (
                    <p className="mc-hint">
                      No locations recorded yet — add one under System
                      Governance &rarr; Locations first.
                    </p>
                  ) : (
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      {locations.map((loc) => (
                        <label
                          key={loc.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13.5,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.locations.includes(loc.id)}
                            onChange={() => toggleLocation(loc.id)}
                          />
                          {loc.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formError && (
                <p
                  className="mc-alert mc-alert-error"
                  style={{ marginTop: 12 }}
                >
                  <AlertCircle size={15} strokeWidth={2} aria-hidden />
                  {formError}
                </p>
              )}
              <button
                type="submit"
                className="mc-btn"
                style={{ marginTop: 14 }}
                disabled={submitting}
              >
                <UserPlus size={15} strokeWidth={2} aria-hidden />
                {submitting ? "Creating…" : "Create account"}
              </button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">Clinical team</div>
            <div className="mc-card-sub">
              Everyone with access to this hospital
            </div>
          </div>
        </CardHeader>
        {loadFailed ? (
          <EmptyState
            icon={<AlertCircle size={20} strokeWidth={1.9} aria-hidden />}
            title="Couldn't load your team"
            text="This is a problem reaching the server, not an empty team — your staff records are unaffected."
            actions={
              <button className="mc-btn" onClick={() => staffQuery.refetch()}>
                Try again
              </button>
            }
          />
        ) : staff.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={20} strokeWidth={1.9} aria-hidden />}
            title="No doctors yet"
            text={
              isHospitalAdmin
                ? "Your clinical team hasn't been added yet. Add doctors and staff to start managing your hospital."
                : "No team members have been added yet."
            }
            actions={
              isHospitalAdmin && (
                <button className="mc-btn" onClick={() => setShowForm(true)}>
                  <UserPlus size={15} strokeWidth={2} aria-hidden />
                  Add staff
                </button>
              )
            }
          />
        ) : (
          <div className="mc-rows">
            {staff.map((m, index) => {
              const isSelf = m.id === user.staff_id;
              const expanded = expandedId === m.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(index, 8) * 0.03,
                  }}
                >
                  <button
                    type="button"
                    className="mc-row"
                    style={{
                      width: "100%",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      font: "inherit",
                    }}
                    onClick={() => setExpandedId(expanded ? null : m.id)}
                    aria-expanded={expanded}
                  >
                    <InitialsAvatar name={m.full_name || m.email} />
                    <div className="mc-row-main">
                      <div className="mc-row-title">
                        {m.full_name || m.email}
                        {isSelf && (
                          <span
                            className="mc-badge mc-badge-info"
                            style={{ marginLeft: 8 }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <div className="mc-row-meta">
                        {m.email} · {m.employee_id}
                        {m.specialty && ` · ${m.specialty}`}
                      </div>
                    </div>
                    <span className="mc-badge mc-badge-neutral">
                      {m.role_name}
                    </span>
                    {!m.is_active ? (
                      <span className="mc-badge mc-badge-high">
                        <AlertCircle size={12} strokeWidth={2.2} aria-hidden />
                        Deactivated
                      </span>
                    ) : (
                      !m.has_activated && (
                        <span className="mc-badge mc-badge-moderate">
                          Pending activation
                        </span>
                      )
                    )}
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      aria-hidden
                      style={{
                        transform: expanded ? "rotate(180deg)" : undefined,
                        transition: "transform 0.15s ease",
                      }}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "0 4px 14px" }}>
                          <StaffCredentialsPanel
                            member={m}
                            canEdit={isHospitalAdmin || isSelf}
                          />

                          {isHospitalAdmin && !isSelf && (
                            <EmploymentStatus
                              staffId={m.id}
                              isActive={m.is_active}
                              deactivating={deactivatingId === m.id}
                              onStartDeactivate={() => setDeactivatingId(m.id)}
                              onCancelDeactivate={() => setDeactivatingId(null)}
                              deactivateStaff={deactivateStaff}
                              reactivateStaff={reactivateStaff}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function EmploymentStatus({
  staffId,
  isActive,
  deactivating,
  onStartDeactivate,
  onCancelDeactivate,
  deactivateStaff,
  reactivateStaff,
}: {
  staffId: string;
  isActive: boolean;
  deactivating: boolean;
  onStartDeactivate: () => void;
  onCancelDeactivate: () => void;
  deactivateStaff: ReturnType<typeof useDeactivateStaff>;
  reactivateStaff: ReturnType<typeof useReactivateStaff>;
}) {
  const statusQuery = useStaffAssignmentStatus(deactivating ? staffId : null);

  return (
    <div
      className="mc-card"
      style={{ padding: 14, marginTop: 14, background: "var(--c-ground)" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="mc-pair-label">Employment status</span>
        {!isActive ? (
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            disabled={reactivateStaff.isPending}
            onClick={() => reactivateStaff.mutate(staffId)}
          >
            <Power size={13} strokeWidth={2.2} aria-hidden />
            {reactivateStaff.isPending ? "Reactivating…" : "Reactivate"}
          </button>
        ) : !deactivating ? (
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm mc-btn-danger"
            onClick={onStartDeactivate}
          >
            <Power size={13} strokeWidth={2.2} aria-hidden />
            Deactivate
          </button>
        ) : null}
      </div>

      {deactivating && (
        <div style={{ marginTop: 10 }}>
          {statusQuery.isPending && (
            <p className="mc-hint">Checking their current patients…</p>
          )}
          {statusQuery.isSuccess && statusQuery.data.has_active_patients && (
            <p
              className="mc-alert mc-alert-notice"
              style={{ marginBottom: 10 }}
            >
              <AlertTriangle size={15} strokeWidth={2} aria-hidden />
              {statusQuery.data.message}
            </p>
          )}
          {deactivateStaff.isError && (
            <p className="mc-alert mc-alert-error" style={{ marginBottom: 10 }}>
              {deactivateStaff.error instanceof Error
                ? deactivateStaff.error.message
                : "Could not deactivate this person."}
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={onCancelDeactivate}
              disabled={deactivateStaff.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              style={{ background: "var(--c-high)" }}
              disabled={deactivateStaff.isPending || statusQuery.isPending}
              onClick={() =>
                deactivateStaff.mutate(
                  { staffId },
                  { onSuccess: onCancelDeactivate }
                )
              }
            >
              {deactivateStaff.isPending
                ? "Deactivating…"
                : "Confirm deactivate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
