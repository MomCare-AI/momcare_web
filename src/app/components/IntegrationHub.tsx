"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Watch,
  ClipboardEdit,
  ClipboardList,
  BellRing,
  User,
  Activity,
  Clock,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/animate-ui/components/animate/tooltip";

// Real inputs and outputs of the actual risk engine — not fabricated EHR
// vendor integrations. MomCare doesn't integrate with Epic/Cerner/
// Athenahealth/Allscripts; nothing here should imply it does.
const LEFT_NODES = [
  {
    icon: Watch,
    label: "Wearable Devices",
    detail:
      "A patient's wearable band streams vitals straight into the risk engine.",
  },
  {
    icon: ClipboardEdit,
    label: "Staff-Entered Readings",
    detail:
      "No device attached? Hospital staff can log a reading by hand instead.",
  },
];
const RIGHT_NODES = [
  {
    icon: ClipboardList,
    label: "Risk Assessments",
    detail:
      "Every reading is scored against documented obstetric thresholds instantly.",
  },
  {
    icon: BellRing,
    label: "Escalation Alerts",
    detail:
      "An abnormal score raises an alert that climbs the ladder if unanswered.",
  },
];

const drawLine = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] as const },
  },
};

function Node({
  icon: Icon,
  label,
  detail,
  align,
  delay,
}: {
  icon: typeof Watch;
  label: string;
  detail: string;
  align: "left" | "right";
  delay: number;
}) {
  return (
    <Tooltip side={align === "left" ? "left" : "right"}>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, x: align === "left" ? -16 : 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay }}
          whileHover={{
            y: -2,
            boxShadow: "0 8px 20px rgba(67, 97, 238, 0.18)",
          }}
          className="inline-flex items-center gap-2.5 bg-white rounded-xl shadow-md px-5 py-3 whitespace-nowrap cursor-default"
        >
          <Icon
            size={16}
            strokeWidth={2.25}
            style={{ color: "var(--primary)" }}
          />
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px]">{detail}</TooltipContent>
    </Tooltip>
  );
}

