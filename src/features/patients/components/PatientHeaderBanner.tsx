"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Home,
  MapPin,
  Pause,
  Pencil,
  Phone,
  Play,
  RotateCcw,
  Save,
  Stethoscope,
  User,
} from "lucide-react";

import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { pregnancyTone, type PatientDetail, type Pregnancy } from "../types";
import { usePatientStatuses } from "../hooks/usePatients";
import { EditAddressModal, formatAddress } from "./EditAddressModal";
import { EditStatusesModal } from "./EditStatusesModal";
import { LogSessionModal } from "./LogSessionModal";
import { PatientStatusPills } from "./PatientStatusPills";
import { formatGestationalAge } from "@/shared/lib/gestation";

function ageFromDob(dob: string | null): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  let age = new Date().getFullYear() - birth.getFullYear();
  const notYetHadBirthday =
    new Date().getMonth() < birth.getMonth() ||
    (new Date().getMonth() === birth.getMonth() &&
      new Date().getDate() < birth.getDate());
  if (notYetHadBirthday) age -= 1;
  return `${Math.max(age, 0)}y`;
}

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

interface Props {
  patient: PatientDetail;
  current: Pregnancy | null;
  /** The live "time on this patient" timer — lifted up to the page itself
   *  so the page-level Back button can check `seconds > 0` and prompt for
   *  a note before navigating away, instead of losing unsaved time
   *  silently. This component still owns the ticking interval and the
   *  Play/Pause/Reset/Save controls; the page just needs to read/reset
   *  the count. */
  seconds: number;
  setSeconds: React.Dispatch<React.SetStateAction<number>>;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  /** Shows the Edit button that opens the statuses popup. Any hospital staff
   *  member may assign statuses; what they may remove is limited inside the
   *  popup itself. */
  canEditStatuses?: boolean;
  /** Shows the pencil that opens the address editor. */
  canEditAddress?: boolean;
  /** True once the page is scrolled well down: the detail rows fold away. */
  scrolled?: boolean;
}

/**
 * The persistent patient banner — mounted once above the tab strip (not
 * inside any `tab === "..."` branch), so its state, especially the live
 * timer below, survives switching tabs, matching the reference platform's
 * own always-visible side panel.
 *
 * Every field here is real data already on `PatientDetail`/`Pregnancy` —
 * nothing invented. Diagnosis/allergy tags, a second program's completion
 * bars, and Message/Call buttons are deliberately absent: MomCare has no
 * diagnosis list, no second program, and no messaging/calling
 * infrastructure at all, not even partially.
 */
