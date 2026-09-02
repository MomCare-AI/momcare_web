"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Brain,
  Building2,
  CalendarDays,
  Clock,
  HeartPulse,
  Info,
  MapPin,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { AttentionQueue } from "@/features/monitoring/components/AttentionQueue";
import { useAttentionQueue } from "@/features/monitoring/hooks/useMonitoring";
import {
  useDashboardSummary,
  type DashboardActivity,
  type DashboardRisk,
} from "@/features/portal/hooks/usePortalData";
import { usePortal } from "./layout";
import { usePageTitle } from "@/hooks/usePageTitle";

const RISK_LEVELS: {
  key: keyof Pick<
    DashboardRisk,
    "critical" | "high" | "moderate" | "stable" | "not_assessed"
  >;
  label: string;
  badge: string;
  color: string;
}[] = [
  {
    key: "critical",
    label: "Critical",
    badge: "mc-badge-critical",
    color: "var(--c-critical)",
  },
  {
    key: "high",
    label: "High",
    badge: "mc-badge-high",
    color: "var(--c-high)",
  },
  {
    key: "moderate",
    label: "Moderate",
    badge: "mc-badge-moderate",
    color: "var(--c-moderate)",
  },
  {
    key: "stable",
    label: "Stable",
    badge: "mc-badge-stable",
    color: "var(--c-stable)",
  },
  {
    key: "not_assessed",
    label: "Not assessed",
    badge: "mc-badge-neutral",
    color: "var(--c-faint)",
  },
];

/** CSS conic-gradient stops for the risk donut — no charting library needed
 *  for five static segments, and it stays crisp at any size. */
