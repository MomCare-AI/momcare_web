"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { API_BASE } from "@/core/api/apiBase";
import { PulseField } from "../../../../login/PulseField";
import styles from "../../../../login/login.module.css";

/**
 * The page the emailed reset link opens.
 *
 * The uid and token come from the URL and are never shown — they are a
 * credential, and a credential on screen is one somebody can photograph.
 *
 * The backend now exposes a dedicated verify-reset-token check, meant to be
 * called before the set-password form is shown — a deliberate change from an
 * earlier "never check on load" design, now that there's a real endpoint for
 * exactly this. So a dead link is caught immediately on page load, not only
 * after someone has typed a new password and submitted it.
 */
/**
 * DRF wraps validation messages in lists, even when a serializer raised a
 * single string — {"detail": ["..."]}. Rendering that array happens to look
 * right, which is what makes it easy to miss: the text appears, while any code
 * checking the shape silently takes the wrong branch.
 */
function firstMessage(value: unknown): string | null {
  if (Array.isArray(value))
    return typeof value[0] === "string" ? value[0] : null;
  return typeof value === "string" ? value : null;
}

export function ResetPasswordPageClient({
  uid,
  token,
}: {
  uid: string;
  token: string;
}) {
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Holds the server's own wording for a link that cannot be retried.
  const [dead, setDead] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-reset-token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, token }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setDead(
            firstMessage(data?.detail) ?? "This link is no longer valid."
          );
        }
      } catch {
        if (!cancelled) {
          setDead("Could not connect to the server. Check your connection.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (!password) {
      setError("Choose a new password.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // The server returns the password validator's own words — "too short",
        // "too common", "too similar to your email". They are more useful than
        // anything this page could invent, so they are shown as written.
        // validate_password() is called from the serializer's whole-object
        // validate(), not a per-field validate_new_password() — DRF nests
        // that under non_field_errors, not new_password.
        const detail =
          firstMessage(data?.detail) ??
          firstMessage(data?.new_password) ??
          firstMessage(data?.non_field_errors);

        // A link that is expired or already used cannot be retried, so the form
        // is replaced rather than left there inviting another attempt.
        if (detail && /link/i.test(detail)) {
          setDead(detail);
          return;
        }
        setError(detail ?? "Could not set your password. Please try again.");
        return;
      }

      setDone(true);
    } catch {
      setError("Could not connect to the server. Check your connection.");
    } finally {
      setSubmitting(false);
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
          A new key, <em>only yours</em>.
        </p>

        <div className={styles.readout}>
          <span>
            <b>Signed out</b>Everywhere else
          </span>
          <span>
            <b>Single use</b>This link ends here
          </span>
          <span>
            <b>Eight or more</b>Characters, not a word
          </span>
        </div>
      </section>

      <section className={styles.panel}>
        {checking ? (
          <div className={styles.form}>
            <span className={styles.eyebrow}>Account recovery</span>
            <h1 className={styles.heading}>Checking your link…</h1>
          </div>
        ) : done ? (
          <div className={styles.form}>
            <span className={styles.eyebrow}>All set</span>
            <h1 className={styles.heading}>Password changed</h1>
            <p className={styles.sub}>
              You can sign in with your new password now. Any other device that
              was signed in to this account has been signed out.
            </p>
            <p className={styles.footer}>
              <Link href="/login" className={styles.link}>
                Go to sign in
              </Link>
            </p>
          </div>
        ) : dead ? (
          <div className={styles.form}>
            <span className={styles.eyebrow}>Link no longer valid</span>
            <h1 className={styles.heading}>This link has expired</h1>
            <p className={styles.sub}>{dead}</p>
            <p className={styles.sub}>
              Reset links last one hour and work once. Requesting a new one
              takes a moment.
            </p>
            <p className={styles.footer}>
              <Link href="/forgot-password" className={styles.link}>
                Request a new link
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <span className={styles.eyebrow}>Account recovery</span>
            <h1 className={styles.heading}>Set a new password</h1>
            <p className={styles.sub}>
              Choose something you have not used elsewhere. Setting it signs
              this account out on every other device.
            </p>

            <div className={styles.field2}>
              <label htmlFor="password" className={styles.label}>
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                autoFocus
                className={styles.input}
              />
            </div>

            <div className={styles.field2}>
              <label htmlFor="confirm" className={styles.label}>
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                className={styles.input}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className={styles.button}
            >
              {submitting ? "Setting…" : "Set password"}
            </button>

            <p className={styles.footer}>
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
