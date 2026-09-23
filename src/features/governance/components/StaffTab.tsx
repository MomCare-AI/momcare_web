"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Mail,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import { usePortal } from "@/app/(portal)/dashboard/layout";
import { SessionExpiredError } from "@/core/api/authFetch";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import {
  useCreateInvite,
  useInvites,
  useRevokeInvite,
  useStaffList,
} from "@/features/staff/hooks/useStaff";
import { StaffCredentialsPanel } from "@/features/staff/components/StaffCredentialsPanel";

const ROLES = [
  { code: "provider", label: "Doctor / Provider" },
  { code: "nurse", label: "Nurse" },
  { code: "care_manager", label: "Care manager" },
  { code: "hospital_admin", label: "Hospital admin" },
];

const EMPTY_FORM = {
  email: "",
  first_name: "",
  last_name: "",
  role_code: "provider",
};

export function StaffTab() {
  const { isHospitalAdmin, user, refresh } = usePortal();
  const router = useRouter();

  const [copied, setCopied] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const staffQuery = useStaffList();
  const invitesQuery = useInvites(isHospitalAdmin);
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();

  const staff = staffQuery.data ?? [];
  const invites = invitesQuery.data ?? [];
  const submitting = createInvite.isPending;

  // A failed request must not render as "no staff yet" — an empty team and a
  // broken server look identical to the user otherwise, which is a bad failure
  // mode in clinical software.
  const loadFailed = staffQuery.isError;
  const error =
    staffQuery.error && !(staffQuery.error instanceof SessionExpiredError)
      ? staffQuery.error instanceof Error
        ? staffQuery.error.message
        : "Could not load your team."
      : null;

  useEffect(() => {
    if (staffQuery.error instanceof SessionExpiredError)
      router.replace("/login");
  }, [staffQuery.error, router]);

  // The shell shows the staff count, so it refetches once the team is known.
  useEffect(() => {
    if (!staffQuery.isPending) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff.length]);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createInvite.mutateAsync(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.replace("/login");
        return;
      }
      setFormError(
        err instanceof Error ? err.message : "Could not reach the server."
      );
    }
  };

  const revoke = (id: string) => revokeInvite.mutate(id);

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/invite/${token}`
    );
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  if (staffQuery.isPending)
    return (
      <Card>
        <div className="mc-rows">
          <RowSkeleton count={5} variant="plain" />
        </div>
      </Card>
    );

  const pending = invites.filter((i) => i.status === "pending");

  return (
    <>
      <div className="mc-head">
        <div>
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
        <Card style={{ marginBottom: 18 }}>
          <CardHeader>
            <div>
              <div className="mc-card-title">Invite a team member</div>
              <div className="mc-card-sub">
                They receive a link and choose their own password — send it by
                email, WhatsApp, or in person.
              </div>
            </div>
          </CardHeader>
          <CardBody>
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
          </CardBody>
        </Card>
      )}

      {isHospitalAdmin && pending.length > 0 && (
        <Card style={{ marginBottom: 18 }}>
          <CardHeader>
            <div className="mc-card-title">Pending invitations</div>
            <span className="mc-badge mc-badge-moderate">
              {pending.length} awaiting
            </span>
          </CardHeader>
          <div className="mc-rows">
            {pending.map((inv, index) => (
              <motion.div
                key={inv.id}
                className="mc-row"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
              >
                <InitialsAvatar
                  name={
                    [inv.first_name, inv.last_name].filter(Boolean).join(" ") ||
                    inv.email
                  }
                />
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
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">Clinical team</div>
            <div className="mc-card-sub">
              Everyone with access to this hospital
            </div>
          </div>
        </CardHeader>
        {loadFailed ? (
          <EmptyState
            icon={<AlertCircle size={20} strokeWidth={1.9} aria-hidden />}
            title="Couldn't load your team"
            text="This is a problem reaching the server, not an empty team — your staff records are unaffected."
            actions={
              <button className="mc-btn" onClick={() => staffQuery.refetch()}>
                Try again
              </button>
            }
          />
        ) : staff.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={20} strokeWidth={1.9} aria-hidden />}
            title="No doctors yet"
            text={
              isHospitalAdmin
                ? "Your clinical team hasn't been added yet. Invite doctors and staff to start managing your hospital."
                : "No team members have been added yet."
            }
            actions={
              isHospitalAdmin && (
                <button className="mc-btn" onClick={() => setShowForm(true)}>
                  <UserPlus size={15} strokeWidth={2} aria-hidden />
                  Add staff
                </button>
              )
            }
          />
        ) : (
          <div className="mc-rows">
            {staff.map((m, index) => {
              const isSelf = m.id === user.staff_id;
              const expanded = expandedId === m.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(index, 8) * 0.03,
                  }}
                >
                  <button
                    type="button"
                    className="mc-row"
                    style={{
                      width: "100%",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      font: "inherit",
                    }}
                    onClick={() => setExpandedId(expanded ? null : m.id)}
                    aria-expanded={expanded}
                  >
                    <InitialsAvatar name={m.full_name || m.email} />
                    <div className="mc-row-main">
                      <div className="mc-row-title">
                        {m.full_name || m.email}
                        {isSelf && (
                          <span
                            className="mc-badge mc-badge-info"
                            style={{ marginLeft: 8 }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <div className="mc-row-meta">
                        {m.email} · {m.employee_id}
                        {m.specialty && ` · ${m.specialty}`}
                      </div>
                    </div>
                    <span className="mc-badge mc-badge-neutral">
                      {m.role_name}
                    </span>
                    {!m.is_user_active && (
                      <span className="mc-badge mc-badge-high">
                        <AlertCircle size={12} strokeWidth={2.2} aria-hidden />
                        Inactive
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      aria-hidden
                      style={{
                        transform: expanded ? "rotate(180deg)" : undefined,
                        transition: "transform 0.15s ease",
                      }}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "0 4px 14px" }}>
                          <StaffCredentialsPanel
                            member={m}
                            canEdit={isHospitalAdmin || isSelf}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
