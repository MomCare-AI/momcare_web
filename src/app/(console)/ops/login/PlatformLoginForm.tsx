"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

import { signInPlatformAdmin } from "@/features/platform-admin/services/platformSignIn";

const INPUT =
  "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-100 placeholder:text-slate-500 focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all";

export function PlatformLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    // Read the fields directly so a password manager's autofill is seen.
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await signInPlatformAdmin(email, password);
      router.push("/platform");
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Could not connect to the server."
          : err instanceof Error
            ? err.message
            : "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300">
            <ShieldCheck size={20} aria-hidden />
          </span>
          <div>
            <div className="text-slate-100 font-semibold leading-tight">
              MomCare
            </div>
            <div className="text-slate-400 text-sm leading-tight">
              Platform console
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block">
            <span className="sr-only">Email address</span>
            <div className="relative">
              <Mail
                size={17}
                aria-hidden
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Email address"
                className={INPUT}
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Password</span>
            <div className="relative">
              <Lock
                size={17}
                aria-hidden
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                className={`${INPUT} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff size={17} aria-hidden />
                ) : (
                  <Eye size={17} aria-hidden />
                )}
              </button>
            </div>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white font-semibold py-3 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
