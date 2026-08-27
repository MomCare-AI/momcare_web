"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Plus, Radio, Watch } from "lucide-react";

import {
  useDevices,
  useRegisterDevice,
} from "@/features/monitoring/hooks/useMonitoring";
import type { Device } from "@/features/monitoring/types";

/**
 * The hospital's stock of wearable bands — who has one, and who does not.
 *
 * Assigning a band is done from the patient's own page, where the pregnancy is
 * already on screen; this page is inventory, not the assignment flow. Its job
 * is the question inventory answers — how many bands exist, how many are on a
 * wrist right now, and which ones are broken or missing.
 */

const GROUPS = [
  { key: "assigned" as const, label: "Assigned" },
  { key: "in_stock" as const, label: "In stock" },
  { key: "attention" as const, label: "Needs attention" },
];

function groupOf(device: Device): (typeof GROUPS)[number]["key"] {
  if (device.status === "assigned") return "assigned";
  if (device.status === "in_stock") return "in_stock";
  return "attention"; // faulty, lost, returned — all need a human decision
}

export default function DevicesPage() {
  const [tab, setTab] = useState<(typeof GROUPS)[number]["key"]>("assigned");
  const [showForm, setShowForm] = useState(false);

  const devices = useDevices();
  const rows = devices.data ?? [];
  const grouped = rows.filter((d) => groupOf(d) === tab);
  const counts = Object.fromEntries(
    GROUPS.map((g) => [g.key, rows.filter((d) => groupOf(d) === g.key).length])
  );

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">Devices</h1>
          <p className="mc-sub">
            The wearable bands this hospital holds, and who is wearing one.
          </p>
        </div>
        <div className="mc-head-aside">
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={14} strokeWidth={2.2} aria-hidden />
            Register device
          </button>
        </div>
      </div>

      {showForm && <RegisterForm onDone={() => setShowForm(false)} />}

      <div className="mc-tabs" role="tablist" aria-label="Filter by status">
        {GROUPS.map((g) => {
          const active = g.key === tab;
          return (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className="mc-tab"
              onClick={() => setTab(g.key)}
            >
              {g.label}
              <span className="mc-tab-count">{counts[g.key] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {devices.isPending && <div className="mc-empty">Loading devices…</div>}

      {devices.isError && (
        <div className="mc-empty">
          <span className="mc-empty-title">Devices unavailable</span>
          <span className="mc-empty-text">
            This is not a statement that no device exists — the list could not
            be loaded. Refresh to try again.
          </span>
        </div>
      )}

      {devices.isSuccess && grouped.length === 0 && (
        <div className="mc-empty">
          <span className="mc-empty-icon">
            <Watch size={20} strokeWidth={1.9} aria-hidden />
          </span>
          <span className="mc-empty-title">
            {tab === "assigned"
              ? "No band is currently assigned"
              : tab === "in_stock"
                ? "Nothing waiting in stock"
                : "Nothing needs attention"}
          </span>
          <span className="mc-empty-text">
            {tab === "in_stock"
              ? "Register a device to add it to the hospital's stock."
              : "Devices move here as their status changes."}
          </span>
        </div>
      )}

      <div className="mc-alertlist">
        {grouped.map((device, index) => (
          <DeviceRow key={device.id} device={device} index={index} />
        ))}
      </div>
    </>
  );
}

function DeviceRow({ device, index }: { device: Device; index: number }) {
  return (
    <motion.div
      className="mc-alertrow"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
    >
      <div className="mc-alertrow-head" style={{ cursor: "default" }}>
        <div className="mc-alertrow-main">
          <div className="mc-alertrow-top">
            <span className="mc-alertrow-name">
              <Radio size={14} strokeWidth={2} aria-hidden />{" "}
              {device.serial_number}
            </span>
            <span
              className={`mc-badge ${
                device.status === "assigned"
                  ? "mc-badge-stable"
                  : device.status === "in_stock"
                    ? "mc-badge-info"
                    : "mc-badge-critical"
              }`}
            >
              {device.status_display}
            </span>
          </div>
          {device.notes && (
            <div className="mc-alertrow-reasons">
              <span>{device.notes}</span>
            </div>
          )}
        </div>

        <div className="mc-alertrow-meta">
          {device.is_assigned ? (
            <>
              <span>{device.wearer_name}</span>
              {device.assigned_pregnancy && (
                <Link
                  href={`/dashboard/patients/${device.assigned_pregnancy}`}
                  className="mc-row-link"
                >
                  Open patient
                </Link>
              )}
            </>
          ) : (
            <span>{device.acquisition_display || "Not yet assigned"}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const register = useRegisterDevice();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Read the field directly rather than through React state — consistent
    // with the rest of the portal's forms, and correct even if a serial is
    // ever pasted from a scanner that fires no keystroke events.
    const serial = String(
      new FormData(e.currentTarget).get("serial") ?? ""
    ).trim();
    if (!serial) return;
    register.mutate(serial, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="mc-card" style={{ padding: 20 }}>
      <div className="mc-formgrid">
        <div>
          <label className="mc-label" htmlFor="serial">
            Serial number
          </label>
          <input
            id="serial"
            name="serial"
            className="mc-input"
            placeholder="e.g. MC-2026-0413"
            autoFocus
            required
          />
        </div>
      </div>
      {register.error && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {(register.error as Error).message}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="submit"
          className="mc-btn mc-btn-sm"
          disabled={register.isPending}
        >
          {register.isPending ? "Registering…" : "Add to stock"}
        </button>
        <button
          type="button"
          className="mc-btn mc-btn-ghost mc-btn-sm"
          onClick={onDone}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
