"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Radio, Search, Watch } from "lucide-react";

import { useDevices } from "@/features/monitoring/hooks/useMonitoring";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { useDebouncedValue } from "../useDebouncedValue";

export function DeviceLookupTab() {
  const devicesQuery = useDevices();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const devices = devicesQuery.data ?? [];
  const total = devices.length;
  const assignedCount = devices.filter((d) => d.is_assigned).length;
  const unassignedCount = total - assignedCount;

  const searching = debouncedSearch.trim().length > 0;
  const rows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return [];
    return devices.filter((d) =>
      [d.serial_number, d.wearer_name, d.status_display]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [devices, debouncedSearch]);

  return (
    <>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Total Devices</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <Watch size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{total}</span>
          <span className="mc-kpi-foot">Across all locations</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Assigned</span>
            <span
              className="mc-kpi-icon"
              style={{
                background: "var(--c-stable-soft)",
                color: "var(--c-stable-text)",
              }}
            >
              <Radio size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{assignedCount}</span>
          <span className="mc-kpi-foot">Currently on a patient</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Unassigned</span>
            <span
              className="mc-kpi-icon"
              style={{
                background: "var(--c-moderate-soft)",
                color: "var(--c-moderate-text)",
              }}
            >
              <Watch size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{unassignedCount}</span>
          <span className="mc-kpi-foot">In stock or needing attention</span>
        </div>
      </section>

      <div className="mc-card">
        <div className="mc-card-head">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="mc-kpi-icon mc-kpi-icon-brand" aria-hidden>
              <Search size={17} strokeWidth={1.9} />
            </span>
            <div>
              <div className="mc-card-title">Find a device</div>
              <div className="mc-card-sub">
                Search by serial number or the patient wearing it.
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
              placeholder="e.g. MC-2026-0413, Ayesha Bibi…"
              aria-label="Search devices"
            />
          </div>
        </div>
      </div>

      {!searching && (
        <EmptyState
          icon={<Search size={22} strokeWidth={1.7} aria-hidden />}
          title="Start typing to search for a device"
          text="Search by serial number or wearer to look up a device."
        />
      )}

      {searching && devicesQuery.isPending && (
        <div className="mc-rows" style={{ marginTop: 14 }}>
          <RowSkeleton count={4} variant="plain" />
        </div>
      )}

      {searching && devicesQuery.isSuccess && rows.length === 0 && (
        <EmptyState
          icon={<Search size={22} strokeWidth={1.7} aria-hidden />}
          title="No devices match"
          text="Try a different serial number or wearer name."
        />
      )}

      {searching && rows.length > 0 && (
        <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
          <table className="mc-dtable">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Acquisition</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="mc-dtable-row">
                  <td>
                    <div className="mc-dtable-primary">
                      <Radio
                        size={13}
                        strokeWidth={2}
                        aria-hidden
                        style={{ marginRight: 6, verticalAlign: -2 }}
                      />
                      {d.serial_number}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`mc-badge ${
                        d.status === "assigned"
                          ? "mc-badge-stable"
                          : d.status === "in_stock"
                            ? "mc-badge-info"
                            : "mc-badge-critical"
                      }`}
                    >
                      {d.status_display}
                    </span>
                  </td>
                  <td>
                    {d.is_assigned ? (
                      <>
                        {d.wearer_name}
                        {d.assigned_pregnancy && (
                          <>
                            {" "}
                            <Link
                              href={`/dashboard/patients/${d.assigned_pregnancy}`}
                              className="mc-row-link"
                            >
                              Open patient
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{d.acquisition_display || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
