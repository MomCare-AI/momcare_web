"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Search, Stethoscope, UserPlus, X } from "lucide-react";
import { usePortal } from "@/app/(portal)/dashboard/layout";
import { SessionExpiredError } from "@/core/api/authFetch";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { SortableHeader, type SortDirection } from "@/shared/ui/SortableHeader";
import {
  useCreateStaff,
  useStaffList,
  type CreateStaffInput,
  type StaffMember,
} from "@/features/staff/hooks/useStaff";
import { StaffCredentialsPanel } from "@/features/staff/components/StaffCredentialsPanel";
import { useLocations } from "@/features/locations/hooks/useLocations";
import { StaffActionMenu } from "./StaffActionMenu";

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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sort, setSort] = useState<{
    key: "name" | "role";
    dir: SortDirection;
  }>({ key: "name", dir: "asc" });

  const staffQuery = useStaffList();
  const locationsQuery = useLocations();
  const createStaff = useCreateStaff();

  const staff = staffQuery.data ?? [];
  const locations = locationsQuery.data?.results ?? [];
  const submitting = createStaff.isPending;
  const needsLocations = form.role_code !== "hospital_admin";

  const roleOptions = useMemo(
    () =>
      Array.from(new Set(staff.map((m) => m.role_name)))
        .filter(Boolean)
        .sort(),
    [staff]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = staff;
    if (roleFilter)
      filtered = filtered.filter((m) => m.role_name === roleFilter);
    if (q) {
      filtered = filtered.filter((m) =>
        [m.full_name, m.email, m.phone, m.employee_id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    const dir = sort.dir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      if (sort.key === "role") {
        return a.role_name.localeCompare(b.role_name) * dir;
      }
      return (
        (a.full_name || a.email).localeCompare(b.full_name || b.email) * dir
      );
    });
  }, [staff, search, roleFilter, sort]);

  const toggleSort = (key: "name" | "role") => {
    setSort((s) =>
      s.key !== key
        ? { key, dir: "asc" }
        : { key, dir: s.dir === "asc" ? "desc" : "asc" }
    );
  };

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
          <>
            <div style={{ padding: "14px 20px 0", display: "flex", gap: 10 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                <Search
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.5,
                  }}
                />
                <input
                  className="mc-input"
                  style={{ paddingLeft: 30 }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or phone…"
                  aria-label="Search staff"
                />
              </div>
              <select
                className="mc-input"
                style={{ maxWidth: 180 }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
              >
                <option value="">All Roles</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {isHospitalAdmin && (
                <button
                  className="mc-btn"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setShowForm((v) => !v)}
                >
                  {showForm ? (
                    <X size={15} strokeWidth={2} />
                  ) : (
                    <UserPlus size={15} strokeWidth={2} />
                  )}
                  {showForm ? "Cancel" : "Add staff"}
                </button>
              )}
            </div>

            <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
              <table className="mc-dtable">
                <thead>
                  <tr>
                    <SortableHeader
                      label="Staff Member"
                      direction={sort.key === "name" ? sort.dir : null}
                      onClick={() => toggleSort("name")}
                    />
                    <SortableHeader
                      label="Role"
                      direction={sort.key === "role" ? sort.dir : null}
                      onClick={() => toggleSort("role")}
                    />
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Patients</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <StaffRow
                      key={m.id}
                      member={m}
                      isSelf={m.id === user.staff_id}
                      isHospitalAdmin={isHospitalAdmin}
                      expanded={expandedId === m.id}
                      onToggleExpand={() =>
                        setExpandedId(expandedId === m.id ? null : m.id)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}

function StaffRow({
  member: m,
  isSelf,
  isHospitalAdmin,
  expanded,
  onToggleExpand,
}: {
  member: StaffMember;
  isSelf: boolean;
  isHospitalAdmin: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <Fragment>
      <tr
        className="mc-dtable-row"
        aria-expanded={expanded}
        onClick={onToggleExpand}
      >
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <InitialsAvatar name={m.full_name || m.email} />
            <div>
              <div className="mc-dtable-primary">
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
              <div className="mc-dtable-sub">
                {m.employee_id}
                {m.specialty && ` · ${m.specialty}`}
              </div>
            </div>
          </div>
        </td>
        <td>{m.role_name}</td>
        <td>{m.email}</td>
        <td>{m.phone || "—"}</td>
        <td>
          {!m.is_active ? (
            <span className="mc-badge mc-badge-high">
              <AlertCircle size={12} strokeWidth={2.2} aria-hidden />
              Deactivated
            </span>
          ) : !m.has_activated ? (
            <span className="mc-badge mc-badge-moderate">
              Pending activation
            </span>
          ) : (
            <span className="mc-badge mc-badge-stable">Active</span>
          )}
        </td>
        <td
          className="mc-dtable-sub"
          title="Not yet available — Staff.max_patients exists on the backend model but isn't exposed via the API yet"
        >
          —
        </td>
        <td>
          <StaffActionMenu member={m} />
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {expanded && (
          <tr className="mc-dtable-detail">
            <td colSpan={7}>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                <div className="mc-dtable-detail-inner">
                  <StaffCredentialsPanel
                    member={m}
                    canEdit={isHospitalAdmin || isSelf}
                  />
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </Fragment>
  );
}
