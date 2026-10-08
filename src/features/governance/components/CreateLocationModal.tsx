"use client";

import { useState } from "react";
import {
  checkAddressLine,
  checkEmail,
  checkOrgName,
  checkPhone,
  checkPlace,
  checkPostalCode,
  keepPhone,
  keepPlace,
  keepText,
  useFieldChecks,
} from "@/shared/lib/validation";
import { AlertCircle, Plus } from "lucide-react";

import { useCreateLocation } from "@/features/locations/hooks/useLocations";
import type { LocationCreateInput } from "@/features/locations/types";
import type { StaffMember } from "@/features/staff/hooks/useStaff";
import { Modal } from "@/shared/ui/Modal";

const EMPTY_FORM: LocationCreateInput = {
  name: "",
  location_manager: "",
  timezone: "",
  phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  managers: StaffMember[];
}

/**
 * A "Create Location" popup, adapted from the reference platform's own
 * modal — no Programs (RPM/CCM) section, since MomCare runs one programme
 * (same reasoning as everywhere else this session). Address line 2 and
 * timezone are genuinely real, already-accepted fields on
 * `LocationCreateInput` that the old inline form simply never surfaced —
 * added here rather than left as a gap.
 */
export function CreateLocationModal({ open, onClose, managers }: Props) {
  const createLocation = useCreateLocation();
  const [form, setForm] = useState<LocationCreateInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const checks = useFieldChecks(() => ({
    name: checkOrgName(form.name ?? "", "Location name"),
    addr1: checkAddressLine(form.address_line1 ?? "", "Address line 1", {
      required: false,
    }),
    addr2: checkAddressLine(form.address_line2 ?? "", "Address line 2", {
      required: false,
    }),
    phone: checkPhone(form.phone ?? ""),
    email: checkEmail(form.email ?? "", "Email", { required: false }),
    country: checkPlace(form.country ?? "", "Country", { required: false }),
    state: checkPlace(form.state ?? "", "State / province", {
      required: false,
    }),
    city: checkPlace(form.city ?? "", "City", { required: false }),
    postal: form.postal_code ? checkPostalCode(form.postal_code) : null,
  }));

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(EMPTY_FORM);
      setError(null);
      checks.reset();
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = checks.validateAll();
    if (problem) {
      setError(problem);
      return;
    }
    try {
      await createLocation.mutateAsync(form);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add this location."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Location"
      subtitle="A location manager is required for every site"
    >
      <form onSubmit={submit}>
        <div className="mc-formgrid" style={{ gap: 12, marginBottom: 0 }}>
          <div>
            <label className="mc-label" htmlFor="new-loc-name">
              Location name <span className="mc-req">*</span>
            </label>
            <input
              id="new-loc-name"
              className="mc-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. City General Hospital — East Wing"
              onBlur={() => checks.touch("name")}
            />
            {checks.error("name") && (
              <span className="mc-field-error" role="alert">
                {checks.error("name")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-manager">
              Location manager <span className="mc-req">*</span>
            </label>
            <select
              id="new-loc-manager"
              className="mc-input"
              required
              value={form.location_manager}
              onChange={(e) =>
                setForm({ ...form, location_manager: e.target.value })
              }
            >
              <option value="" disabled>
                Select a staff member
              </option>
              {managers.map((m) => (
                <option key={m.id} value={m.user_id}>
                  {m.full_name || m.email} · {m.role_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-addr1">
              Address line 1
            </label>
            <input
              id="new-loc-addr1"
              className="mc-input"
              value={form.address_line1}
              onChange={(e) =>
                setForm({
                  ...form,
                  address_line1: keepText(e.target.value, 200),
                })
              }
              placeholder="123 Main Street"
              onBlur={() => checks.touch("addr1")}
            />
            {checks.error("addr1") && (
              <span className="mc-field-error" role="alert">
                {checks.error("addr1")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-addr2">
              Address line 2
            </label>
            <input
              id="new-loc-addr2"
              className="mc-input"
              value={form.address_line2}
              onChange={(e) =>
                setForm({
                  ...form,
                  address_line2: keepText(e.target.value, 200),
                })
              }
              placeholder="Suite 200 (optional)"
              onBlur={() => checks.touch("addr2")}
            />
            {checks.error("addr2") && (
              <span className="mc-field-error" role="alert">
                {checks.error("addr2")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-phone">
              Phone
            </label>
            <input
              id="new-loc-phone"
              className="mc-input"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: keepPhone(e.target.value) })
              }
              placeholder="Optional"
              onBlur={() => checks.touch("phone")}
            />
            {checks.error("phone") && (
              <span className="mc-field-error" role="alert">
                {checks.error("phone")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-email">
              Email
            </label>
            <input
              id="new-loc-email"
              className="mc-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Optional"
              onBlur={() => checks.touch("email")}
            />
            {checks.error("email") && (
              <span className="mc-field-error" role="alert">
                {checks.error("email")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-country">
              Country
            </label>
            <input
              id="new-loc-country"
              className="mc-input"
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: keepPlace(e.target.value) })
              }
              placeholder="Optional"
              onBlur={() => checks.touch("country")}
            />
            {checks.error("country") && (
              <span className="mc-field-error" role="alert">
                {checks.error("country")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-state">
              State / province
            </label>
            <input
              id="new-loc-state"
              className="mc-input"
              value={form.state}
              onChange={(e) =>
                setForm({ ...form, state: keepPlace(e.target.value) })
              }
              placeholder="Optional"
              onBlur={() => checks.touch("state")}
            />
            {checks.error("state") && (
              <span className="mc-field-error" role="alert">
                {checks.error("state")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-city">
              City
            </label>
            <input
              id="new-loc-city"
              className="mc-input"
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: keepPlace(e.target.value) })
              }
              placeholder="Optional"
              onBlur={() => checks.touch("city")}
            />
            {checks.error("city") && (
              <span className="mc-field-error" role="alert">
                {checks.error("city")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-postal">
              Postal code
            </label>
            <input
              id="new-loc-postal"
              className="mc-input"
              value={form.postal_code}
              onChange={(e) =>
                setForm({ ...form, postal_code: e.target.value })
              }
              placeholder="Optional"
              onBlur={() => checks.touch("postal")}
            />
            {checks.error("postal") && (
              <span className="mc-field-error" role="alert">
                {checks.error("postal")}
              </span>
            )}
          </div>
          <div>
            <label className="mc-label" htmlFor="new-loc-timezone">
              Timezone
            </label>
            <input
              id="new-loc-timezone"
              className="mc-input"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="e.g. Asia/Karachi"
            />
          </div>
        </div>

        {error && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div
          className="mc-card-foot"
          style={{
            padding: "12px 0 0",
            marginTop: 12,
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
            disabled={createLocation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={createLocation.isPending}
          >
            <Plus size={15} strokeWidth={2} aria-hidden />
            {createLocation.isPending ? "Adding…" : "Add Location"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
