"use client";

import { motion } from "motion/react";
import { MapPin, Pencil, Power } from "lucide-react";

import type { Location } from "../types";

/**
 * Renders real rows only — there is currently no way for this to receive any
 * (see `LocationsTab`'s error state), so this exists as the ready-to-go UI
 * for the day `GET /api/locations/` is real, not as something exercised
 * today. Edit/Deactivate are visually present but disabled: those need their
 * own write endpoint, which doesn't exist either.
 */
export function LocationsTable({ locations }: { locations: Location[] }) {
  return (
    <div className="mc-rows">
      {locations.map((location, index) => (
        <motion.div
          key={location.id}
          className="mc-row"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
        >
          <span className="mc-empty-icon" style={{ flexShrink: 0 }}>
            <MapPin size={16} strokeWidth={1.9} aria-hidden />
          </span>
          <div className="mc-row-main">
            <div className="mc-row-title">{location.name}</div>
            <div className="mc-row-meta">
              {[
                location.address_line1,
                location.city,
                location.state,
                location.country,
              ]
                .filter(Boolean)
                .join(", ") || "No address on file"}
            </div>
          </div>
          <span className="mc-badge mc-badge-neutral">
            {location.active_patient_count}{" "}
            {location.active_patient_count === 1 ? "patient" : "patients"}
          </span>
          <span className="mc-row-meta">
            {new Date(location.created_at).toLocaleDateString()}
          </span>
          {!location.is_active && (
            <span className="mc-badge mc-badge-high">Deactivated</span>
          )}
          <div className="mc-row-actions">
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              disabled
              title="Editing a location isn't available yet"
            >
              <Pencil size={13} strokeWidth={2} aria-hidden /> Edit
            </button>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm mc-btn-danger"
              disabled
              title="Deactivating a location isn't available yet"
            >
              <Power size={13} strokeWidth={2} aria-hidden /> Deactivate
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
