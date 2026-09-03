"use client";

import Image from "next/image";
import { motion } from "motion/react";

/**
 * The same three-part story already told on the login page's side panel
 * ("Continuous vitals, graded risk, an escalation ladder") — restated here
 * as a landing-page section since it's MomCare's actual product, not a
 * claim borrowed from anyone else's. Illustrations are the author's own.
 */
const PILLARS: {
  image: string;
  alt: string;
  color: string;
  eyebrow: string;
  title: string;
  body: string;
}[] = [
  {
    image: "/illustrations/continuous-vitals.jpg",
    alt: "A pregnant woman checking her smartwatch, with a live vitals graph beside her",
    color: "var(--primary)",
    eyebrow: "Continuous",
    title: "Vitals from wearables",
    body: "Blood pressure, heart rate and temperature reach the record between visits, not only at the next scheduled appointment.",
  },
  {
    image: "/illustrations/graded-risk.jpg",
    alt: "A pregnant woman reviewing her health plan status as active on a tablet",
    color: "var(--mint)",
    eyebrow: "Graded",
    title: "Risk on every reading",
    body: "Published obstetric thresholds score each reading — stable, moderate, high or critical — so a clinician knows how worried to be, not just that something crossed a line.",
  },
  {
    image: "/illustrations/escalating-alerts.jpg",
    alt: "A pregnant woman standing with a hand on her back and a hand on her belly",
    color: "var(--coral)",
    eyebrow: "Escalating",
    title: "Until someone answers",
    body: "An unanswered alert climbs — clinician, then ward, then admin — on a timed ladder, so a critical reading is never one missed notification from going unseen.",
  },
];

export function ThreePillars() {
  return (
    <section className="py-24" style={{ background: "var(--surface)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <p
            className="text-sm font-semibold tracking-wide uppercase mb-3"
            style={{ color: "var(--primary)" }}
          >
            How MomCare watches
          </p>
          <h2
            className="text-4xl md:text-[44px] font-bold tracking-tight leading-[1.1]"
            style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
          >
            One pipeline, three jobs.
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.eyebrow}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="rounded-3xl overflow-hidden border"
              style={{
                background: "var(--bg)",
                borderColor: "rgba(23, 41, 58, 0.06)",
              }}
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={pillar.image}
                  alt={pillar.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-8">
                <p
                  className="text-xs font-semibold tracking-wide uppercase mb-2"
                  style={{ color: pillar.color }}
                >
                  {pillar.eyebrow}
                </p>
                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: "var(--text)" }}
                >
                  {pillar.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{pillar.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
