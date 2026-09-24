"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  MapPin,
  Pause,
  Phone,
  Play,
  RotateCcw,
  Save,
  Stethoscope,
  User,
} from "lucide-react";

import { useLogContact } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { pregnancyTone, type PatientDetail, type Pregnancy } from "../types";

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
export function PatientHeaderBanner({ patient, current }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logContact = useLogContact(patient.id);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const saveSession = async () => {
    if (seconds === 0) return;
    setSaved(false);
    try {
      await logContact.mutateAsync({ duration_seconds: seconds });
      setSeconds(0);
      setRunning(false);
      setSaved(true);
    } catch {
      // Surfaced below via logContact.isError.
    }
  };

  const age = ageFromDob(patient.date_of_birth);
  const careTeam = [
    current?.provider_name && `Provider: ${current.provider_name}`,
    current?.care_manager_name && `Care Manager: ${current.care_manager_name}`,
    current?.nurse_name && `Nurse: ${current.nurse_name}`,
  ].filter(Boolean) as string[];

  return (
    <div className="mc-hero" style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          <InitialsAvatar name={patient.full_name} size={48} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="mc-h1" style={{ marginBottom: 0 }}>
                {patient.full_name}
              </h1>
              {current && (
                <>
                  <span className="mc-ga">
                    {current.gestational_age_display}
                  </span>
                  <span
                    className={`mc-badge mc-badge-${pregnancyTone(current.status)}`}
                  >
                    {current.status_display}
                  </span>
                </>
              )}
            </div>
            <div
              className="mc-sub"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 16px",
                marginTop: 6,
              }}
            >
              {[age, patient.gender].filter(Boolean).join(" · ") && (
                <span>
                  <User
                    size={12}
                    strokeWidth={2}
                    aria-hidden
                    style={{ verticalAlign: -1, marginRight: 3 }}
                  />
                  {[age, patient.gender].filter(Boolean).join(" · ")}
                </span>
              )}
              {[patient.mrn, patient.cnic].filter(Boolean).join(" · ") && (
                <span>
                  {[patient.mrn, patient.cnic].filter(Boolean).join(" · ")}
                </span>
              )}
              {patient.date_of_birth && (
                <span>
                  <Calendar
                    size={12}
                    strokeWidth={2}
                    aria-hidden
                    style={{ verticalAlign: -1, marginRight: 3 }}
                  />
                  DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                </span>
              )}
              {patient.phone && (
                <span>
                  <Phone
                    size={12}
                    strokeWidth={2}
                    aria-hidden
                    style={{ verticalAlign: -1, marginRight: 3 }}
                  />
                  {patient.phone}
                </span>
              )}
              {patient.location_name && (
                <span>
                  <MapPin
                    size={12}
                    strokeWidth={2}
                    aria-hidden
                    style={{ verticalAlign: -1, marginRight: 3 }}
                  />
                  {patient.location_name}
                </span>
              )}
              <span>
                Enrolled {new Date(patient.created_at).toLocaleDateString()}
              </span>
            </div>
            {careTeam.length > 0 && (
              <div
                className="mc-sub"
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Stethoscope
                  size={12}
                  strokeWidth={2}
                  aria-hidden
                  style={{ flexShrink: 0 }}
                />
                {careTeam.join(" · ")}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <span
              className="mc-kpi-value"
              style={{ fontSize: 20, fontVariantNumeric: "tabular-nums" }}
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
              disabled={seconds === 0 || logContact.isPending}
              onClick={saveSession}
            >
              <Save size={13} strokeWidth={2} aria-hidden />
              {logContact.isPending ? "Saving…" : "Save"}
            </button>
          </div>
          <div className="mc-hint" style={{ marginTop: 4 }}>
            Time on this patient — saves as a logged contact on Notes
          </div>
          {logContact.isError && (
            <p
              className="mc-alert mc-alert-error"
              style={{ marginTop: 8, justifyContent: "flex-end" }}
            >
              <AlertTriangle size={13} strokeWidth={2} aria-hidden />
              {logContact.error instanceof Error
                ? logContact.error.message
                : "Could not save this session."}
            </p>
          )}
          {saved && !logContact.isPending && (
            <p className="mc-alert mc-alert-success" style={{ marginTop: 8 }}>
              Session saved.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
