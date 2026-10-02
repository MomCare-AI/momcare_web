"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  NgoResetError,
  resetNgoPassword,
  verifyNgoResetToken,
} from "@/features/ngo/services/ngoPasswordReset";
import { AuthSplitLayout } from "../../../../../_components/AuthSplitLayout";
import styles from "../../../../../login/login.module.css";

/**
 * The page an NGO reset link opens. Mirrors the hospital reset page: the link
 * is checked as soon as the page loads, so a dead link is caught before
 * anyone types a new password, and the uid and token are never shown.
 */
export function NgoResetPasswordClient({
  uid,
  token,
}: {
  uid: string;
  token: string;
}) {
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dead, setDead] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    verifyNgoResetToken(uid, token)
      .catch((err) => {
        if (cancelled) return;
        setDead(
          err instanceof NgoResetError
            ? err.message
            : "This link is no longer valid."
        );
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
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
      await resetNgoPassword(uid, token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof NgoResetError && err.kind === "dead_link") {
        // A used or expired link cannot be retried, so the form is replaced.
        setDead(err.message);
      } else {
        setError(
          err instanceof NgoResetError
            ? err.message
            : "Could not set your password. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      variant="ngo"
      headline={
        <>
          A new key, <span className="text-teal-200">only yours</span>.
        </>
      }
      pillars={[
        { k: "Signed out", v: "Everywhere else" },
        { k: "Single use", v: "This link ends here" },
        { k: "Eight or more", v: "Characters, not a word" },
      ]}
    >
      {checking ? (
        <div className={styles.form}>
          <span className={styles.eyebrow}>NGO account recovery</span>
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
            <Link href="/login?portal=ngo" className={styles.link}>
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
            Reset links last one hour and work once. Requesting a new one takes
            a moment.
          </p>
          <p className={styles.footer}>
            <Link href="/forgot-password/ngo" className={styles.link}>
              Request a new link
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <span className={styles.eyebrow}>NGO account recovery</span>
          <h1 className={styles.heading}>Set a new password</h1>
          <p className={styles.sub}>
            Choose something you have not used elsewhere. Setting it signs this
            account out on every other device.
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

          <button type="submit" disabled={submitting} className={styles.button}>
            {submitting ? "Setting…" : "Set password"}
          </button>

          <p className={styles.footer}>
            <Link href="/login?portal=ngo" className={styles.link}>
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
}