export function PatientHeaderBanner({
  patient,
  current,
  seconds,
  setSeconds,
  running,
  setRunning,
  canEditStatuses = false,
  canEditAddress = false,
  scrolled = false,
}: Props) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingStatuses, setEditingStatuses] = useState(false);
  const statusesQuery = usePatientStatuses(patient.id);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, setSeconds]);

  const age = ageFromDob(patient.date_of_birth);
  const address = formatAddress(patient);
  const [editingAddress, setEditingAddress] = useState(false);
  const careTeam = [
    current?.provider_name && `Provider: ${current.provider_name}`,
    current?.care_manager_name && `Care Manager: ${current.care_manager_name}`,
    current?.nurse_name && `Nurse: ${current.nurse_name}`,
  ].filter(Boolean) as string[];

  return (
    <div
      className="mc-hero"
      style={{
        marginBottom: 18,
        padding: scrolled ? "8px 18px" : "12px 18px",
        transition: "padding 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <InitialsAvatar name={patient.full_name} size={38} />
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h1 className="mc-h1" style={{ marginBottom: 0, fontSize: 16 }}>
                {patient.full_name}
              </h1>
              {current && (
                <>
                  <span className="mc-ga" style={{ fontSize: 12 }}>
                    {formatGestationalAge(current.gestational_age_display)}
                  </span>
                  <span
                    className={`mc-badge mc-badge-${pregnancyTone(current.status)}`}
                  >
                    {current.status_display}
                  </span>
                </>
              )}
              <PatientStatusPills
                statuses={statusesQuery.data ?? []}
                max={3}
                size="md"
              />
              {canEditStatuses && (
                <button
                  type="button"
                  className="mc-btn-ghost mc-btn-sm"
                  onClick={() => setEditingStatuses(true)}
                  aria-label="Edit statuses"
                >
                  <Pencil size={12} strokeWidth={2} aria-hidden />
                  Edit
                </button>
              )}
            </div>

            {/* Always visible, even scrolled — the two fields most useful
                to have on screen the whole time a clinician is on this
                record. */}
            <div
              className="mc-sub"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                rowGap: 3,
                columnGap: 14,
                marginTop: 3,
                fontSize: 12,
              }}
            >
              {patient.date_of_birth && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Calendar size={11} strokeWidth={2} aria-hidden />
                  DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                </span>
              )}
              {patient.phone && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Phone size={11} strokeWidth={2} aria-hidden />
                  {patient.phone}
                </span>
              )}
            </div>

            {/* Collapses away once the banner has scrolled under the nav —
                matches the reference platform's own scrolled-header
                behaviour, so the stuck strip reads as a compact summary
                rather than its full resting height. */}
            <div className="mc-hdr-collapse" data-collapsed={scrolled}>
              <div className="mc-hdr-collapse-inner">
                <div
                  className="mc-sub"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    rowGap: 3,
                    columnGap: 14,
                    marginTop: 3,
                    fontSize: 12,
                  }}
                >
                  {[age, patient.gender].filter(Boolean).join(" · ") && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <User size={11} strokeWidth={2} aria-hidden />
                      {[age, patient.gender].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {[patient.mrn, patient.cnic].filter(Boolean).join(" · ") && (
                    <span>
                      {[patient.mrn, patient.cnic].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {patient.location_name && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MapPin size={11} strokeWidth={2} aria-hidden />
                      {patient.location_name}
                    </span>
                  )}
                  {(address || canEditAddress) && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Home size={11} strokeWidth={2} aria-hidden />
                      {address ?? "No address on file"}
                      {canEditAddress && (
                        <button
                          type="button"
                          aria-label={address ? "Edit address" : "Add address"}
                          title={address ? "Edit address" : "Add address"}
                          onClick={() => setEditingAddress(true)}
                          style={{
                            display: "inline-flex",
                            padding: 2,
                            border: "none",
                            background: "none",
                            color: "var(--c-teal)",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil size={11} strokeWidth={2} aria-hidden />
                        </button>
                      )}
                    </span>
                  )}
                  <span>
                    Enrolled {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                  {careTeam.length > 0 && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Stethoscope size={11} strokeWidth={2} aria-hidden />
                      {careTeam.join(" · ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            className="mc-kpi-value"
            style={{
              fontSize: 15,
              fontVariantNumeric: "tabular-nums",
              background: "var(--c-card)",
              border: "1px solid var(--c-border-soft)",
              borderRadius: 999,
              padding: "4px 12px",
            }}
            title="Time on this patient — saves as a logged contact on Notes"
          >
            {formatClock(seconds)}
          </span>
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            aria-label={running ? "Pause timer" : "Start timer"}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? (
              <Pause size={14} strokeWidth={2} />
            ) : (
              <Play size={14} strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            aria-label="Reset timer"
            disabled={seconds === 0 && !running}
            onClick={() => {
              setRunning(false);
              setSeconds(0);
            }}
          >
            <RotateCcw size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            disabled={seconds === 0}
            onClick={() => {
              setRunning(false);
              setShowLogModal(true);
            }}
          >
            <Save size={13} strokeWidth={2} aria-hidden />
            Save
          </button>
        </div>
      </div>

      {canEditAddress && (
        <EditAddressModal
          open={editingAddress}
          onClose={() => setEditingAddress(false)}
          patient={patient}
        />
      )}

      <EditStatusesModal
        open={editingStatuses}
        onClose={() => setEditingStatuses(false)}
        patientId={patient.id}
        patientName={patient.full_name}
      />

      <LogSessionModal
        patientId={patient.id}
        patientLocationName={patient.location_name}
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
        initialSeconds={seconds}
        onSaved={() => setSeconds(0)}
      />
    </div>
  );
}
