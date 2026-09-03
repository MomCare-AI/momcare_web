"use client";

import { useState } from "react";
import Image from "next/image";
import { GraduationCap } from "lucide-react";

import { useUpdateStaffProfile, type StaffMember } from "../hooks/useStaff";

/**
 * A person's credentialing profile — qualification, specialty, registration,
 * years of experience derived from when they started practicing. Self-
 * reported, same as the hospital's own licence fields elsewhere: shown as
 * what was entered, never implied to be independently verified.
 *
 * Read is always available. Write (`canEdit`) is a convenience the caller
 * computes (self, or that person's hospital_admin) — the server re-checks
 * the identical rule on every request and is the actual boundary.
 */
export function StaffCredentialsPanel({
  member,
  canEdit,
}: {
  member: StaffMember;
  canEdit: boolean;
}) {
  const updateProfile = useUpdateStaffProfile();
  const [editing, setEditing] = useState(false);
  const [qualifications, setQualifications] = useState(member.qualifications);
  const [specialty, setSpecialty] = useState(member.specialty);
  const [registrationNumber, setRegistrationNumber] = useState(
    member.registration_number
  );
  const [registrationAuthority, setRegistrationAuthority] = useState(
    member.registration_authority
  );
  const [practicingSince, setPracticingSince] = useState(
    member.practicing_since ?? ""
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  function startEditing() {
    setQualifications(member.qualifications);
    setSpecialty(member.specialty);
    setRegistrationNumber(member.registration_number);
    setRegistrationAuthority(member.registration_authority);
    setPracticingSince(member.practicing_since ?? "");
    setPhotoFile(null);
    setEditing(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate(
      {
        staffId: member.id,
        input: {
          photo: photoFile,
          qualifications,
          specialty,
          registration_number: registrationNumber,
          registration_authority: registrationAuthority,
          practicing_since: practicingSince,
        },
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  const hasAnyDetail =
    member.qualifications ||
    member.specialty ||
    member.registration_number ||
    member.years_of_experience !== null;

  if (editing) {
    return (
      <form onSubmit={submit} className="mc-card" style={{ padding: 16 }}>
        <div className="mc-formgrid">
          <div>
            <label className="mc-label" htmlFor={`qual-${member.id}`}>
              Qualifications
            </label>
            <input
              id={`qual-${member.id}`}
              className="mc-input"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="e.g. MBBS, FCPS (Gynae & Obs)"
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`spec-${member.id}`}>
              Specialty
            </label>
            <input
              id={`spec-${member.id}`}
              className="mc-input"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Obstetrics & Gynaecology"
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`regno-${member.id}`}>
              Registration number
            </label>
            <input
              id={`regno-${member.id}`}
              className="mc-input"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. PMDC-12345"
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`regauth-${member.id}`}>
              Registering authority
            </label>
            <input
              id={`regauth-${member.id}`}
              className="mc-input"
              value={registrationAuthority}
              onChange={(e) => setRegistrationAuthority(e.target.value)}
              placeholder="e.g. PMDC, Pakistan Nursing Council"
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`since-${member.id}`}>
              Practicing since
            </label>
            <input
              id={`since-${member.id}`}
              className="mc-input"
              type="date"
              value={practicingSince}
              onChange={(e) => setPracticingSince(e.target.value)}
            />
          </div>
          <div>
            <label className="mc-label" htmlFor={`photo-${member.id}`}>
              Photo
            </label>
            <input
              id={`photo-${member.id}`}
              className="mc-input"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {updateProfile.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 10 }}>
            {updateProfile.error instanceof Error
              ? updateProfile.error.message
              : "Could not save this profile."}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            onClick={() => setEditing(false)}
            disabled={updateProfile.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn mc-btn-sm"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className="mc-card"
      style={{
        padding: 16,
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      {member.photo ? (
        <Image
          src={member.photo}
          alt=""
          width={56}
          height={56}
          style={{ borderRadius: 12, objectFit: "cover", flex: "none" }}
        />
      ) : (
        <span
          className="mc-empty-icon"
          style={{ width: 56, height: 56, flex: "none" }}
          aria-hidden
        >
          <GraduationCap size={22} strokeWidth={1.9} />
        </span>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {hasAnyDetail ? (
          <div className="mc-pairs">
            {member.qualifications && (
              <Pair label="Qualifications" value={member.qualifications} />
            )}
            {member.specialty && (
              <Pair label="Specialty" value={member.specialty} />
            )}
            {member.registration_number && (
              <Pair
                label="Registration"
                value={[
                  member.registration_number,
                  member.registration_authority,
                ]
                  .filter(Boolean)
                  .join(" — ")}
              />
            )}
            {member.years_of_experience !== null && (
              <Pair
                label="Experience"
                value={`${member.years_of_experience} ${member.years_of_experience === 1 ? "year" : "years"}`}
              />
            )}
          </div>
        ) : (
          <p className="mc-hint">
            {canEdit
              ? "No credentialing details added yet."
              : "This person hasn't added their credentialing details yet."}
          </p>
        )}

        {canEdit && (
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            style={{ marginTop: 10 }}
            onClick={startEditing}
          >
            {hasAnyDetail ? "Edit details" : "Add details"}
          </button>
        )}
      </div>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mc-pair-label">{label}</div>
      <div className="mc-pair-value">{value}</div>
    </div>
  );
}
