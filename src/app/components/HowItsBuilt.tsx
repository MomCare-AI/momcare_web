"use client";

import { motion } from "motion/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarGroup } from "@/components/animate-ui/components/animate/avatar-group";

// A decorative dot grid, standing in for the reference's abstract art tile —
// a few tinted dots (teal/coral/navy) scattered through an otherwise plain
// grid, echoing "most readings are stable, a few need attention."
function DotGrid() {
  const cols = 5;
  const rows = 4;
  const accents: Record<number, string> = {
    2: "var(--primary)",
    6: "#e2e8f0",
    9: "var(--coral)",
    13: "#e2e8f0",
    16: "var(--text)",
  };
  return (
    <div
      className="grid gap-3 md:gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => {
        const filled = i in accents;
        return (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: 0.015 * i }}
            className="block rounded-full aspect-square"
            style={{
              background: filled ? accents[i] : "#ffffff",
              border: filled ? "none" : "1px solid #e2e8f0",
              width: "clamp(10px, 2vw, 18px)",
            }}
          />
        );
      })}
    </div>
  );
}

export function HowItsBuilt() {
  return (
    <section className="py-24" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-6 text-center mb-16">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="inline-block text-xs font-bold uppercase tracking-[0.12em] mb-3"
          style={{ color: "var(--primary)" }}
        >
          How it&apos;s built
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="text-3xl md:text-5xl font-bold tracking-tight"
          style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
        >
          Two things a maternal health platform can&apos;t fake
        </motion.h2>
      </div>

      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Top-wide tile: Risk engine ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="md:col-span-2 rounded-3xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          style={{
            background: "#eef2ff",
            border: "1px solid rgba(67, 97, 238, 0.1)",
          }}
        >
          <div className="max-w-[220px] mx-auto md:mx-0">
            <DotGrid />
          </div>
          <div>
            <h3
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-display)",
              }}
            >
              Documented, not a black box.
            </h3>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-5">
              Every reading is sorted into one of four clinical tiers by rules
              anyone can read — not an opaque score nobody can explain.
            </p>
            <ul
              className="flex flex-col gap-2 text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              <li>Stable · Moderate · High · Critical</li>
              <li>Scored the moment a reading arrives</li>
              <li>Each assessment records which rule fired</li>
            </ul>
          </div>
        </motion.div>

        {/* ── Bottom-left tile: Escalation ladder ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-3xl p-8"
          style={{
            background: "#fff3ec",
            border: "1px solid rgba(249, 115, 22, 0.12)",
          }}
        >
          <AvatarGroup className="mb-6">
            <Avatar className="size-11 ring-2 ring-white">
              <AvatarImage
                src="/team/Zaka.png"
                alt="Zaka Ullah Waheed"
                className="object-cover"
                style={{ objectPosition: "center 12%" }}
              />
              <AvatarFallback>Z</AvatarFallback>
            </Avatar>
            <Avatar className="size-11 ring-2 ring-white">
              <AvatarFallback
                style={{ background: "var(--coral)", color: "#fff" }}
              >
                A
              </AvatarFallback>
            </Avatar>
            <Avatar className="size-11 ring-2 ring-white">
              <AvatarFallback
                style={{ background: "var(--text)", color: "#fff" }}
              >
                S
              </AvatarFallback>
            </Avatar>
          </AvatarGroup>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
          >
            Escalation ladder
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            An unanswered alert doesn&apos;t wait quietly — it climbs on a
            clock, and every step is written down.
          </p>
        </motion.div>

        {/* ── Bottom-right tile: honest disclosures, dark ────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-3xl p-8 flex flex-col justify-center"
          style={{ background: "var(--text)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.12em] mb-4"
            style={{ color: "#94a3b8" }}
          >
            Built honestly
          </span>
          <p className="text-lg md:text-xl font-bold leading-snug text-white mb-4">
            Not yet signed off by an obstetrician. Not yet live with row-level
            security. We say so.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clinical thresholds are documented but under clinical review. Tenant
            isolation runs in application code today, with a database-level
            second layer built, tested, and not yet in production.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
