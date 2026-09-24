"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { API_BASE } from "@/core/api/apiBase";
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
      const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
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
        <Image
          src="/images/hero-prenatal-checkup.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 900px) 100vw, 40vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/85" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-10 p-8 text-center md:p-12">
          <Image
            src="/avatars/logo.png"
            alt="MomCare"
            width={256}
            height={171}
            className="h-auto w-40 md:w-48"
            priority
          />

          <div className="flex flex-col items-center gap-8">
            <h2 className="mb-4 max-w-[15ch] text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">
              Back in, <span className="text-blue-200">safely</span>.
            </h2>

            <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                { k: "One hour", v: "Before the link expires" },
                { k: "Once", v: "Then it stops working" },
                { k: "Your inbox", v: "And nowhere else" },
              ].map((item) => (
                <div key={item.k} className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-white">
                    {item.k}
                  </span>
                  <span className="text-[10.5px] leading-tight text-blue-100">
                    {item.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
