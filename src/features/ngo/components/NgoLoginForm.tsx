"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { NgoAuthError, signInNgo } from "../services/ngoAuth";

const REMEMBERED_KEY = "momcare_ngo_remembered_email";
const INPUT =
  "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all";

/** The back face of the login card. Demo auth only — see services/ngoAuth. */
export function NgoLoginForm({
  onSwitchToHospital,
}: {
  onSwitchToHospital: () => void;
}) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const rememberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBERED_KEY);
      if (saved && emailRef.current) {
        emailRef.current.value = saved;
        if (rememberRef.current) rememberRef.current.checked = true;
      }
    } catch {
      /* storage unavailable — nothing to restore */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your business email and password.");
      return;
    }
    try {
      if (form.get("remember")) localStorage.setItem(REMEMBERED_KEY, email);
      else localStorage.removeItem(REMEMBERED_KEY);
    } catch {
      /* ignore */
    }
    setLoading(true);
    try {
      await signInNgo(email, password);
      router.push("/ngo/dashboard");
    } catch (err) {
      setError(
        err instanceof NgoAuthError ? err.message : "Could not sign in."
      );
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-md space-y-6"
    >
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-teal-600 mb-3">
          NGO Access
        </span>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign in</h2>
        <p className="text-sm text-slate-500">
          For registered NGO organizations. Your organization&rsquo;s account is
          created for authorized NGO staff.
        </p>
      </div>

      <div>
        <label
          htmlFor="ngo-email"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2"
        >
          Business email
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
            id="ngo-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="ngo@example.org"
            required
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="ngo-password"
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
            id="ngo-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className={`${INPUT} pr-11`}
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

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          ref={rememberRef}
          name="remember"
          type="checkbox"
          className="rounded border-slate-300 text-teal-600 focus:ring-teal-600"
        />
        Remember me
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-teal-600 py-3.5 font-medium text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow disabled:bg-slate-300 disabled:cursor-progress"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="pt-6 border-t border-slate-200 text-sm text-slate-500">
        Are you hospital staff?{" "}
        <button
          type="button"
          onClick={onSwitchToHospital}
          className="font-semibold text-teal-600 hover:underline"
        >
          Go to hospital login
        </button>
      </p>
    </form>
  );
}
