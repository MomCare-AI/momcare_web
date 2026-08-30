"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/core/api/authFetch";
import { clearQueryCache } from "@/core/query/queryClient";

import { API_BASE } from "@/core/api/apiBase";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const REMEMBERED_EMAIL_KEY = "momcare_remembered_email";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // A hospital still under review isn't a failed login — it's a status update,
  // so it gets its own calmer treatment rather than the red error style.
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Remembers only the email — never the password or session — by writing
  // straight to the DOM rather than a controlled value, the same reason the
  // submit handler reads FormData directly: a value+onChange input fights
  // a password manager's own autofill.
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved && emailRef.current) {
      emailRef.current.value = saved;
      setRememberMe(true);
    }
  }, []);

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

    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
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
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
      {/* ── Left: brand panel — full-bleed photo, heavy overlay ────────── */}
      <section className="relative w-full md:w-[40%] min-h-[320px] md:h-full flex-shrink-0 flex flex-col justify-center p-8 md:p-12 overflow-hidden">
        <Image
          src="/images/hero-prenatal-checkup.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 900px) 100vw, 40vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/85" />

        {/* Logo up top, headline + pillars below — stacked in normal flow
            so nothing overlaps, the whole block centered as a group. */}
        <div className="relative z-10 flex flex-col items-center text-center gap-10">
          <Image
            src="/avatars/logo.png"
            alt="MomCare"
            width={256}
            height={171}
            className="w-40 md:w-48 h-auto"
            priority
          />

          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center">
              <h2 className="max-w-[15ch] text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 text-balance">
                Every reading, <span className="text-blue-200">watched</span>.
              </h2>
              <p className="max-w-[36ch] text-sm leading-relaxed text-blue-100">
                Continuous vitals, graded risk, and an escalation ladder that
                keeps climbing until someone answers.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                { k: "Continuous", v: "Vitals from wearables" },
                { k: "Graded", v: "Risk on every reading" },
                { k: "Escalating", v: "Until someone answers" },
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

      {/* ── Right: authentication form ───────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center p-8 lg:p-16 min-h-screen bg-white">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-md space-y-6"
        >
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-blue-600 mb-3">
              Clinical Access
            </span>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign in</h1>
            <p className="text-sm text-slate-500">
              For registered hospital staff. Your account is created by your
              hospital administrator.
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                size={17}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="owner@yourhospital.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                size={17}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff size={17} strokeWidth={2} aria-hidden />
                ) : (
                  <Eye size={17} strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {notice}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow disabled:bg-slate-300 disabled:cursor-progress"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
              <Lock size={12} strokeWidth={2.25} aria-hidden />
              <span>Row-Level Security · Tenant-Isolated Data</span>
            </div>
          </div>

          <p className="pt-6 border-t border-slate-200 text-sm text-slate-500">
            Registering a hospital for the first time?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:underline"
            >
              Apply for access
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
