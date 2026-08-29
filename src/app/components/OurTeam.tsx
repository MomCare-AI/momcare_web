"use client";

import Image from "next/image";
import { motion } from "motion/react";

// A real photo where we have one, an initials avatar where we don't — never
// an unrelated stock photo captioned with a real teammate's name.
const TEAM = [
  {
    name: "Zaka Ullah Waheed",
    role: "Full-Stack Developer",
    photo: "/team/Zaka.png",
    color: "var(--primary)",
    offset: "md:mt-0",
  },
  {
    name: "Ahmed Nawaz",
    role: "AI/ML Expert",
    initial: "A",
    color: "var(--coral)",
    offset: "md:mt-16",
  },
  {
    name: "Saleha Aftab Satti",
    role: "Mobile App Developer",
    initial: "S",
    color: "var(--text)",
    offset: "md:mt-0",
  },
] as const;

function Connector({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="64"
      height="56"
      viewBox="0 0 64 56"
      fill="none"
      className={`mx-auto ${flip ? "-scale-x-100" : ""}`}
      aria-hidden
    >
      <path
        d="M8 4 C 8 30, 20 36, 32 52"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        strokeDasharray="4 5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OurTeam() {
  return (
    <section
      className="py-24 bg-white"
      id="built"
      style={{ scrollMarginTop: 110 }}
    >
      <div className="max-w-2xl mx-auto px-6 text-center mb-6">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="inline-block text-xs font-bold uppercase tracking-[0.12em] mb-3"
          style={{ color: "var(--primary)" }}
        >
          The Team
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="text-4xl md:text-5xl font-bold tracking-tight"
          style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
        >
          Our Team
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-4 text-base text-zinc-500"
        >
          Three people building MomCare — no fake coach grid, just who actually
          wrote the code.
        </motion.p>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-20 flex flex-wrap justify-center items-start gap-x-16 gap-y-20">
        {TEAM.map((person, i) => (
          <motion.div
            key={person.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.55,
              delay: i * 0.12,
              ease: [0.23, 1, 0.32, 1],
            }}
            className={`flex flex-col items-center text-center w-40 ${person.offset}`}
          >
            <div
              className="font-bold text-sm"
              style={{ color: "var(--primary)" }}
            >
              {person.name}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">{person.role}</div>

            <Connector flip={i % 2 === 1} />

            {"photo" in person ? (
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                <Image
                  src={person.photo}
                  alt={person.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "center 12%" }}
                />
              </div>
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white shadow-lg"
                style={{ background: person.color }}
              >
                {person.initial}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
