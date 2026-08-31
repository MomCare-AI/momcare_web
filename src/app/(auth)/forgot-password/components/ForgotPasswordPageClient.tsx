"use client";

import { useState } from "react";
import Link from "next/link";

import { API_BASE } from "@/core/api/apiBase";
// The sign-in page owns this project's authentication look — the monitoring
// field, the ink-and-paper split, fields drawn as rules rather than boxes.
// Importing from it keeps one copy rather than a second that drifts.
import { PulseField } from "../../login/PulseField";
import styles from "../../login/login.module.css";

export function ForgotPasswordPageClient() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Read the field, not React state — a password manager fills the DOM
    // without firing the events React listens for.
    const email = String(
      new FormData(e.currentTarget).get("email") ?? ""
    ).trim();
    if (!email) {
      setError("Enter the email address you sign in with.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/password/reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // 429 is the rate limit. Saying so is kinder than a generic failure,
        // because the reader has usually just pressed the button twice.
        setError(
          res.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : (data?.detail ?? "Could not send the link. Please try again.")
        );
        return;
      }

      // The server answers identically whether or not the address is
      // registered, and so does this screen. Confirming that an address exists
      // would tell anyone who asks who works at which hospital.
      setSent(true);
    } catch {
      setError("Could not connect to the server. Check your connection.");
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
          Back in, <em>safely</em>.
        </p>

        <div className={styles.readout}>
          <span>
            <b>One hour</b>Before the link expires
          </span>
          <span>
            <b>Once</b>Then it stops working
          </span>
          <span>
            <b>Your inbox</b>And nowhere else
          </span>
        </div>
      </section>

      <section className={styles.panel}>
        {sent ? (
          <div className={styles.form}>
            <span className={styles.eyebrow}>Check your email</span>
            <h1 className={styles.heading}>Link sent</h1>
            <p className={styles.sub}>
              If that address belongs to a MomCare account, a link to set a new
              password is on its way. It works once and expires in an hour.
            </p>
            <p className={styles.sub}>
              Nothing arrived? Check the spam folder, and confirm you used the
              address your hospital invited you with.
            </p>
            <p className={styles.footer}>
              <Link href="/login" className={styles.link}>
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <span className={styles.eyebrow}>Account recovery</span>
            <h1 className={styles.heading}>Forgot your password</h1>
            <p className={styles.sub}>
              Enter the address you sign in with and we will send a link to set
              a new one.
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
                placeholder="you@yourhospital.com"
                required
                autoFocus
                className={styles.input}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <p className={styles.footer}>
              Remembered it?{" "}
              <Link href="/login" className={styles.link}>
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