function FlipCard({
  icon: Icon,
  iconColor,
  title,
  frontBody,
  frontMockup,
  backTitle,
  backPoints,
  delay,
}: {
  icon: typeof Watch;
  iconColor: string;
  title: string;
  frontBody: string;
  frontMockup: ReactNode;
  backTitle: string;
  backPoints: string[];
  delay: number;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay }}
      className="[perspective:1400px]"
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setFlipped((f) => !f);
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
        style={{ willChange: "transform" }}
        className="relative min-h-[400px] cursor-pointer [transform-style:preserve-3d]"
      >
        {/* Front — frosted glass over a soft blue gradient */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] rounded-3xl p-8 shadow-xl border flex flex-col"
          style={{
            background:
              "linear-gradient(155deg, rgba(191, 219, 254, 0.75) 0%, rgba(255, 255, 255, 0.35) 55%, rgba(255, 255, 255, 0.55) 100%)",
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            borderColor: "rgba(255, 255, 255, 0.8)",
            boxShadow:
              "0 20px 44px rgba(67, 97, 238, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 40px rgba(255, 255, 255, 0.15)",
            willChange: "transform, backdrop-filter",
            transform: "translateZ(0)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={18} style={{ color: iconColor }} strokeWidth={2.5} />
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            </div>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255, 255, 255, 0.55)" }}
            >
              <RotateCw size={13} className="text-slate-400" aria-hidden />
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">{frontBody}</p>
          {frontMockup}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] rounded-3xl p-8 shadow-xl flex flex-col justify-center"
          style={{
            background: iconColor,
            willChange: "transform",
            transform: "rotateY(180deg) translateZ(0)",
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-5">{backTitle}</h3>
          <ul className="flex flex-col gap-3.5">
            {backPoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2
                  size={15}
                  className="mt-0.5 flex-shrink-0 text-white/80"
                  strokeWidth={2.5}
                />
                <span className="text-sm leading-relaxed text-white/90">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function IntegrationHub() {
  return (
    <section
      id="engine"
      className="py-24"
      style={{
        background:
          "linear-gradient(180deg, #eef2ff 0%, #f6f8fe 45%, #f8fafc 100%)",
        scrollMarginTop: 110,
      }}
    >
      <div className="max-w-2xl mx-auto px-6 text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold tracking-tight"
          style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
        >
          One Engine Behind Every Reading
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-4 text-base text-slate-500 max-w-2xl mx-auto"
        >
          Vitals come in from wherever your hospital already collects them — the
          same engine scores every one and routes what happens next.
        </motion.p>
      </div>

      {/* ── Hub ─────────────────────────────────────────────── */}
      <TooltipProvider>
        <div className="relative max-w-5xl mx-auto px-6">
          <svg
            className="hidden md:block absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <motion.path
              d="M 20 27 C 35 27, 35 46, 50 46"
              stroke="#e2e8f0"
              strokeWidth="0.6"
              variants={drawLine}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            />
            <motion.path
              d="M 20 65 C 35 65, 35 50, 50 50"
              stroke="#e2e8f0"
              strokeWidth="0.6"
              variants={drawLine}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
            />
            <motion.path
              d="M 80 27 C 65 27, 65 46, 50 46"
              stroke="#e2e8f0"
              strokeWidth="0.6"
              variants={drawLine}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.05 }}
            />
            <motion.path
              d="M 80 65 C 65 65, 65 50, 50 50"
              stroke="#e2e8f0"
              strokeWidth="0.6"
              variants={drawLine}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.15 }}
            />
          </svg>

          <div className="relative flex items-center justify-between md:justify-center md:gap-24 flex-col md:flex-row gap-6">
            <div className="flex flex-col gap-4 order-2 md:order-1">
              {LEFT_NODES.map((n, i) => (
                <Node key={n.label} {...n} align="left" delay={i * 0.12} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="relative order-1 md:order-2"
            >
              <span
                className="absolute -inset-6 rounded-full blur-2xl opacity-20"
                style={{ background: "var(--primary)" }}
                aria-hidden
              />
              <span
                className="relative inline-flex items-center gap-2.5 rounded-full px-8 py-3 shadow-2xl text-white font-semibold"
                style={{ background: "var(--text)" }}
              >
                <Image
                  src="/avatars/logo.png"
                  alt="MomCare"
                  width={100}
                  height={24}
                  style={{
                    objectFit: "contain",
                    height: "20px",
                    width: "auto",
                    filter: "brightness(0) invert(1)",
                  }}
                />
                Engine
              </span>
            </motion.div>

            <div className="flex flex-col gap-4 order-3">
              {RIGHT_NODES.map((n, i) => (
                <Node
                  key={n.label}
                  {...n}
                  align="right"
                  delay={0.06 + i * 0.12}
                />
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* ── Trunk line into the cards ───────────────────────── */}
      <div className="relative max-w-6xl mx-auto px-6 mt-16">
        {/* Decorative colour blobs — a glass panel needs something with
            actual colour and contrast behind it to visibly blur, or the
            frosted effect just reads as plain white. */}
        <div
          className="pointer-events-none absolute -top-16 left-[6%] w-72 h-72 rounded-full opacity-70"
          style={{
            background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)",
            filter: "blur(34px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-24 right-[8%] w-80 h-80 rounded-full opacity-60"
          style={{
            background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-[38%] w-72 h-72 rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
            filter: "blur(36px)",
          }}
          aria-hidden
        />

        <svg
          className="hidden md:block absolute -top-16 left-0 w-full h-16"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <motion.path
            d="M 50 0 L 50 40 L 16.6 40 L 16.6 100 M 50 40 L 83.3 40 L 83.3 100 M 50 40 L 50 100"
            stroke="#e2e8f0"
            strokeWidth="0.6"
            variants={drawLine}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          />
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Card 1 — Vitals Timeline */}
          <FlipCard
            icon={Activity}
            iconColor="var(--primary)"
            title="Vitals Timeline"
            frontBody="Every reading attached to the pregnancy's gestational age, charted the moment it arrives."
            delay={0.1}
            backTitle="Behind the reading"
            backPoints={[
              "Heart rate, blood pressure, or temperature",
              "From a wearable band, or entered directly by staff",
              "Gestational age attached — 110 bpm means something different at 12 weeks than at 38",
            ]}
            frontMockup={
              <div className="bg-white/55 rounded-xl border border-white/70 shadow-sm backdrop-blur-sm p-4 mt-6">
                <div className="text-xs text-slate-400 mb-2">
                  Latest reading
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-slate-900">
                    142{" "}
                    <span className="text-sm font-medium text-slate-400">
                      bpm
                    </span>
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "#dcfce7", color: "#15803d" }}
                  >
                    Within range
                  </span>
                </div>
              </div>
            }
          />

          {/* Card 2 — Clinical Triage */}
          <FlipCard
            icon={ClipboardList}
            iconColor="var(--coral)"
            title="Clinical Triage"
            frontBody="Sorted into one of four documented tiers the instant a reading is scored."
            delay={0.22}
            backTitle="How triage works"
            backPoints={[
              "Stable · Moderate · High · Critical",
              "Documented obstetric thresholds, not a black-box score",
              "Every assessment records which reading and which rule fired",
              "Not yet signed off by a practising obstetrician — that review is in progress",
            ]}
            frontMockup={
              <div className="bg-white/55 rounded-xl border border-white/70 shadow-sm backdrop-blur-sm p-4 mt-6 flex flex-col gap-3">
                {[
                  { label: "Stable", pct: 30, color: "#22c55e" },
                  { label: "Moderate", pct: 55, color: "#eab308" },
                  { label: "High", pct: 78, color: "#f97316" },
                  { label: "Critical", pct: 95, color: "#dc2626" },
                ].map((tier) => (
                  <div key={tier.label}>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>{tier.label}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${tier.pct}%`,
                          background: tier.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            }
          />

          {/* Card 3 — Escalation Tracking */}
          <FlipCard
            icon={BellRing}
            iconColor="var(--text)"
            title="Escalation Tracking"
            frontBody="An unanswered alert climbs the ladder on a clock, not on someone remembering."
            delay={0.34}
            backTitle="How escalation works"
            backPoints={[
              "Reaches the assigned clinician first",
              "Climbs to the hospital's admin if unanswered inside the tier's deadline",
              "Every step written to an append-only audit trail",
            ]}
            frontMockup={
              <div className="bg-white/55 rounded-xl border border-white/70 shadow-sm backdrop-blur-sm p-4 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400">
                    Continuous monitoring
                  </span>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-3">
                  24/7
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: User, label: "Clinician" },
                    { icon: ClipboardList, label: "Hospital admin" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-100"
                    >
                      <row.icon size={12} className="text-slate-400" />
                      <span className="text-[11px] text-slate-600">
                        {row.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
