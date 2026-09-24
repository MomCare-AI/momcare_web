"use client";

import { Fragment, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ChevronDown, Power, Search } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { useStaffList } from "@/features/staff/hooks/useStaff";
import { SortableHeader, type SortDirection } from "@/shared/ui/SortableHeader";
import {
  useDeactivateLocation,
  useLocationAssignmentStatus,
  useLocations,
  useMoveLocationPatients,
  useReactivateLocation,
  useUpdateLocation,
} from "../hooks/useLocations";
import type { Location, LocationUpdateInput } from "../types";

// Any hospital-side clinical role may be named location_manager — matches
// the backend's own _MANAGER_ROLE_CODES in core/locations/api/serializers.py.
const MANAGER_ROLE_CODES = new Set([
  "hospital_admin",
  "provider",
  "nurse",
  "care_manager",
]);

type SortKey = "name" | "patients" | "created";

export function LocationsTable({ locations }: { locations: Location[] }) {
  const { isHospitalAdmin, user } = usePortal();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDirection }>({
    key: "name",
    dir: "asc",
  });

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key !== key
        ? { key, dir: "asc" }
        : { key, dir: s.dir === "asc" ? "desc" : "asc" }
    );
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? locations.filter((l) =>
          [l.name, l.address_line1, l.city, l.country]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : locations;

    const sorted = [...filtered].sort((a, b) => {
      const dir = sort.dir === "desc" ? -1 : 1;
      if (sort.key === "patients") {
        return (a.active_patient_count - b.active_patient_count) * dir;
      }
      if (sort.key === "created") {
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          dir
        );
      }
      return a.name.localeCompare(b.name) * dir;
    });
    return sorted;
  }, [locations, search, sort]);

  return (
    <>
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ position: "relative", maxWidth: 340 }}>
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
            placeholder="Search by name or address…"
            aria-label="Search locations"
          />
        </div>
      </div>

      <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
        <table className="mc-dtable">
          <thead>
            <tr>
              <SortableHeader
                label="Location"
                direction={sort.key === "name" ? sort.dir : null}
                onClick={() => toggleSort("name")}
              />
              <th>Manager</th>
              <SortableHeader
                label="Patients"
                direction={sort.key === "patients" ? sort.dir : null}
                onClick={() => toggleSort("patients")}
              />
              <SortableHeader
                label="Created"
                direction={sort.key === "created" ? sort.dir : null}
                onClick={() => toggleSort("created")}
              />
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((location) => {
              const canManage =
                isHospitalAdmin || location.location_manager === user.id;
              const expanded = expandedId === location.id;

              return (
                <Fragment key={location.id}>
                  <tr
                    className="mc-dtable-row"
                    aria-expanded={canManage ? expanded : undefined}
                    onClick={() =>
                      canManage && setExpandedId(expanded ? null : location.id)
                    }
                  >
                    <td>
                      <div className="mc-dtable-primary">{location.name}</div>
                      <div className="mc-dtable-sub">
                        {[
                          location.address_line1,
                          location.city,
                          location.state,
                          location.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "No address on file"}
                      </div>
                    </td>
                    <td>{location.location_manager_name || "—"}</td>
                    <td>{location.active_patient_count}</td>
                    <td>
                      {new Date(location.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {location.is_active ? (
                        <span className="mc-badge mc-badge-stable">Active</span>
                      ) : (
                        <span className="mc-badge mc-badge-high">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td>
                      {canManage && (
                        <ChevronDown
                          size={16}
                          strokeWidth={2}
                          aria-hidden
                          style={{
                            transform: expanded ? "rotate(180deg)" : undefined,
                            transition: "transform 0.15s ease",
                          }}
                        />
                      )}
                    </td>
                  </tr>
                  <AnimatePresence initial={false}>
                    {expanded && canManage && (
                      <tr className="mc-dtable-detail">
                        <td colSpan={6}>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div className="mc-dtable-detail-inner">
                              <LocationEditor
                                location={location}
                                isHospitalAdmin={isHospitalAdmin}
                              />
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LocationEditor({
  location,
  isHospitalAdmin,
}: {
  location: Location;
  isHospitalAdmin: boolean;
}) {
  const staffQuery = useStaffList();
  const updateLocation = useUpdateLocation();
  const deactivateLocation = useDeactivateLocation();
  const reactivateLocation = useReactivateLocation();
  const [deactivating, setDeactivating] = useState(false);
  const [saved, setSaved] = useState(false);

  const managers = (staffQuery.data ?? []).filter((m) =>
    MANAGER_ROLE_CODES.has(m.role_code)
  );

  const [form, setForm] = useState<LocationUpdateInput>({
    name: location.name,
    phone: location.phone,
    email: location.email,
    address_line1: location.address_line1,
    address_line2: location.address_line2,
    city: location.city,
    state: location.state,
    postal_code: location.postal_code,
    country: location.country,
    location_manager: location.location_manager ?? "",
  });

  const statusQuery = useLocationAssignmentStatus(
    deactivating ? location.id : null
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    // location_manager rejects "" outright ("This field may not be null.") —
    // it must be omitted to leave the existing manager alone, never sent as
    // an empty string. Only include it when an actual person is selected.
    const { location_manager, ...rest } = form;
    const input = location_manager ? { ...rest, location_manager } : rest;
    updateLocation.mutate(
      { locationId: location.id, input },
      { onSuccess: () => setSaved(true) }
    );
  };

  return (
    <div
      className="mc-card"
      style={{ padding: 14, background: "var(--c-ground)" }}
    >
      <form onSubmit={submit}>
        <div className="mc-formgrid">
          <div>
            <label className="mc-label" htmlFor={`loc-name-${location.id}`}>
              Name <span className="mc-req">*</span>
            </label>
            <input
              id={`loc-name-${location.id}`}
              className="mc-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-manager-${location.id}`}>
              Location manager <span className="mc-req">*</span>
            </label>
            <select
              id={`loc-manager-${location.id}`}
              className="mc-input"
              value={form.location_manager}
              onChange={(e) =>
                setForm({ ...form, location_manager: e.target.value })
              }
            >
              <option value="">Not assigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.user_id}>
                  {m.full_name || m.email} · {m.role_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-phone-${location.id}`}>
              Phone
            </label>
            <input
              id={`loc-phone-${location.id}`}
              className="mc-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-email-${location.id}`}>
              Email
            </label>
            <input
              id={`loc-email-${location.id}`}
              className="mc-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-addr1-${location.id}`}>
              Address line 1
            </label>
            <input
              id={`loc-addr1-${location.id}`}
              className="mc-input"
              value={form.address_line1}
              onChange={(e) =>
                setForm({ ...form, address_line1: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-city-${location.id}`}>
              City
            </label>
            <input
              id={`loc-city-${location.id}`}
              className="mc-input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-state-${location.id}`}>
              State / province
            </label>
            <input
              id={`loc-state-${location.id}`}
              className="mc-input"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-postal-${location.id}`}>
              Postal code
            </label>
            <input
              id={`loc-postal-${location.id}`}
              className="mc-input"
              value={form.postal_code}
              onChange={(e) =>
                setForm({ ...form, postal_code: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`loc-country-${location.id}`}>
              Country
            </label>
            <input
              id={`loc-country-${location.id}`}
              className="mc-input"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>

        {updateLocation.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            {updateLocation.error instanceof Error
              ? updateLocation.error.message
              : "Could not save this location."}
          </p>
        )}
        {saved && !updateLocation.isPending && (
          <p className="mc-alert mc-alert-success" style={{ marginTop: 12 }}>
            Saved.
          </p>
        )}

        <button
          type="submit"
          className="mc-btn mc-btn-sm"
          style={{ marginTop: 12 }}
          disabled={updateLocation.isPending}
        >
          {updateLocation.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: "1px solid var(--c-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="mc-pair-label">Site status</span>
          {!location.is_active ? (
            isHospitalAdmin && (
              <button
                type="button"
                className="mc-btn-ghost mc-btn-sm"
                disabled={reactivateLocation.isPending}
                onClick={() => reactivateLocation.mutate(location.id)}
              >
                <Power size={13} strokeWidth={2.2} aria-hidden />
                {reactivateLocation.isPending ? "Reactivating…" : "Reactivate"}
              </button>
            )
          ) : !deactivating ? (
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm mc-btn-danger"
              onClick={() => setDeactivating(true)}
            >
              <Power size={13} strokeWidth={2.2} aria-hidden />
              Deactivate
            </button>
          ) : null}
        </div>

        {deactivating && (
          <div style={{ marginTop: 10 }}>
            {statusQuery.isPending && (
              <p className="mc-hint">Checking active patients at this site…</p>
            )}
            {statusQuery.isSuccess && statusQuery.data.has_active_patients && (
              <>
                <p
                  className="mc-alert mc-alert-notice"
                  style={{ marginBottom: 10 }}
                >
                  <AlertTriangle size={15} strokeWidth={2} aria-hidden />
                  {statusQuery.data.message}
                </p>
                <MovePatientsControl locationId={location.id} />
              </>
            )}
            {deactivateLocation.isError && (
              <p
                className="mc-alert mc-alert-error"
                style={{ marginBottom: 10 }}
              >
                {deactivateLocation.error instanceof Error
                  ? deactivateLocation.error.message
                  : "Could not deactivate this location."}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="mc-btn-ghost mc-btn-sm"
                onClick={() => setDeactivating(false)}
                disabled={deactivateLocation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mc-btn mc-btn-sm"
                style={{ background: "var(--c-high)" }}
                disabled={
                  deactivateLocation.isPending ||
                  statusQuery.isPending ||
                  statusQuery.data?.has_active_patients
                }
                onClick={() =>
                  deactivateLocation.mutate(
                    { locationId: location.id },
                    { onSuccess: () => setDeactivating(false) }
                  )
                }
              >
                {deactivateLocation.isPending
                  ? "Deactivating…"
                  : "Confirm deactivate"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** The escape hatch for a blocked deactivation — clears the location's
 *  active patients out by moving all of them to another site. Never
 *  triggers deactivation itself; the admin confirms that separately once
 *  this unblocks it. */
function MovePatientsControl({ locationId }: { locationId: string }) {
  const locationsQuery = useLocations();
  const moveLocationPatients = useMoveLocationPatients();
  const [targetId, setTargetId] = useState("");
  const [moved, setMoved] = useState<string | null>(null);

  const targets = (locationsQuery.data?.results ?? []).filter(
    (l) => l.id !== locationId && l.is_active
  );

  if (targets.length === 0) {
    return (
      <p className="mc-hint" style={{ marginBottom: 10 }}>
        There&apos;s no other active location to move these patients to — add
        one first.
      </p>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select
          className="mc-input"
          value={targetId}
          onChange={(e) => {
            setTargetId(e.target.value);
            setMoved(null);
          }}
        >
          <option value="" disabled>
            Move all patients to…
          </option>
          {targets.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="mc-btn-ghost mc-btn-sm"
          disabled={!targetId || moveLocationPatients.isPending}
          onClick={() =>
            moveLocationPatients.mutate(
              { sourceLocationId: locationId, targetLocationId: targetId },
              {
                onSuccess: (detail) => {
                  setMoved(detail);
                  setTargetId("");
                },
              }
            )
          }
        >
          {moveLocationPatients.isPending ? "Moving…" : "Move patients"}
        </button>
      </div>
      {moved && (
        <p className="mc-alert mc-alert-success" style={{ marginTop: 8 }}>
          {moved}
        </p>
      )}
      {moveLocationPatients.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 8 }}>
          {moveLocationPatients.error instanceof Error
            ? moveLocationPatients.error.message
            : "Could not move these patients."}
        </p>
      )}
    </div>
  );
}
