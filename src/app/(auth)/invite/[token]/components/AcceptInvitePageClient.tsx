"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { API_BASE } from "@/core/api/apiBase";

interface Preview {
  email: string;
  first_name: string;
  last_name: string;
  organization_name: string;
  role_name: string;
  invited_by_name: string;
  expires_at: string;
}

export function AcceptInvitePageClient({ token }: { token: string }) {
  const router = useRouter();

  const [preview, setPreview] = useState<Preview | null>(null);
  const [deadLink, setDeadLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/invites/${token}/`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setDeadLink(body.detail ?? "This invitation link is not valid.");
          return;
        }
        setPreview(body as Preview);
        setFirstName(body.first_name ?? "");
        setLastName(body.last_name ?? "");
      })
      .catch(() => setDeadLink("Could not reach the server."))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Straight from the fields, not from React state. A password manager can
    // fill these without firing the events React listens for, and here that
    // would be worse than a failed login - the person would be told their
    // passwords don't match while both boxes plainly show a value.
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (!password) {
      setError("Choose a password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/invites/${token}/accept/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          password,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(
          body.password?.[0] ?? body.detail ?? "Could not complete sign-up."
        );
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={s.page}>
        <p style={s.muted}>Checking your invitation…</p>
      </main>
    );
  }

  if (deadLink) {
    return (
      <main style={s.page}>
        <div style={s.card}>
          <Brand />
          <h1 style={s.heading}>Invitation unavailable</h1>
          <p style={s.error}>{deadLink}</p>
          <p style={s.muted}>
            Ask your hospital admin to send you a new invitation link.
          </p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main style={s.page}>
        <div style={s.card}>
          <Brand />
          <h1 style={s.heading}>You&apos;re all set</h1>
          <p style={s.muted}>
            Your account at <strong>{preview?.organization_name}</strong> is
            ready. Taking you to sign in…
          </p>
          <Link href="/login" style={s.link}>
            Go to sign in →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <Brand />
        <h1 style={s.heading}>Join {preview?.organization_name}</h1>
        <p style={s.sub}>
          {preview?.invited_by_name || "A hospital admin"} invited you as{" "}
          <strong>{preview?.role_name}</strong>. Set a password to finish.
        </p>

        <div style={s.emailBox}>
          <span style={s.emailLabel}>Your sign-in email</span>
          <span style={s.emailValue}>{preview?.email}</span>
        </div>

        <form onSubmit={submit} noValidate>
          {/* The address is fixed by the invitation and shown above as text.
              A password manager still needs a username field to file the new
              password against, or it saves it under no account at all. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={preview?.email ?? ""}
            readOnly
            hidden
          />

          <div style={s.grid2}>
            <div style={s.field}>
              <label htmlFor="firstName" style={s.label}>
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                style={s.input}
              />
            </div>
            <div style={s.field}>
              <label htmlFor="lastName" style={s.label}>
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                style={s.input}
              />
            </div>
          </div>

          <div style={s.field}>
            <label htmlFor="password" style={s.label}>
              Create password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label htmlFor="confirm" style={s.label}>
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              style={s.input}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={submitting} style={s.btn}>
            {submitting ? "Creating your account…" : "Join hospital"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div style={s.brand}>
      <span style={s.heart}>♥</span>
      <span style={s.brandName}>MomCare</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ede8f5",
    padding: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "40px 44px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 4px 24px rgba(139,120,196,0.12)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "26px",
  },
  heart: { color: "#e07060", fontSize: "20px" },
  brandName: { fontWeight: 700, fontSize: "18px", color: "#2d1f5e" },
  heading: {
    fontSize: "23px",
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: "6px",
  },
  sub: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "22px",
    lineHeight: 1.55,
  },
  muted: { fontSize: "14px", color: "#6b7280", lineHeight: 1.55 },
  emailBox: {
    background: "#f7f5fc",
    border: "1px solid #e8e2f4",
    borderRadius: "10px",
    padding: "12px 15px",
    marginBottom: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  emailLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#8b78c4",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  emailValue: { fontSize: "14.5px", color: "#1a1a2e", fontWeight: 600 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  field: { marginBottom: "16px" },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "9px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    color: "#1a1a2e",
    background: "#f9f8fc",
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13.5px",
    marginBottom: "16px",
  },
  btn: {
    width: "100%",
    padding: "13px",
    background: "#8b78c4",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  },
  link: {
    color: "#8b78c4",
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-block",
    marginTop: "18px",
  },
};
