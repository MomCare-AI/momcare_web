"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function EngineShowcase() {
  return (
    <section className="py-24" style={{ background: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* ── Header row: headline left, copy + CTAs right ─────── */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-[44px] font-bold tracking-tight leading-[1.1] max-w-xl"
            style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
          >
            One Engine Behind{" "}
            <span style={{ color: "var(--primary)" }}>Every Reading.</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-md"
          >
            <p className="text-slate-600 leading-relaxed mb-6">
              A wearable reading or a staff-entered one reaches the same
              documented rules engine, scored the same way, escalated the same
              way — no matter which device or which ward it came from.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/register" className="btn-primary">
                Register your hospital
              </Link>
              <a href="#engine" className="btn-ghost">
                See how it works →
              </a>
            </div>
          </motion.div>
        </div>

        {/* ── Video card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative rounded-3xl overflow-hidden shadow-xl mb-10"
          style={{ boxShadow: "var(--neu-md)", background: "#0f1115" }}
        >
          <video
            className="w-full object-cover"
            style={{ height: "clamp(360px, 78vh, 760px)" }}
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/explode-view-wristband.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </div>
    </section>
  );
}
