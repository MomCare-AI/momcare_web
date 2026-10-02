"use client";

import { useState } from "react";
import Link from "next/link";

import {
  NgoResetError,
  requestNgoPasswordReset,
} from "@/features/ngo/services/ngoPasswordReset";
import { AuthSplitLayout } from "../../../_components/AuthSplitLayout";
import styles from "../../../login/login.module.css";

export function NgoForgotPasswordClient() {
  const [sent, setSent] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
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
      setError("Enter the business email you sign in with.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestNgoPasswordReset(email);
      // The screen reads the same whether or not the address has an account,
      // so it cannot be used to find out which NGOs use MomCare.
      setPreviewPath(result.previewPath);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof NgoResetError
          ? err.message
          : "Could not send the link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      variant="ngo"
      headline={
        <>
          Back in, <span className="text-teal-200">safely</span>.
        </>
      }
      pillars={[
        { k: "One hour", v: "Before the link expires" },
        { k: "Once", v: "Then it stops working" },
        { k: "Your inbox", v: "And nowhere else" },
      ]}
    >
      {sent ? (
        <div className={styles.form}>
          <span className={styles.eyebrow}>Check your email</span>
          <h1 className={styles.heading}>Link sent</h1>
          <p className={styles.sub}>
            If that address belongs to a MomCare NGO account, a link to set a
            new password is on its way. It works once and expires in an hour.
          </p>
          <p className={styles.sub}>
            Nothing arrived? Check the spam folder, and confirm you used the
            business email your organization was verified with.
          </p>
          <p className={styles.notice}>
            Preview: NGO emails are not sent yet.
            {previewPath && (
              <>
                {" "}
                <Link href={previewPath} className={styles.link}>
                  Open the demo reset link
                </Link>
              </>
            )}
          </p>
          <p className={styles.footer}>
            <Link href="/login?portal=ngo" className={styles.link}>
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <span className={styles.eyebrow}>NGO account recovery</span>
          <h1 className={styles.heading}>Forgot your password</h1>
          <p className={styles.sub}>
            Enter the business email you sign in with and we will send a link to
            set a new password.
          </p>

          <div className={styles.field2}>
            <label htmlFor="email" className={styles.label}>
              Business email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="ngo@example.org"
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
            <Link href="/login?portal=ngo" className={styles.link}>
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
}
