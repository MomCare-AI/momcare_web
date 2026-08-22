"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Brain,
  Building2,
  CalendarDays,
  HeartPulse,
  Info,
  MapPin,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { usePortal } from "./layout";

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  const { org, user, isHospitalAdmin } = usePortal();
  const now = new Date();

  const hasStaff = org.staff_count > 0;
  const hasPatients = org.patient_count > 0;

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">
            {greeting(now)}, {user.first_name || "there"}
          </h1>
          <p className="mc-sub">
            {isHospitalAdmin
              ? "Your hospital's maternal health overview."
              : "Your hospital at a glance."}
          </p>
        </div>
        <div className="mc-head-aside">
          <div className="mc-head-date">
            {now.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div>Clinical modules in development</div>
        </div>
      </div>

      {/* Metrics reflect what the database actually holds. Patient, appointment
          and alert counts stay at zero until those modules exist — a dashboard
          that invents clinical numbers is worse than one that admits it has none. */}
      <section className="mc-kpis">
        <Link href="/dashboard/staff" className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Doctors &amp; staff</span>
            <span className="mc-kpi-icon">
              <Stethoscope size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{org.staff_count}</span>
          <span className="mc-kpi-foot">
            {hasStaff ? "Active clinical team" : "No team members yet"}
          </span>
        </Link>

        <Link href="/dashboard/patients" className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Patients</span>
            <span className="mc-kpi-icon">
              <Users size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{org.patient_count}</span>
          <span className="mc-kpi-foot">
            {hasPatients
              ? "Enrolled at this hospital"
              : "No patients enrolled yet"}
          </span>
        </Link>

        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Today&apos;s appointments</span>
            <span className="mc-kpi-icon">
              <CalendarDays size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">—</span>
          <span className="mc-kpi-foot">Scheduling not yet available</span>
        </div>

        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Active alerts</span>
            <span className="mc-kpi-icon">
              <AlertTriangle size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">—</span>
          <span className="mc-kpi-foot">Monitoring not yet available</span>
        </div>
      </section>

      {isHospitalAdmin && (
        <div className="mc-actions">
          <Link href="/dashboard/patients/new" className="mc-btn">
            <UserPlus size={15} strokeWidth={2} aria-hidden />
            Enrol patient
          </Link>
          <Link href="/dashboard/staff" className="mc-btn-ghost">
            Invite staff
          </Link>
          <span className="mc-badge mc-badge-neutral">
            <Info size={12} strokeWidth={2.2} aria-hidden />
            Monitoring and alerts arrive with the next module
          </span>
        </div>
      )}

      <div className="mc-grid-2">
        <section className="mc-card">
          <div className="mc-card-head">
            <div>
              <div className="mc-card-title">Maternal health overview</div>
              <div className="mc-card-sub">
                Patient health trends across your organization
              </div>
            </div>
          </div>
          <div className="mc-empty">
            <span className="mc-empty-icon">
              <HeartPulse size={20} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="mc-empty-title">No health data yet</span>
            <span className="mc-empty-text">
              Blood pressure, heart rate and other vitals will chart here once
              patients are enrolled and wearable monitoring is connected.
            </span>
          </div>
        </section>

        <div className="mc-stack">
          <section className="mc-card">
            <div className="mc-card-head">
              <div>
                <div className="mc-card-title">AI clinical insights</div>
                <div className="mc-card-sub">
                  Decision support, reviewed by a clinician
                </div>
              </div>
            </div>
            <div className="mc-card-body">
              <div className="mc-ai">
                <span className="mc-ai-tag">
                  <Brain size={12} strokeWidth={2.3} aria-hidden />
                  AI insight
                </span>
                <div style={{ fontSize: 13.5, color: "var(--c-body)" }}>
                  The maternal risk model is being trained and is not connected
                  yet. Insights will appear here once it is, each labelled with
                  its confidence and the readings behind it.
                </div>
                <p className="mc-ai-note">
                  AI output is decision support only and is never a diagnosis. A
                  clinician reviews every insight before it informs care.
                </p>
              </div>
            </div>
          </section>

          <section className="mc-card">
            <div className="mc-card-head">
              <div className="mc-card-title">Patients requiring attention</div>
            </div>
            <div className="mc-empty">
              <span className="mc-empty-icon">
                <Activity size={20} strokeWidth={1.9} aria-hidden />
              </span>
              <span className="mc-empty-title">Nothing to review</span>
              <span className="mc-empty-text">
                High-risk patients will be listed here with their latest vitals
                once monitoring is live.
              </span>
            </div>
          </section>
        </div>
      </div>

      {!hasStaff && isHospitalAdmin && (
        <section className="mc-card" style={{ marginBottom: 18 }}>
          <div className="mc-empty">
            <span className="mc-empty-icon">
              <Stethoscope size={20} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="mc-empty-title">No doctors yet</span>
            <span className="mc-empty-text">
              Your clinical team hasn&apos;t been added. Invite doctors, nurses
              and care managers to start running your hospital on MomCare.
            </span>
            <span className="mc-empty-actions">
              <Link href="/dashboard/staff" className="mc-btn">
                <UserPlus size={15} strokeWidth={2} aria-hidden />
                Add staff
              </Link>
            </span>
          </div>
        </section>
      )}

      <section className="mc-card">
        <div className="mc-card-head">
          <div>
            <div className="mc-card-title">Hospital profile</div>
            <div className="mc-card-sub">
              Registration and contact details on file
            </div>
          </div>
          <span className="mc-badge mc-badge-neutral">
            <Building2 size={12} strokeWidth={2.2} aria-hidden />
            {org.license_authority_display || "Authority not recorded"}
          </span>
        </div>
        <div className="mc-card-body">
          <div className="mc-pairs">
            <Pair label="Hospital" value={org.name} />
            <Pair label="Administrator" value={org.owner_name} />
            <Pair label="Licence no." value={org.license_no} />
            <Pair label="Contact email" value={org.email} />
            <Pair label="Phone" value={org.phone} />
            <Pair
              label="Location"
              value={[
                org.address_line1,
                org.address_line2,
                org.city,
                org.state,
                org.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          </div>
        </div>
        {hasPatients && (
          <div className="mc-card-foot">
            <span className="mc-link">
              <MapPin size={13} strokeWidth={2} aria-hidden /> View organization
              settings
            </span>
          </div>
        )}
      </section>
    </>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mc-pair-label">{label}</div>
      <div className="mc-pair-value">{value || "—"}</div>
    </div>
  );
}
