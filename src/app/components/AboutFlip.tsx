"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Watch, Activity, BellRing, UserCheck } from "lucide-react";

const ROADMAP = [
  {
    icon: Watch,
    title: "Vitals Captured",
    body: "From a wearable band, or entered directly by staff.",
  },
  {
    icon: Activity,
    title: "Risk Scored via Engine",
    body: "Checked against documented obstetric thresholds the instant it arrives.",
  },
  {
    icon: BellRing,
    title: "Escalation Triggered",
    body: "An abnormal reading reaches the assigned clinician first.",
  },
  {
    icon: UserCheck,
    title: "Clinician Responds",
    body: "Unanswered past the tier's deadline, it climbs to the hospital admin.",
  },
];

export function AboutFlip() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <section
      className="py-24"
      style={{ background: "var(--bg)", scrollMarginTop: 110 }}
      id="about"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto px-6 items-center">
        {/* ── Left: copy + trigger ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="inline-block font-bold text-xs tracking-wider uppercase px-3 py-1 rounded-full w-fit mb-5"
            style={{ background: "#ccfbf1", color: "var(--primary-dark)" }}
          >
            About MomCare
          </span>

          <h2
            className="text-4xl md:text-[44px] font-bold tracking-tight leading-[1.15] mb-5"
            style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
          >
            Continuous risk monitoring{" "}
            <span style={{ color: "var(--primary)" }}>across every ward.</span>
          </h2>

          <p className="text-lg leading-relaxed text-slate-600 max-w-lg mb-8">
            Between scheduled visits, a warning sign has no way to reach anyone.
            MomCare closes that gap: a wearable or a staff-entered reading,
            checked against documented obstetric thresholds the moment it
            arrives, with an escalation ladder that keeps climbing — clinician,
            then hospital admin — until someone actually answers.
          </p>

          <button
            onClick={() => setIsFlipped((f) => !f)}
            className="inline-flex items-center gap-2 font-semibold text-sm border-b-2 pb-1 transition-colors"
            style={{
              color: "var(--text)",
              borderColor: isFlipped ? "var(--primary)" : "transparent",
            }}
          >
            {isFlipped ? "Back to the photo" : "See how it works"}
            <motion.span animate={{ x: isFlipped ? 4 : 0 }}>→</motion.span>
          </button>
        </motion.div>

        {/* ── Right: 3D flip card ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ perspective: 1000 }}
          className="w-full"
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 16,
            }}
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
            className="relative h-[440px] md:h-[500px] w-full rounded-3xl"
          >
            {/* Front — the photo */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl"
              style={{
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
            >
              <Image
                src="/images/wearable-vitals.jpg"
                alt="A wearable device displaying a live heart-rate reading"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-6 left-6 bg-white rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                <span
                  className="text-2xl font-bold"
                  style={{
                    color: "var(--primary)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  24/7
                </span>
                <span className="text-xs leading-tight text-slate-500 font-medium">
                  Continuous
                  <br />
                  monitoring
                </span>
              </div>
            </div>

            {/* Back — the roadmap */}
            <div
              className="absolute inset-0 rounded-3xl bg-white border border-slate-100 shadow-2xl p-6 md:p-10 flex flex-col justify-center overflow-y-auto"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(0)",
              }}
            >
              <h3
                className="text-base md:text-lg font-bold mb-4 md:mb-8"
                style={{
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                }}
              >
                From a reading to a decision
              </h3>
              <ol className="relative flex flex-col gap-4 md:gap-8">
                <div
                  className="absolute left-[15px] md:left-[19px] top-2 bottom-2 border-l-2 border-dashed"
                  style={{ borderColor: "#e2e8f0" }}
                  aria-hidden
                />
                {ROADMAP.map((step) => (
                  <li
                    key={step.title}
                    className="relative flex items-start gap-3 md:gap-4"
                  >
                    <span
                      className="relative z-10 flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white border-2"
                      style={{
                        borderColor: "var(--primary)",
                        color: "var(--primary)",
                      }}
                    >
                      <step.icon
                        size={14}
                        strokeWidth={2.5}
                        className="md:hidden"
                      />
                      <step.icon
                        size={17}
                        strokeWidth={2.5}
                        className="hidden md:block"
                      />
                    </span>
                    <div className="pt-1 md:pt-1.5">
                      <div className="text-sm font-semibold text-slate-900">
                        {step.title}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
