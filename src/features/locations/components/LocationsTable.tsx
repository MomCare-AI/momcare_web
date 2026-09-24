"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, Search } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Select } from "@/shared/ui/Select";
import { SortableHeader, type SortDirection } from "@/shared/ui/SortableHeader";
import { LocationActionMenu } from "./LocationActionMenu";
import type { Location } from "../types";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All statuses" },
];

type SortKey = "name" | "patients" | "created";

interface Props {
  locations: Location[];
  canAddLocation: boolean;
  onAddLocation: () => void;
}

export function LocationsTable({
  locations,
  canAddLocation,
  onAddLocation,
}: Props) {
  const { isHospitalAdmin, user } = usePortal();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
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
    const byStatus =
      statusFilter === "all"
        ? locations
        : locations.filter((l) =>
            statusFilter === "active" ? l.is_active : !l.is_active
          );

    const q = search.trim().toLowerCase();
    const filtered = q
      ? byStatus.filter((l) =>
          [l.name, l.address_line1, l.city, l.country]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : byStatus;

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
  }, [locations, search, statusFilter, sort]);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          padding: "14px 20px 0",
        }}
      >
        <div style={{ position: "relative", maxWidth: 340, flex: 1 }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 150 }}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              placeholder="Status"
              aria-label="Filter by status"
            />
          </div>
          {canAddLocation && (
            <button className="mc-btn" onClick={onAddLocation}>
              <Plus size={15} strokeWidth={2} aria-hidden />
              Add location
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "20px" }}>
          <EmptyState
            icon={<MapPin size={20} strokeWidth={1.9} aria-hidden />}
            title={
              locations.length === 0
                ? "No locations recorded"
                : "No locations match"
            }
            text={
              locations.length === 0
                ? "Sites will appear here once they're added."
                : "Try a different search term or status filter."
            }
          />
        </div>
      ) : (
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((location) => {
                const canManage =
                  isHospitalAdmin || location.location_manager === user.id;

                return (
                  <tr key={location.id} className="mc-dtable-row">
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
                        <LocationActionMenu
                          location={location}
                          isHospitalAdmin={isHospitalAdmin}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