function donutGradient(risk: DashboardRisk): string {
  const total = risk.total || 1;
  let cursor = 0;
  const stops = RISK_LEVELS.map(({ key, color }) => {
    const pct = (risk[key] / total) * 100;
    const from = cursor;
    cursor += pct;
    return `${color} ${from}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

/** "READ patients" -> "Read patients". Kept close to the raw log on purpose —
 *  this is an audit trail, not a marketing feed, and paraphrasing it risks
 *  saying something the log itself did not. */
function describeActivity(entry: DashboardActivity): string {
  const verb = entry.action.charAt(0) + entry.action.slice(1).toLowerCase();
  return entry.resource ? `${verb} ${entry.resource}` : verb;
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  usePageTitle("Overview");
  const { org, user, isHospitalAdmin } = usePortal();
  const now = new Date();
  const queue = useAttentionQueue();
  const summary = useDashboardSummary();

  // Undefined while loading or on error — rendered as "—" rather than 0,
  // because a confident zero we cannot vouch for is the wrong thing to show
  // on a monitoring dashboard.
  const attentionCount = queue.isSuccess ? queue.data.count : undefined;

  const hasStaff = org.staff_count > 0;
  const hasPatients = org.patient_count > 0;

  return (
    <>
      <div className="mc-hero">
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
            <div className="mc-hero-pill">
              Monitoring live · alerts escalating
            </div>
          </div>
        </div>
      </div>

      {/* Metrics reflect what the database actually holds. Scheduling does not
          exist yet and its tile says so rather than showing a zero — a dashboard
          that invents clinical numbers is worse than one that admits it has none. */}
      <section className="mc-kpis">
        <Link href="/dashboard/staff" className="mc-kpi mc-kpi-fill-teal">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Doctors &amp; staff</span>
            <span className="mc-kpi-icon mc-kpi-icon-teal">
              <Stethoscope size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{org.staff_count}</span>
          <span className="mc-kpi-foot">
            {hasStaff ? "Active clinical team" : "No team members yet"}
          </span>
        </Link>

        <Link href="/dashboard/patients" className="mc-kpi mc-kpi-fill-coral">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Patients</span>
            <span className="mc-kpi-icon mc-kpi-icon-coral">
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

        <div
          className={`mc-kpi ${attentionCount ? "mc-kpi-fill-alert" : "mc-kpi-fill-attn"}`}
        >
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Needing attention</span>
            <span
              className={`mc-kpi-icon mc-kpi-icon-attn${
                attentionCount ? " mc-kpi-icon-alert" : ""
              }`}
            >
              <AlertTriangle size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{attentionCount ?? "—"}</span>
          <span className="mc-kpi-foot">
            {attentionCount === undefined
              ? queue.isError
                ? "Queue unavailable"
                : "Checking…"
              : attentionCount === 0
                ? "No patient outside range"
                : "Patients outside clinical range"}
          </span>
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
            Vitals, risk scoring and alert escalation are all live
          </span>
        </div>
      )}

      <div className="mc-fullstack">
        <section className="mc-card">
          <div className="mc-card-head">
            <div className="mc-section-head">
              <span className="mc-section-icon mc-kpi-icon-teal">
                <HeartPulse size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <div className="mc-card-title">Maternal health overview</div>
                <div className="mc-card-sub">
                  Active pregnancies by current risk level
                </div>
              </div>
            </div>
          </div>

          {summary.isError && (
            <div className="mc-empty">
              <span className="mc-empty-title">Overview unavailable</span>
              <span className="mc-empty-text">
                This is not a statement that no patient needs review — the
                summary could not be loaded. Refresh to try again.
              </span>
            </div>
          )}

          {summary.isSuccess && summary.data.risk.total === 0 && (
            <div className="mc-empty">
              <span className="mc-empty-icon">
                <HeartPulse size={20} strokeWidth={1.9} aria-hidden />
              </span>
              <span className="mc-empty-title">No health data yet</span>
              <span className="mc-empty-text">
                A breakdown by risk level will appear here once patients are
                enrolled and their readings begin arriving.
              </span>
            </div>
          )}

          {summary.isSuccess && summary.data.risk.total > 0 && (
            <div className="mc-card-body">
              <div className="mc-donut-wrap">
                <div
                  className="mc-donut"
                  style={{ background: donutGradient(summary.data.risk) }}
                  role="img"
                  aria-label={`${summary.data.risk.total} active pregnancies, ${summary.data.risk.needing_attention} needing review`}
                >
                  <div className="mc-donut-hole">
                    <span className="mc-donut-value">
                      {summary.data.risk.total}
                    </span>
                    <span className="mc-donut-label">active pregnancies</span>
                  </div>
                </div>
                <div className="mc-riskbars">
                  {RISK_LEVELS.map(({ key, label, color }) => {
                    const count = summary.data.risk[key];
                    const pct =
                      summary.data.risk.total > 0
                        ? Math.round((count / summary.data.risk.total) * 100)
                        : 0;
                    return (
                      <div key={key} className="mc-riskbar-row">
                        <span className="mc-riskbar-tag">
                          <span
                            className="mc-riskbar-dot"
                            style={{ background: color }}
                            aria-hidden
                          />
                          {label}
                        </span>
                        <div className="mc-riskbar-track">
                          <div
                            className="mc-riskbar-fill"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                        <span className="mc-riskbar-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mc-hint" style={{ marginTop: 14 }}>
                {summary.data.risk.needing_attention} of{" "}
                {summary.data.risk.total} active{" "}
                {summary.data.risk.total === 1
                  ? "pregnancy needs"
                  : "pregnancies need"}{" "}
                review right now.
              </div>
            </div>
          )}
        </section>

        <section className="mc-card">
          <div className="mc-card-head">
            <div className="mc-section-head">
              <span className="mc-section-icon mc-kpi-icon-info">
                <Brain size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <div className="mc-card-title">AI clinical insights</div>
                <div className="mc-card-sub">
                  Decision support, reviewed by a clinician
                </div>
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

        <section className="mc-card mc-lift">
          <div className="mc-card-head">
            <div className="mc-section-head">
              <span
                className={`mc-section-icon mc-kpi-icon-attn${
                  attentionCount ? " mc-kpi-icon-alert" : ""
                }`}
              >
                <AlertTriangle size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <div className="mc-card-title">
                  Patients requiring attention
                </div>
                <div className="mc-card-sub">
                  Most severe first, unreviewed above reviewed
                </div>
              </div>
            </div>
            {attentionCount ? (
              <span className="mc-badge mc-badge-neutral">
                {attentionCount}
              </span>
            ) : null}
          </div>
          <AttentionQueue limit={5} />
        </section>

        {isHospitalAdmin && (
          <section className="mc-card">
            <div className="mc-card-head">
              <div className="mc-section-head">
                <span className="mc-section-icon mc-kpi-icon-neutral">
                  <Clock size={17} strokeWidth={1.9} aria-hidden />
                </span>
                <div>
                  <div className="mc-card-title">Recent activity</div>
                  <div className="mc-card-sub">
                    Who touched patient data, and when
                  </div>
                </div>
              </div>
            </div>
            <div className="mc-card-body">
              {summary.isSuccess && summary.data.activity.length === 0 && (
                <div className="mc-hint">Nothing has been recorded yet.</div>
              )}
              {summary.isSuccess && summary.data.activity.length > 0 && (
                <ol className="mc-trail">
                  {summary.data.activity.map((entry, index) => (
                    <li key={`${entry.at}-${index}`} className="mc-trail-item">
                      <span className="mc-trail-dot" aria-hidden />
                      <div>
                        <div className="mc-trail-what">
                          {describeActivity(entry)}
                        </div>
                        <div className="mc-trail-when">
                          <Clock size={11} strokeWidth={2.2} aria-hidden />{" "}
                          {timeAgo(entry.at)}
                          {entry.actor ? ` · ${entry.actor}` : ""}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        )}
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
          <div className="mc-section-head">
            <span className="mc-section-icon mc-kpi-icon-teal">
              <Building2 size={17} strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <div className="mc-card-title">Hospital profile</div>
              <div className="mc-card-sub">
                Registration and contact details on file
              </div>
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
            {/* Which population the risk model judges these patients as.
                Derived from the country above, so the two can never disagree.
                Shown because a hospital outside the model's training gets
                clinical rules instead, and should be able to see that. */}
            <Pair label="Risk model region" value={org.region_display} />
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
