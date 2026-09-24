"use client";

import { useState } from "react";
import { AlertCircle, MapPin, Save } from "lucide-react";

import { useStaffList } from "@/features/staff/hooks/useStaff";
import { Modal } from "@/shared/ui/Modal";
import { useUpdateLocation } from "../hooks/useLocations";
import type { Location, LocationUpdateInput } from "../types";

// Any hospital-side clinical role may be named location_manager — matches
// the backend's own _MANAGER_ROLE_CODES in core/locations/api/serializers.py.
const MANAGER_ROLE_CODES = new Set([
  "hospital_admin",
  "provider",
  "nurse",
  "care_manager",
]);

interface Props {
  open: boolean;
  onClose: () => void;
  location: Location;
}

/** Same field set as `CreateLocationModal`, pre-filled — a popup, matching
 *  the reference platform's own "Edit Location" and the pattern already
 *  used for Staff/Clinical Tags, not the old row-expand form. */
export function EditLocationModal({ open, onClose, location }: Props) {
  const staffQuery = useStaffList();
  const updateLocation = useUpdateLocation();
  const managers = (staffQuery.data ?? []).filter((m) =>
    MANAGER_ROLE_CODES.has(m.role_code)
  );

  const toForm = (): LocationUpdateInput => ({
    name: location.name,
    location_manager: location.location_manager ?? "",
    phone: location.phone,
    email: location.email,
    address_line1: location.address_line1,
    address_line2: location.address_line2,
    city: location.city,
    state: location.state,
    postal_code: location.postal_code,
    country: location.country,
    timezone: location.timezone,
  });

  const [form, setForm] = useState<LocationUpdateInput>(toForm());
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(toForm());
      setError(null);
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // location_manager rejects "" outright ("This field may not be null.")
    // — it must be omitted to leave the existing manager alone, never sent
    // as an empty string. Only include it when an actual person is selected.
    const { location_manager, ...rest } = form;
    const input = location_manager ? { ...rest, location_manager } : rest;
    try {
      await updateLocation.mutateAsync({ locationId: location.id, input });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this location."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Location"
      subtitle="Update this location's details"
      icon={<MapPin size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div className="mc-formgrid" style={{ gap: 12, marginBottom: 0 }}>
          <div>
            <label className="mc-label" htmlFor="edit-loc-name">
              Location name <span className="mc-req">*</span>
            </label>
            <input
              id="edit-loc-name"
              className="mc-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-manager">
              Location manager <span className="mc-req">*</span>
            </label>
            <select
              id="edit-loc-manager"
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
            <label className="mc-label" htmlFor="edit-loc-addr1">
              Address line 1
            </label>
            <input
              id="edit-loc-addr1"
              className="mc-input"
              value={form.address_line1}
              onChange={(e) =>
                setForm({ ...form, address_line1: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-addr2">
              Address line 2
            </label>
            <input
              id="edit-loc-addr2"
              className="mc-input"
              value={form.address_line2}
              onChange={(e) =>
                setForm({ ...form, address_line2: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-phone">
              Phone
            </label>
            <input
              id="edit-loc-phone"
              className="mc-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-email">
              Email
            </label>
            <input
              id="edit-loc-email"
              className="mc-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-country">
              Country
            </label>
            <input
              id="edit-loc-country"
              className="mc-input"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-state">
              State / province
            </label>
            <input
              id="edit-loc-state"
              className="mc-input"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-city">
              City
            </label>
            <input
              id="edit-loc-city"
              className="mc-input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-postal">
              Postal code
            </label>
            <input
              id="edit-loc-postal"
              className="mc-input"
              value={form.postal_code}
              onChange={(e) =>
                setForm({ ...form, postal_code: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-loc-timezone">
              Timezone
            </label>
            <input
              id="edit-loc-timezone"
              className="mc-input"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="e.g. Asia/Karachi"
            />
          </div>
        </div>

        {error && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 16 }}>
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div
          style={{
            background: "var(--c-teal-wash)",
            margin: "20px -20px -20px",
            padding: "14px 20px",
            borderTop: "1px solid var(--c-border-soft)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            className="mc-btn-ghost"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
            disabled={updateLocation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={updateLocation.isPending}
          >
            <Save size={15} strokeWidth={2} aria-hidden />
            {updateLocation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
