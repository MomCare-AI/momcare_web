"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/core/api/authFetch";
import { clearQueryCache } from "@/core/query/queryClient";

import { API_BASE } from "@/core/api/apiBase";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // A hospital still under review isn't a failed login — it's a status update,
  // so it gets its own calmer treatment rather than the red error style.
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Read the fields themselves rather than React state. A password manager
    // filling this form on page load sets the DOM value without firing the
    // events React listens for, so state would still be empty while the boxes
    // visibly hold the right credentials - and the user is told their own
    // saved password is wrong.
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.org_status) {
          setNotice(data.detail);
        } else {
          setError(data.detail ?? "Invalid email or password.");
        }
        return;
      }

      // Belt and braces. Signing out clears the cache, but not every route into
      // this page goes through it - an expired session, a bookmarked /login, or
      // a second person using the same browser all arrive here directly.
      clearQueryCache();
      setAccessToken(data.access);
      router.push("/dashboard");
    } catch {
      setError(
        "Could not connect to server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.heart}>♥</span>
          <span style={styles.brandName}>MomCare</span>
        </div>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your hospital account</p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="owner@yourhospital.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {notice && <p style={styles.notice}>{notice}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={styles.link}>
            Register your hospital
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ede8f5",
    padding: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px 44px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 24px rgba(139,120,196,0.12)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "28px",
  },
  heart: { color: "#e07060", fontSize: "20px" },
  brandName: { fontWeight: 700, fontSize: "18px", color: "#2d1f5e" },
  heading: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: "6px",
  },
  sub: { fontSize: "14px", color: "#6b7280", marginBottom: "28px" },
  field: { marginBottom: "18px" },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
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
  notice: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13.5px",
    marginBottom: "16px",
    lineHeight: 1.5,
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
  footer: {
    textAlign: "center",
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "24px",
  },
  link: { color: "#8b78c4", fontWeight: 600, textDecoration: "none" },
};
