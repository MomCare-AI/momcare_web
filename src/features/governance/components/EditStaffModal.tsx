"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";

import { useLocations } from "@/features/locations/hooks/useLocations";
import {
  useUpdateStaff,
  type StaffMember,
  type StaffUpdateInput,
} from "@/features/staff/hooks/useStaff";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";

const ROLES = [
  { code: "provider", label: "Doctor / Provider" },
  { code: "nurse", label: "Nurse" },
  { code: "care_manager", label: "Care manager" },
  { code: "hospital_admin", label: "Hospital admin" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  member: StaffMember;
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

/**
 * Identity/role/capacity — the admin-managed counterpart to
 * `StaffCredentialsPanel`'s self-reported qualifications, which stays a
 * separate edit surface (row-click to expand), not folded in here.
 *
 * "Patient Maximum Limit" is shown but disabled: `Staff.max_patients` exists
 * on the backend model (it already backs a real capacity check server-side)
 * but `StaffUpdateSerializer` doesn't accept it and no serializer returns
 * it — a concrete backend gap, not a fabricated field. Username is
 * deliberately absent: the backend `CLAUDE.md` states plainly that MomCare
 * collects no username by design ("a handle a rural mother never chose is a
 * worse identifier than the number she has had for years"), so this isn't
 * an oversight to "match the reference" on.
 */
export function EditStaffModal({ open, onClose, member }: Props) {
  const { first, last } = splitName(member.full_name);
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [roleCode, setRoleCode] = useState(member.role_code);
  const [locations, setLocations] = useState<string[]>(member.location_ids);
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const split = splitName(member.full_name);
      setFirstName(split.first);
      setLastName(split.last);
      setPhone(member.phone ?? "");
      setRoleCode(member.role_code);
      setLocations(member.location_ids);
      setError(null);
    }
  }

  const locationsQuery = useLocations();
  const allLocations = locationsQuery.data?.results ?? [];
  const updateStaff = useUpdateStaff();
  const needsLocations = roleCode !== "hospital_admin";

  const toggleLocation = (id: string) => {
    setLocations((ls) =>
      ls.includes(id) ? ls.filter((l) => l !== id) : [...ls, id]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input: StaffUpdateInput = {
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim(),
      phone: phone.trim(),
      role_code: roleCode,
      locations: needsLocations ? locations : [],
    };

    try {
      await updateStaff.mutateAsync({ staffId: member.id, input });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Staff Member"
      subtitle="Update staff details and permissions"
    >
      <form onSubmit={submit}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {member.photo ? (
            <Image
              src={member.photo}
              alt=""
              width={72}
              height={72}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <InitialsAvatar name={member.full_name || member.email} size={72} />
          )}
        </div>

        <div
          className="mc-card-title"
          style={{ fontSize: 12, marginBottom: 12 }}
        >
          PERSONAL INFORMATION
        </div>
        <div className="mc-formgrid">
          <div>
            <label className="mc-label" htmlFor="edit-staff-first">
              First name <span className="mc-req">*</span>
            </label>
            <input
              id="edit-staff-first"
              className="mc-input"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-staff-last">
              Last name
            </label>
            <input
              id="edit-staff-last"
              className="mc-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-staff-phone">
              Phone
            </label>
            <input
              id="edit-staff-phone"
              className="mc-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-staff-email">
              Email (read-only)
            </label>
            <input
              id="edit-staff-email"
              className="mc-input"
              value={member.email}
              disabled
            />
          </div>
        </div>

        <div
          className="mc-card-title"
          style={{ fontSize: 12, marginTop: 20, marginBottom: 12 }}
        >
          ROLE &amp; CAPACITY
        </div>
        <div className="mc-formgrid">
          <div>
            <label className="mc-label" htmlFor="edit-staff-role">
              Role <span className="mc-req">*</span>
            </label>
            <Select
              id="edit-staff-role"
              aria-label="Role"
              value={roleCode}
              onChange={setRoleCode}
              placeholder="Select role"
              options={ROLES.map((r) => ({ value: r.code, label: r.label }))}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="edit-staff-capacity">
              Patient maximum limit
            </label>
            <input
              id="edit-staff-capacity"
              className="mc-input"
              value=""
              placeholder="Not yet available"
              disabled
            />
          </div>
        </div>
        <p className="mc-hint" style={{ marginTop: 6 }}>
          A per-staff capacity limit already exists on the backend model, but
          isn&apos;t exposed on this endpoint yet — showing or editing it here
          needs Ahmed to add it to the staff serializer.
        </p>

        {needsLocations && (
          <div style={{ marginTop: 16 }}>
            <div className="mc-label">
              Locations <span className="mc-req">*</span>
            </div>
            {allLocations.length === 0 ? (
              <p className="mc-hint">No locations recorded yet.</p>
            ) : (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {allLocations.map((loc) => (
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
                      checked={locations.includes(loc.id)}
                      onChange={() => toggleLocation(loc.id)}
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 16 }}>
            <AlertTriangle size={14} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div
          className="mc-card-foot"
          style={{
            padding: "16px 0 0",
            marginTop: 16,
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
            disabled={updateStaff.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={updateStaff.isPending}
          >
            {updateStaff.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
