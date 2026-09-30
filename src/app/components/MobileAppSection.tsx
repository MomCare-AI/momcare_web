"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  Activity,
  Apple,
  ArrowRight,
  BatteryFull,
  Dumbbell,
  MessageCircle,
  SignalHigh,
  Smartphone,
  Wifi,
} from "lucide-react";

// Real, scoped pillars from the patient app's own plan
// (docs/patient-app-plan.md §7a) — not invented feature claims. The app
// itself is not built yet (docs/PLAN.md §2 item 13: "Planned... Not built"),
// so this section markets a real, scoped, in-progress product, not a
// shipped one — the badge below says so plainly rather than linking to a
// Play Store listing that doesn't exist.
const APP_PILLARS = [
  {
    icon: Activity,
    label: "Vitals",
    detail: "Her own readings, synced straight from the wearable band.",
  },
  {
    icon: Apple,
    label: "Nutrition",
    detail: "Guidance scoped to each trimester, not generic advice.",
  },
  {
    icon: Dumbbell,
    label: "Exercise",
    detail: "Movement guidance safe for where she is in the pregnancy.",
  },
  {
    icon: MessageCircle,
    label: "Care team chat",
    detail: "A direct line to the hospital that's actually monitoring her.",
  },
];

function PhoneMockup() {
  return (
    <div
      className="relative mx-auto"
      style={{ width: 240, aspectRatio: "9 / 19" }}
    >
      <div
        className="absolute inset-0 rounded-[36px] p-2.5"
        style={{
          background: "var(--text)",
          boxShadow: "0 30px 60px rgba(23, 41, 58, 0.28)",
        }}
      >
        <div
          className="w-full h-full rounded-[26px] overflow-hidden flex flex-col relative"
          style={{
            background:
              "linear-gradient(165deg, #3648c9 0%, var(--primary) 30%, #7788f7 65%, #cfd8fc 100%)",
          }}
        >
          {/* Notch */}
          <div
            className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full z-10"
            style={{ width: 64, height: 18, background: "#0b1120" }}
            aria-hidden
          />

          {/* Status bar */}
          <div className="px-5 pt-3 flex items-center justify-between relative z-0">
            <span className="text-white text-[10px] font-semibold tabular-nums">
              9:41
            </span>
            <div className="flex items-center gap-1">
              <SignalHigh
                size={11}
                className="text-white/90"
                strokeWidth={2.2}
              />
              <Wifi size={11} className="text-white/90" strokeWidth={2.2} />
              <BatteryFull
                size={13}
                className="text-white/90"
                strokeWidth={2}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="px-5 pt-6">
            <Image
              src="/avatars/logo.png"
              alt="MomCare"
              width={100}
              height={24}
              style={{
                objectFit: "contain",
                height: "17px",
                width: "auto",
                filter: "brightness(0) invert(1)",
              }}
            />
          </div>

          {/* Illustration — the real MomCare logo, layered on soft depth
              rather than a single flat blurred circle, for a less
              placeholder-ish look. */}
          <div className="flex-1 flex items-center justify-center relative">
            <span
              className="absolute w-44 h-44 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.28) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <span
              className="absolute w-28 h-28 rounded-full"
              style={{
                background: "rgba(255,255,255,0.16)",
                boxShadow: "0 12px 40px rgba(15, 23, 42, 0.18)",
                backdropFilter: "blur(2px)",
              }}
              aria-hidden
            />
            <Image
              src="/avatars/logo.png"
              alt="MomCare"
              width={140}
              height={140}
              className="relative"
              style={{
                objectFit: "contain",
                width: "86px",
                height: "auto",
                filter:
                  "brightness(0) invert(1) drop-shadow(0 6px 16px rgba(15, 23, 42, 0.2))",
              }}
            />
          </div>

          {/* Copy + CTA */}
          <div className="px-6 pb-6 text-center relative z-0">
            <h3
              className="text-white text-[19px] font-bold mb-1.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Welcome Back!
            </h3>
            <p className="text-white/75 text-[10.5px] leading-relaxed mb-5 px-1">
              We&apos;re glad you&apos;re here — your vitals and your care team,
              always in reach.
            </p>
            <div
              className="rounded-full py-3 text-[12px] font-semibold flex items-center justify-center gap-1.5"
              style={{
                background: "#fff",
                color: "var(--primary-dark)",
                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.22)",
              }}
            >
              Let&apos;s get started
              <ArrowRight size={13} strokeWidth={2.5} />
            </div>
            {/* Home indicator */}
            <div
              className="mx-auto mt-4 rounded-full"
              style={{
                width: 90,
                height: 4,
                background: "rgba(255,255,255,0.4)",
              }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileAppSection() {
  return (
    <section className="section">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="section-eye">Patient Mobile App</span>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Her vitals, in her own pocket
          </h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-[440px] mb-8">
            A companion Flutter app for the patient herself — her own readings,
            trimester-scoped nutrition and exercise guidance, and a direct line
            to the hospital care team monitoring her.
          </p>

          <div className="flex flex-col gap-4 max-w-[380px] mb-10">
            {APP_PILLARS.map((p) => (
              <div key={p.label} className="flex items-start gap-3">
                <span
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    background: "#eef2ff",
                    color: "var(--primary)",
                  }}
                >
                  <p.icon size={16} strokeWidth={2.25} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {p.label}
                  </div>
                  <div className="text-xs text-slate-500">{p.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Coming-soon badge — no real Play Store listing exists yet, so
              this deliberately does not link anywhere. */}
          <div
            className="inline-flex items-center gap-3 rounded-xl px-5 py-3 opacity-90"
            style={{ background: "var(--text)" }}
            aria-disabled="true"
          >
            <Smartphone size={24} className="text-white" strokeWidth={1.75} />
            <div className="text-left">
              <div className="text-[10px] text-white/60 leading-none mb-1">
                Coming soon to
              </div>
              <div className="text-sm font-semibold text-white leading-none">
                Google Play
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}
