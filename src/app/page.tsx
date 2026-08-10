"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "motion/react";
import { animate, stagger } from "animejs";

// ── 3D Tilt Card (mouse-tracked) ────────────────────────────
function TiltCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useTransform(my, [0, 1], [8, -8]);
  const rotateY = useTransform(mx, [0, 1], [-8, 8]);

  return (
    <motion.div
      className={className}
      style={{ ...style, rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      whileHover={{ scale: 1.025, y: -8 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}

// ── Fade-up on scroll ────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  // ── Anime.js: hero headline word stagger ─────────────────
  useEffect(() => {
    // Hide words initially so anime.js controls the reveal
    document.querySelectorAll<HTMLElement>(".hero-word").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(48px)";
    });

    animate(".hero-word", {
      opacity: [0, 1],
      translateY: [48, 0],
      delay: stagger(75),
      duration: 950,
      ease: "outExpo",
    });

    animate(".hero-eyebrow", {
      opacity: [0, 1],
      translateX: [-28, 0],
      duration: 700,
      ease: "outExpo",
    });

    animate(".hero-sub", {
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 700,
      ease: "outExpo",
      delay: 420,
    });

    animate(".hero-actions", {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 600,
      ease: "outExpo",
      delay: 580,
    });
  }, []);

  return (
    <main className="landing">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <motion.nav
        className="nav"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="nav-logo">♥</span>
            <span className="nav-name">MomCare</span>
          </div>
          <div className="nav-links">
            <a href="#how" className="nav-link">
              How it works
            </a>
            <a href="#features" className="nav-link">
              For Doctors
            </a>
            <a href="#contact" className="nav-link">
              Contact
            </a>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
              <Link href="/login" className="nav-cta">
                Doctor Onboard
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          {/* Text side */}
          <div className="hero-text">
            <p className="hero-eyebrow" style={{ opacity: 0 }}>
              AI-Powered Maternal Health
            </p>
            <h1 className="hero-headline">
              {["Every", "Heartbeat,"].map((w, i) => (
                <span key={i} className="hero-word">
                  {w}{" "}
                </span>
              ))}
              <br />
              <span className="hero-accent">
                {["Watched", "Over."].map((w, i) => (
                  <span key={i} className="hero-word">
                    {w}{" "}
                  </span>
                ))}
              </span>
            </h1>
            <p className="hero-sub" style={{ opacity: 0 }}>
              MomCare connects IoT wristbands, AI risk analysis, and clinical
              dashboards — so no warning sign goes unnoticed between visits.
            </p>
            <div className="hero-actions" style={{ opacity: 0 }}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link href="/login" className="btn-primary">
                  Start Onboarding
                </Link>
              </motion.div>
              <motion.a href="#how" className="btn-ghost" whileHover={{ x: 6 }}>
                See how it works →
              </motion.a>
            </div>
          </div>

          {/* Wristband side */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 70 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.25,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <div className="band-scene">
              <div className="band-glow" />

              <div className="band-wrap">
                <div className="band-screen">
                  <div className="band-metric">
                    <span className="band-icon">♥</span>
                    <span className="band-val">98</span>
                    <span className="band-unit">bpm</span>
                  </div>
                  <div className="band-pulse">
                    <svg viewBox="0 0 80 30" fill="none">
                      <polyline
                        points="0,15 12,15 18,5 24,25 30,15 36,15 44,2 50,28 56,15 80,15"
                        stroke="#6ECFBB"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pulse-line"
                      />
                    </svg>
                  </div>
                  <div className="band-metrics-row">
                    <div className="bm">
                      <span className="bm-v">98%</span>
                      <span className="bm-l">SpO₂</span>
                    </div>
                    <div className="bm">
                      <span className="bm-v">36.8°</span>
                      <span className="bm-l">Temp</span>
                    </div>
                    <div className="bm bm-risk">
                      <span className="bm-v">Low</span>
                      <span className="bm-l">Risk</span>
                    </div>
                  </div>
                </div>
                <div className="band-strap band-strap-top" />
                <div className="band-strap band-strap-bot" />
              </div>

              {/* Floating tags — CSS @keyframes */}
              <div className="float-tag ft1">🤖 AI Risk: Low</div>
              <div className="float-tag ft2">📡 Live · 2s ago</div>
              <div className="float-tag ft3">🔔 All Normal</div>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.65, ease: [0.23, 1, 0.32, 1] }}
        >
          {[
            { v: "24/7", l: "Continuous monitoring" },
            { v: "5", l: "Vitals tracked live" },
            { v: "<2s", l: "Alert response time" },
            { v: "3", l: "Portals: Doctor · NGO · Admin" },
          ].map((s) => (
            <motion.div
              key={s.l}
              className="stat-card"
              whileHover={{ y: -5, scale: 1.04 }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
            >
              <span className="stat-val">{s.v}</span>
              <span className="stat-label">{s.l}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="section" id="how">
        <FadeUp className="section-head">
          <p className="section-eye">The system</p>
          <h2 className="section-title">From wrist to doctor in seconds</h2>
        </FadeUp>

        <div className="steps">
          {[
            {
              n: "01",
              color: "#8B78C4",
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Watch/3D/watch_3d.png",
              title: "Wristband measures",
              body: "The IoT wristband reads heart rate, SpO₂, body temperature, activity, and stress score — continuously, every second.",
            },
            {
              n: "02",
              color: "#6ECFBB",
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Robot/3D/robot_3d.png",
              title: "AI calculates risk",
              body: "Scikit-learn model combines real-time vitals with verified lab values to score each patient Low, Medium, or High risk instantly.",
            },
            {
              n: "03",
              color: "#F4856A",
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Police%20car%20light/3D/police_car_light_3d.png",
              title: "Doctor gets alerted",
              body: "High risk triggers an emergency cascade — push notification to the doctor, SMS to family, alert on the NGO dashboard.",
            },
          ].map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.13}>
              <TiltCard
                className="step-card"
                style={{ "--step-color": step.color } as React.CSSProperties}
              >
                <div className="step-number">{step.n}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.icon}
                  alt={step.title}
                  className="step-icon-img"
                  loading="lazy"
                />
                <h3 className="step-title">{step.title}</h3>
                <p className="step-body">{step.body}</p>
                <div className="step-line" />
              </TiltCard>
            </FadeUp>
          ))}
        </div>

        {/* Phone mockup */}
        <FadeUp>
          <div className="phone-scene">
            <div className="phone-wrap">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-header">
                  <span className="phone-app">MomCare Patient</span>
                  <span className="phone-time">10:42</span>
                </div>
                <div className="phone-risk-badge">
                  <span className="prb-dot" />
                  <span>
                    Risk Level: <strong>Low</strong>
                  </span>
                </div>
                <div className="phone-vitals">
                  {[
                    { l: "Heart Rate", v: "82 bpm", c: "#F4856A" },
                    { l: "SpO₂", v: "98%", c: "#8B78C4" },
                    { l: "Temp", v: "36.8°C", c: "#6ECFBB" },
                    { l: "Activity", v: "Moderate", c: "#F4856A" },
                  ].map((v) => (
                    <div key={v.l} className="pv-row">
                      <span className="pv-label">{v.l}</span>
                      <span className="pv-val" style={{ color: v.c }}>
                        {v.v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="phone-next">
                  <span>Next appointment</span>
                  <strong>Aug 14 · 10:00 AM</strong>
                </div>
              </div>
              <div className="phone-home-btn" />
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Doctor features ───────────────────────────────────── */}
      <section className="section section-alt" id="features">
        <FadeUp className="section-head">
          <p className="section-eye">For Doctors</p>
          <h2 className="section-title">
            Everything you need, nothing you don&apos;t
          </h2>
        </FadeUp>

        <div className="features-grid">
          {[
            {
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Bar%20chart/3D/bar_chart_3d.png",
              title: "Real-time vitals dashboard",
              body: "All your patients on one screen. Sorted by risk level. High-risk cases surface automatically — no hunting.",
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Robot/3D/robot_3d.png",
              title: "AI risk score",
              body: "Each patient gets a 0–100 risk score updated every 30 seconds. See exactly which vitals are driving the score.",
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Microscope/3D/microscope_3d.png",
              title: "Lab report OCR",
              body: "Patients upload lab reports. EasyOCR extracts the values. You verify or correct — one click per field.",
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Calendar/3D/calendar_3d.png",
              title: "Appointment management",
              body: "Schedule, track, and mark appointments. No-show tracking built in. Calendar synced with patient bookings.",
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Police%20car%20light/3D/police_car_light_3d.png",
              title: "Emergency alerts",
              body: "High risk? One tap triggers the full cascade — family SMS, NGO alert, and notification to all assigned doctors.",
            },
            {
              icon: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Outbox%20tray/3D/outbox_tray_3d.png",
              title: "Export & reports",
              body: "Export patient history, vitals trends, and risk timelines. PDFs ready for handoffs, referrals, and records.",
            },
          ].map((f, i) => (
            <FadeUp key={f.title} delay={(i % 3) * 0.1}>
              <TiltCard className="feature-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.icon}
                  alt={f.title}
                  className="fc-icon-img"
                  loading="lazy"
                />
                <h3 className="fc-title">{f.title}</h3>
                <p className="fc-body">{f.body}</p>
              </TiltCard>
            </FadeUp>
          ))}
        </div>

        {/* Dashboard mockup */}
        <FadeUp>
          <div className="dashboard-scene">
            <motion.div
              className="dash-wrap"
              whileHover={{ rotateX: 0, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="dash-sidebar">
                <div className="ds-logo">♥ MC</div>
                {[
                  "Dashboard",
                  "Patients",
                  "Appointments",
                  "OCR Queue",
                  "Alerts",
                ].map((item) => (
                  <div
                    key={item}
                    className={`ds-item ${item === "Patients" ? "ds-active" : ""}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="dash-main">
                <div className="dash-topbar">
                  <span className="dash-title">Patient List</span>
                  <div className="dash-user">Dr. Zara Ahmed</div>
                </div>
                <div className="dash-stats">
                  {[
                    { v: "24", l: "Total", c: "#8B78C4" },
                    { v: "3", l: "High Risk", c: "#F4856A" },
                    { v: "7", l: "Today", c: "#6ECFBB" },
                    { v: "5", l: "OCR Pending", c: "#D4A843" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      className="dash-stat"
                      style={{ "--sc": s.c } as React.CSSProperties}
                    >
                      <span className="ds-val">{s.v}</span>
                      <span className="ds-lbl">{s.l}</span>
                    </div>
                  ))}
                </div>
                <div className="dash-patients">
                  {[
                    { n: "Ayesha Bibi", r: "HIGH", w: "Wk 32" },
                    { n: "Fatima Malik", r: "MED", w: "Wk 28" },
                    { n: "Sana Khan", r: "LOW", w: "Wk 20" },
                  ].map((p) => (
                    <div key={p.n} className="dp-row">
                      <div className="dp-avatar">{p.n[0]}</div>
                      <div className="dp-info">
                        <span className="dp-name">{p.n}</span>
                        <span className="dp-week">{p.w}</span>
                      </div>
                      <div className={`dp-risk dp-${p.r.toLowerCase()}`}>
                        {p.r}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </FadeUp>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="cta-section" id="contact">
        <div className="heart-scene">
          <div className="heart-ring hr1" />
          <div className="heart-ring hr2" />
          <div className="heart-ring hr3" />
          <div className="heart-core">♥</div>
        </div>

        <FadeUp className="cta-content">
          <p className="section-eye" style={{ color: "#F4856A" }}>
            Ready?
          </p>
          <h2 className="cta-title">
            Transform maternal care
            <br />
            in your hospital today.
          </h2>
          <p className="cta-sub">
            MomCare is built for Pakistani hospitals and NGOs. Reach out to the
            team to get started.
          </p>
          <div className="cta-actions">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/login" className="btn-primary btn-lg">
                Doctor Onboarding
              </Link>
            </motion.div>
            <motion.a
              href="mailto:team@momcare.ai"
              className="btn-ghost btn-lg"
              whileHover={{ x: 5 }}
            >
              Contact the Team →
            </motion.a>
          </div>
          <div className="cta-team">
            <div className="team-avatar">Z</div>
            <div className="team-info">
              <strong>Zaka Ullah Waheed</strong> — Frontend
            </div>
            <div className="team-divider" />
            <div className="team-avatar">A</div>
            <div className="team-info">
              <strong>Ahmed Nawaz</strong> — Backend
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="nav-logo">♥</span>
            <span className="nav-name">MomCare</span>
          </div>
          <p className="footer-copy">
            FYP 2026 · Next.js 16 · Django · Scikit-learn · IoT · Made in
            Pakistan
          </p>
        </div>
      </footer>
    </main>
  );
}
