"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { ngoRepository } from "../repositories/ngoRepository";
import type { NgoService } from "../types";

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-transparent focus:bg-white focus:ring-2 focus:ring-teal-600";
const LABEL =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const SERVICES: { value: NgoService; label: string; hint: string }[] = [
  { value: "bands", label: "Health bands", hint: "Supply bands to mothers" },
  { value: "ambulance", label: "Ambulance", hint: "Emergency transport" },
];

/** "Apply for NGO access" — frontend-only until the backend has an NGO tenant. */
export function NgoAccessRequestForm() {
  const [services, setServices] = useState<NgoService[]>([]);
  const submit = useMutation({ mutationFn: ngoRepository.submitAccessRequest });

  const toggle = (s: NgoService) =>
    setServices((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]
    );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    submit.mutate({
      organizationName: text("organizationName"),
      contactName: text("contactName"),
      email: text("email"),
      phone: text("phone"),
      country: text("country"),
      services,
      message: text("message"),
    });
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/">
          <Image
            src="/avatars/logo.png"
            alt="MomCare"
            width={256}
            height={171}
            className="h-auto w-28"
          />
        </Link>

        {submit.isSuccess ? (
          <div className="mt-8 text-center">
            <CheckCircle2
              size={44}
              className="mx-auto text-teal-600"
              aria-hidden
            />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Request recorded
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              NGO onboarding is in preview, so this request has not been sent to
              the MomCare team yet. Once it is live, accounts are created after
              a review.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-teal-600 px-5 py-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-teal-600">
                NGO access
              </span>
              <h1 className="text-3xl font-bold text-slate-900">
                Apply for NGO access
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                For registered NGOs that supply health bands or run ambulance
                services. We review each application before creating an account.
              </p>
            </div>

            <div>
              <label htmlFor="organizationName" className={LABEL}>
                Organization name
              </label>
              <input
                id="organizationName"
                name="organizationName"
                required
                autoComplete="organization"
                className={INPUT}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contactName" className={LABEL}>
                  Contact person
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  required
                  autoComplete="name"
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="country" className={LABEL}>
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  className={INPUT}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={LABEL}>
                  Business email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ngo@example.org"
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="phone" className={LABEL}>
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={INPUT}
                />
              </div>
            </div>

            <fieldset>
              <legend className={LABEL}>What do you provide?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {SERVICES.map(({ value, label, hint }) => {
                  const on = services.includes(value);
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors ${
                        on
                          ? "border-teal-600 bg-teal-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(value)}
                        className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                      />
                      <span>
                        <span className="block font-medium text-slate-900">
                          {label}
                        </span>
                        <span className="text-slate-500">{hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="message" className={LABEL}>
                Anything we should know? (optional)
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className={INPUT}
              />
            </div>

            {submit.error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {submit.error.message}
              </p>
            )}

            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full rounded-xl bg-teal-600 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-teal-700 disabled:cursor-progress disabled:bg-slate-300"
            >
              {submit.isPending ? "Submitting…" : "Submit request"}
            </button>

            <p className="border-t border-slate-200 pt-5 text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-teal-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
