"use client";

import { motion } from "motion/react";
import { ThumbsDown, ShieldCheck, Circle } from "lucide-react";

// Honest bullets only — real capabilities already documented elsewhere on
// the site, not invented claims like "EHR" or fabricated certifications.
const TRADITIONAL_POINTS = [
  "Periodic check-ups leave weeks of unmonitored blind spots",
  "Patient history split across paper charts and siloed clinic records",
  "An abnormal reading has no clock forcing a response",
  "Escalation often relies on the patient noticing something is wrong",
  "Risk is judged by memory and instinct, not documented rules",
  "Nothing written down if a warning sign got missed",
];

const MOMCARE_POINTS = [
  "Continuous vitals from a wearable or a staff-entered reading",
  "One patient timeline per pregnancy, scoped to your hospital",
  "Every reading scored against documented obstetric thresholds instantly",
  "A timed escalation ladder — clinician, then hospital admin",
  "Four clear risk tiers, not a black-box score",
  "Append-only audit trail — every step written down",
];

function ListBox({ points, dark }: { points: string[]; dark?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 md:p-6 ${dark ? "bg-white text-slate-900" : "bg-zinc-50"}`}
    >
      <ul className="flex flex-col gap-3 md:gap-4">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 md:gap-3">
            <Circle
              size={7}
              strokeWidth={2.5}
              className="mt-[6px] md:mt-[7px] flex-shrink-0 text-zinc-400"
            />
            <span className="text-xs md:text-sm leading-relaxed text-zinc-600">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ValuePillars() {
  return (
    <section className="py-16 md:py-24 bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-bold tracking-tight"
          style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
        >
          What Sets MomCare Apart
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-4 text-sm md:text-base text-zinc-600"
        >
          Compare the traditional maternal care experience with MomCare&apos;s
          continuous clinical monitoring.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto px-6 mt-10 md:mt-16">
        {/* ── Left: Traditional Care ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="relative mt-4 rounded-3xl p-6 md:p-12 bg-white shadow-xl ring-1 ring-black/5"
        >
          <span className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-white shadow-md rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-zinc-700 whitespace-nowrap">
            <ThumbsDown size={13} className="text-red-400" strokeWidth={2.5} />
            Traditional Care
          </span>

          <div className="text-center">
            <h3
              className="text-lg md:text-2xl font-bold"
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-display)",
              }}
            >
              Periodic, Fragmented Care
            </h3>
            <p className="mt-2 md:mt-3 text-xs md:text-sm text-zinc-500 max-w-sm mx-auto">
              Care built around scheduled visits leaves gaps that only show up
              after something has already gone wrong.
            </p>
          </div>

          <div className="border-t border-zinc-200 my-5 md:my-8" />

          <ListBox points={TRADITIONAL_POINTS} />
        </motion.div>

        {/* ── Right: MomCare Platform ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="relative mt-4 rounded-3xl p-6 md:p-12 shadow-xl"
          style={{ background: "var(--primary-dark)" }}
        >
          <span
            className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-white shadow-md rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold whitespace-nowrap"
            style={{ color: "var(--primary)" }}
          >
            <ShieldCheck size={13} strokeWidth={2.5} />
            The MomCare Standard
          </span>

          <div className="text-center">
            <h3
              className="text-lg md:text-2xl font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Continuous Maternal Monitoring
            </h3>
            <p className="mt-2 md:mt-3 text-xs md:text-sm text-slate-300 max-w-sm mx-auto">
              Every reading is scored the moment it arrives, and every
              unanswered alert climbs until someone responds.
            </p>
          </div>

          <div className="border-t border-slate-700 my-5 md:my-8" />

          <ListBox points={MOMCARE_POINTS} dark />
        </motion.div>
      </div>
    </section>
  );
}
