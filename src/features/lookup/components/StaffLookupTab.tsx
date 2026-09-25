"use client";

import { useMemo, useState } from "react";
import { Briefcase, Search, UserCheck, UserX } from "lucide-react";

import { useLocations } from "@/features/locations/hooks/useLocations";
import { useStaffList } from "@/features/staff/hooks/useStaff";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { useDebouncedValue } from "../useDebouncedValue";

export function StaffLookupTab() {
  const staffQuery = useStaffList();
  const locationsQuery = useLocations();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const staff = staffQuery.data ?? [];
  const locationNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const loc of locationsQuery.data?.results ?? []) {
      map.set(loc.id, loc.name);
    }
    return map;
  }, [locationsQuery.data]);

  const total = staff.length;
  const activeCount = staff.filter((s) => s.is_active).length;
  const inactiveCount = staff.filter((s) => !s.is_active).length;

  const searching = debouncedSearch.trim().length > 0;
  const rows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return [];
    return staff.filter((s) =>
      [
        s.full_name,
        s.role_name,
        s.email,
        ...s.location_ids.map((id) => locationNames.get(id) ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [staff, debouncedSearch, locationNames]);

  return (
    <>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Total Staff</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <Briefcase size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{total}</span>
          <span className="mc-kpi-foot">Across all locations</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Active Staff</span>
            <span
              className="mc-kpi-icon"
              style={{
                background: "var(--c-stable-soft)",
                color: "var(--c-stable-text)",
              }}
            >
              <UserCheck size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{activeCount}</span>
          <span className="mc-kpi-foot">{inactiveCount} inactive</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Inactive Staff</span>
            <span
              className="mc-kpi-icon"
              style={{
                background: "var(--c-moderate-soft)",
                color: "var(--c-moderate-text)",
              }}
            >
              <UserX size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{inactiveCount}</span>
          <span className="mc-kpi-foot">Across all locations</span>
        </div>
      </section>

      <div className="mc-card">
        <div className="mc-card-head">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="mc-kpi-icon mc-kpi-icon-brand" aria-hidden>
              <Briefcase size={17} strokeWidth={1.9} />
            </span>
            <div>
              <div className="mc-card-title">Find a staff member</div>
              <div className="mc-card-sub">
                Search by name, role, or location.
              </div>
            </div>
          </div>
        </div>
        <div className="mc-card-body">
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              strokeWidth={2}
              aria-hidden
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            />
            <input
              className="mc-input"
              style={{ paddingLeft: 38, background: "var(--c-ground)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Sana, Provider, Islamabad G8 Complex…"
              aria-label="Search staff"
            />
          </div>
        </div>
      </div>

      {!searching && (
        <EmptyState
          icon={<Search size={22} strokeWidth={1.7} aria-hidden />}
          title="Start typing to search for a staff member"
          text="Search by name, role, or location to look up a staff member."
        />
      )}

      {searching && staffQuery.isPending && (
        <div className="mc-rows" style={{ marginTop: 14 }}>
          <RowSkeleton count={4} variant="plain" />
        </div>
      )}

      {searching && staffQuery.isSuccess && rows.length === 0 && (
        <EmptyState
          icon={<Search size={22} strokeWidth={1.7} aria-hidden />}
          title="No staff match"
          text="Try a different name, role, or location."
        />
      )}

      {searching && rows.length > 0 && (
        <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
          <table className="mc-dtable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Location</th>
                <th>Assigned Patients</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="mc-dtable-row">
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <InitialsAvatar name={s.full_name || s.email} size={32} />
                      <div className="mc-dtable-primary">
                        {s.full_name || s.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mc-badge mc-badge-info">
                      {s.role_name}
                    </span>
                  </td>
                  <td>
                    {s.location_ids.length > 0
                      ? s.location_ids
                          .map((id) => locationNames.get(id))
                          .filter(Boolean)
                          .join(", ") || "—"
                      : "—"}
                  </td>
                  <td
                    className="mc-dtable-sub"
                    title="Not yet available — Staff.max_patients exists on the backend model but isn't exposed via the API yet"
                  >
                    —
                  </td>
                  <td>{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
