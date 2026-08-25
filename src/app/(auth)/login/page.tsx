"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/core/api/authFetch";
import { clearQueryCache } from "@/core/query/queryClient";

import { API_BASE } from "@/core/api/apiBase";
import { PulseField } from "./PulseField";
import styles from "./login.module.css";

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
    <div className={styles.page}>
      <section className={styles.field}>
        <PulseField />

        <div className={styles.mark}>
          <span className={styles.markName}>MomCare</span>
          <span className={styles.markRule} />
          <span className={styles.markKind}>Remote Patient Monitoring</span>
        </div>

        <p className={styles.claim}>
          Every reading, <em>watched</em>.
        </p>

        <div className={styles.readout}>
          <span>
            <b>Continuous</b>Vitals from wearables
          </span>
          <span>
            <b>Graded</b>Risk on every reading
          </span>
          <span>
            <b>Escalating</b>Until someone answers
          </span>
        </div>
      </section>

      <section className={styles.panel}>
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <span className={styles.eyebrow}>Clinical Access</span>
          <h1 className={styles.heading}>Sign in</h1>
          <p className={styles.sub}>
            For registered hospital staff. Your account is created by your
            hospital administrator.
          </p>

          <div className={styles.field2}>
            <label htmlFor="email" className={styles.label}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="owner@yourhospital.com"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field2}>
            <div className={styles.labelRow}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <Link href="/forgot-password" className={styles.labelLink}>
                Forgot?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className={styles.input}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className={styles.footer}>
            Registering a hospital for the first time?{" "}
            <Link href="/register" className={styles.link}>
              Apply for access
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
