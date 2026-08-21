"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Copy,
  Mail,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import { usePortal } from "../layout";
import { authFetch, authJson, SessionExpiredError } from "@/core/api/authFetch";

const ROLES = [
  { code: "provider", label: "Doctor / Provider" },
  { code: "nurse", label: "Nurse" },
  { code: "care_manager", label: "Care manager" },
  { code: "hospital_admin", label: "Hospital admin" },
];

interface StaffMember {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role_name: string;
  role_code: string;
  is_user_active: boolean;
}

interface Invite {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
}

const EMPTY_FORM = {
  email: "",
  first_name: "",
  last_name: "",
  role_code: "provider",
};

export default function StaffPage() {
  const { isHospitalAdmin, refresh } = usePortal();
  const router = useRouter();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // A failed request must not render as "no staff yet" — an empty team and
      // a broken server look identical to the user otherwise, which is a bad
      // failure mode in clinical software.
      setStaff(await authJson<StaffMember[]>("/api/staff/"));

      if (isHospitalAdmin) {
        setInvites(await authJson<Invite[]>("/api/staff/invites/"));
      }
      setLoadFailed(false);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.replace("/login");
        return;
      }
      setLoadFailed(true);
      setError(
        err instanceof Error ? err.message : "Could not load your team."
      );
    } finally {
      setLoading(false);
    }
  }, [isHospitalAdmin, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff.length]);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await authFetch("/api/staff/invites/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        setFormError(
          body.email?.[0] ?? body.detail ?? "Could not create the invitation."
        );
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.replace("/login");
        return;
      }
      setFormError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await authFetch(`/api/staff/invites/${id}/revoke/`, { method: "POST" });
      await load();
    } catch (err) {
      if (err instanceof SessionExpiredError) router.replace("/login");
      else setError("Could not revoke that invitation.");
    }
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/invite/${token}`
    );
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="mc-loading">Loading your team…</div>;

  const pending = invites.filter((i) => i.status === "pending");

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">Doctors &amp; staff</h1>
          <p className="mc-sub">
            {staff.length} {staff.length === 1 ? "person" : "people"} on your
            clinical team
            {isHospitalAdmin && pending.length > 0
              ? ` · ${pending.length} invitation${pending.length > 1 ? "s" : ""} awaiting acceptance`
              : ""}
          </p>
        </div>
        {isHospitalAdmin && (
          <button className="mc-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <X size={15} strokeWidth={2} />
            ) : (
              <UserPlus size={15} strokeWidth={2} />
            )}
            {showForm ? "Cancel" : "Invite staff"}
          </button>
        )}
      </div>

      {error && (
        <p className="mc-alert mc-alert-error">
          <AlertCircle size={15} strokeWidth={2} aria-hidden />
          {error}
        </p>
      )}

      {isHospitalAdmin && showForm && (
        <section className="mc-card" style={{ marginBottom: 18 }}>
          <div className="mc-card-head">
            <div>
              <div className="mc-card-title">Invite a team member</div>
              <div className="mc-card-sub">
                They receive a link and choose their own password — send it by
                email, WhatsApp, or in person.
              </div>
            </div>
          </div>
          <div className="mc-card-body">
            <form onSubmit={submitInvite}>
              <div className="mc-formgrid">
                <div>
                  <label className="mc-label" htmlFor="inv-email">
                    Email address <span className="mc-req">*</span>
                  </label>
                  <input
                    id="inv-email"
                    className="mc-input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="doctor@yourhospital.pk"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="inv-role">
                    Role <span className="mc-req">*</span>
                  </label>
                  <select
                    id="inv-role"
                    className="mc-input"
                    value={form.role_code}
                    onChange={(e) =>
                      setForm({ ...form, role_code: e.target.value })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mc-label" htmlFor="inv-first">
                    First name
                  </label>
                  <input
                    id="inv-first"
                    className="mc-input"
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mc-label" htmlFor="inv-last">
                    Last name
                  </label>
                  <input
                    id="inv-last"
                    className="mc-input"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
              {formError && (
                <p className="mc-alert mc-alert-error">
                  <AlertCircle size={15} strokeWidth={2} aria-hidden />
                  {formError}
                </p>
              )}
              <button type="submit" className="mc-btn" disabled={submitting}>
                <Mail size={15} strokeWidth={2} aria-hidden />
                {submitting ? "Creating…" : "Create invitation"}
              </button>
            </form>
          </div>
        </section>
      )}

      {isHospitalAdmin && pending.length > 0 && (
        <section className="mc-card" style={{ marginBottom: 18 }}>
          <div className="mc-card-head">
            <div className="mc-card-title">Pending invitations</div>
            <span className="mc-badge mc-badge-moderate">
              {pending.length} awaiting
            </span>
          </div>
          <div className="mc-rows">
            {pending.map((inv) => (
              <div key={inv.id} className="mc-row">
                <div className="mc-row-main">
                  <div className="mc-row-title">
                    {[inv.first_name, inv.last_name]
                      .filter(Boolean)
                      .join(" ") || inv.email}
                  </div>
                  <div className="mc-row-meta">
                    {inv.role_name} · {inv.email} · expires{" "}
                    {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mc-row-actions">
                  <button
                    className="mc-btn-ghost mc-btn-sm"
                    onClick={() => copyLink(inv.token)}
                  >
                    {copied === inv.token ? (
                      <>
                        <Check size={13} strokeWidth={2.3} aria-hidden /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} strokeWidth={2} aria-hidden /> Copy link
                      </>
                    )}
                  </button>
                  <button
                    className="mc-btn-ghost mc-btn-sm mc-btn-danger"
                    onClick={() => revoke(inv.id)}
                  >
                    <X size={13} strokeWidth={2.3} aria-hidden /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mc-card">
        <div className="mc-card-head">
          <div>
            <div className="mc-card-title">Clinical team</div>
            <div className="mc-card-sub">
              Everyone with access to this hospital
            </div>
          </div>
        </div>
        {loadFailed ? (
          <div className="mc-empty">
            <span className="mc-empty-icon">
              <AlertCircle size={20} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="mc-empty-title">Couldn&apos;t load your team</span>
            <span className="mc-empty-text">
              This is a problem reaching the server, not an empty team — your
              staff records are unaffected.
            </span>
            <span className="mc-empty-actions">
              <button className="mc-btn" onClick={() => load()}>
                Try again
              </button>
            </span>
          </div>
        ) : staff.length === 0 ? (
          <div className="mc-empty">
            <span className="mc-empty-icon">
              <Stethoscope size={20} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="mc-empty-title">No doctors yet</span>
            <span className="mc-empty-text">
              {isHospitalAdmin
                ? "Your clinical team hasn't been added yet. Invite doctors and staff to start managing your hospital."
                : "No team members have been added yet."}
            </span>
            {isHospitalAdmin && (
              <span className="mc-empty-actions">
                <button className="mc-btn" onClick={() => setShowForm(true)}>
                  <UserPlus size={15} strokeWidth={2} aria-hidden />
                  Add staff
                </button>
              </span>
            )}
          </div>
        ) : (
          <div className="mc-rows">
            {staff.map((m) => (
              <div key={m.id} className="mc-row">
                <div className="mc-row-main">
                  <div className="mc-row-title">{m.full_name || m.email}</div>
                  <div className="mc-row-meta">
                    {m.email} · {m.employee_id}
                  </div>
                </div>
                <span className="mc-badge mc-badge-neutral">{m.role_name}</span>
                {!m.is_user_active && (
                  <span className="mc-badge mc-badge-high">
                    <AlertCircle size={12} strokeWidth={2.2} aria-hidden />
                    Inactive
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
