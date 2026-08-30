"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";

export function EngineShowcase() {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

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
            ref={videoRef}
            className="w-full aspect-video object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/iot-device.mp4" type="video/mp4" />
          </video>

          <motion.button
            type="button"
            onClick={toggleMute}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className="absolute bottom-5 right-5 flex items-center justify-center w-11 h-11 rounded-full bg-white/90 backdrop-blur shadow-lg"
            style={{ color: "var(--primary)" }}
          >
            {isMuted ? (
              <VolumeX size={19} strokeWidth={2.25} />
            ) : (
              <Volume2 size={19} strokeWidth={2.25} />
            )}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
