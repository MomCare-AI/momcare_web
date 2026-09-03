"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { animate } from "animejs";
import {
  ClipboardList,
  Lock,
  HeartPulse,
  ShieldCheck,
  Building2,
  HeartHandshake,
  CheckCircle2,
  Phone,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { AboutFlip } from "./AboutFlip";
import { ThreePillars } from "./ThreePillars";

// Below-the-fold sections - still fully server-rendered (so search
// engines and no-JS visitors see the same HTML), but their client JS
// is split into its own chunk and fetched only once the visitor
// actually scrolls near them, rather than blocking the initial load.
const FaqCarousel = dynamic(() =>
  import("./FaqCarousel").then((m) => m.FaqCarousel)
);
const ValuePillars = dynamic(() =>
  import("./ValuePillars").then((m) => m.ValuePillars)
);
const IntegrationHub = dynamic(() =>
  import("./IntegrationHub").then((m) => m.IntegrationHub)
);
const OurTeam = dynamic(() => import("./OurTeam").then((m) => m.OurTeam));
const HowItsBuilt = dynamic(() =>
  import("./HowItsBuilt").then((m) => m.HowItsBuilt)
);
const EngineShowcase = dynamic(() =>
  import("./EngineShowcase").then((m) => m.EngineShowcase)
);
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AvatarGroup,
  AvatarGroupTooltip,
} from "@/components/animate-ui/components/animate/avatar-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/animate-ui/components/animate/tooltip";

// A drawn mark, not the system emoji glyph — the Unicode ♥ renders
function HeartMark({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <HeartPulse size={size} className={className} strokeWidth={2.5} />;
}

// What's actually true today, not fabricated certifications or client
// names — MomCare has no real hospitals onboarded yet, and claiming HIPAA
// or ISO 27001 compliance without an audit would be a false claim, not a
// design choice.
const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    label: "Row-Level Security (Postgres)",
    detail:
      "The database-level second layer — built and tested, not yet live in production.",
  },
  {
    icon: ClipboardList,
    label: "Documented clinical thresholds",
    detail:
      "Every risk tier is defined by a rule anyone can read, not a black-box score.",
  },
  {
    icon: Building2,
    label: "Built for hospitals across Pakistan",
    detail:
      "MomCare is a B2B platform — hospitals onboard, not individual patients.",
  },
  {
    icon: HeartHandshake,
    label: "Escalation ladder, three tiers",
    detail:
      "Clinician, then hospital admin — each tier has its own response deadline.",
  },
  {
    icon: CheckCircle2,
    label: "Append-only audit trail",
    detail:
      "Every escalation step is written down and never edited, only added to.",
  },
  {
    icon: Lock,
    label: "Every hospital, walled off",
    detail:
      "Every request is scoped to your hospital before it ever reaches a query.",
  },
];

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

const NAV_SECTION_IDS = ["about", "engine", "built", "faq", "cta"];

export function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // ── Scroll-spy: highlight whichever nav link's section is on screen,
  // not just the one that was clicked — so it stays correct on scroll too.
  useEffect(() => {
    const sections = NAV_SECTION_IDS.map((id) =>
      document.getElementById(id)
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Among sections currently intersecting the band near the top of
        // the viewport, the one closest to it is "current" — not just
        // whichever fired last, since several can be visible at once.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        // Counts a section as "current" once it's crossed a band just
        // below the fixed nav, and stops counting it just before the
        // next section would.
        rootMargin: "-110px 0px -70% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // ── Anime.js: hero entrance stagger ─────────────────
  useEffect(() => {
    animate(".hero-video-pill", {
      opacity: [0, 1],
      translateX: [-28, 0],
      duration: 700,
      ease: "outExpo",
    });

    animate(".hero-video-sub", {
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 700,
      ease: "outExpo",
      delay: 420,
    });

    animate(".hero-video-actions", {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 600,
      ease: "outExpo",
      delay: 580,
    });
  }, []);

  return (
    <main className="landing">
      {/* ── Nav: a floating pill ────────────────────────────────── */}
      <motion.nav
        className="nav"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="nav-inner">
          <Link
            href="/"
            className="nav-brand"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              setMobileMenuOpen(false);
            }}
          >
            <Image
              src="/avatars/logo.png"
              alt="MomCare Logo"
              width={180}
              height={44}
              style={{ objectFit: "contain", height: "44px", width: "auto" }}
              priority
            />
          </Link>
          <div className="nav-links">
            <a
              href="#about"
              className={`nav-link${activeSection === "about" ? " active" : ""}`}
            >
              About
            </a>
            <a
              href="#engine"
              className={`nav-link${activeSection === "engine" ? " active" : ""}`}
            >
              How it works
            </a>
            <a
              href="#built"
              className={`nav-link${activeSection === "built" ? " active" : ""}`}
            >
              Team
            </a>
            <a
              href="#faq"
              className={`nav-link${activeSection === "faq" ? " active" : ""}`}
            >
              FAQ
            </a>
            <a
              href="#cta"
              className={`nav-link${activeSection === "cta" ? " active" : ""}`}
            >
              Contact
            </a>
          </div>
          {/* Desktop-only auth actions */}
          <div className="nav-right">
            <Link href="/login" className="nav-signin">
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link href="/register" className="nav-cta">
                Register Hospital
              </Link>
            </motion.div>
          </div>
          {/* Mobile-only hamburger toggle */}
          <button
            type="button"
            className="nav-hamburger"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="nav-mobile-menu"
            >
              <a
                href="#about"
                className={`nav-mobile-link${activeSection === "about" ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#engine"
                className={`nav-mobile-link${activeSection === "engine" ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                How it works
              </a>
              <a
                href="#built"
                className={`nav-mobile-link${activeSection === "built" ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Team
              </a>
              <a
                href="#faq"
                className={`nav-mobile-link${activeSection === "faq" ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <a
                href="#cta"
                className={`nav-mobile-link${activeSection === "cta" ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <div className="nav-mobile-divider" />
              <Link
                href="/login"
                className="nav-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="nav-cta nav-mobile-cta"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register Hospital
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero: full-viewport video, the nav pill floats over it ─ */}
      <section className="hero-video">
        <video
          className="hero-video-bg"
          autoPlay
          loop
          muted
          playsInline
          poster="/images/hero-prenatal-checkup.jpg"
        >
          <source src="/videos/hero-pregnancy.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-scrim" />

        <div className="hero-video-inner">
          <motion.div
            className="hero-video-left"
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="hero-video-pill" style={{ opacity: 0 }}>
              <span className="hero-video-pill-icon">
                <HeartMark size={12} />
              </span>
              Remote Maternal Health Monitoring
            </p>
            <h1
              className="hero-video-headline text-white"
              style={{ textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
            >
              Every Heartbeat,
              <br />
              Watched Over.
            </h1>
            <p
              className="hero-video-sub text-gray-200 max-w-[500px] leading-relaxed"
              style={{ opacity: 0 }}
            >
              MomCare connects wearable vitals, a documented clinical risk
              engine, and a timed escalation ladder — so a warning sign never
              waits for the next scheduled visit.
            </p>
            <div className="hero-video-actions" style={{ opacity: 0 }}>
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/register"
                  className="btn-primary"
                  style={{ boxShadow: "0 10px 30px rgba(67, 97, 238, 0.4)" }}
                >
                  Register your hospital
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <ThreePillars />

      <AboutFlip />

      {/* ── Trust & Accreditation Marquee ──────────────────────── */}
      <TooltipProvider openDelay={150}>
        <section className="trust-marquee">
          <div className="trust-marquee-track">
            {[...TRUST_BADGES, ...TRUST_BADGES, ...TRUST_BADGES].map(
              (badge, i) => {
                const Icon = badge.icon;
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="trust-badge">
                        <div className="trust-badge-icon">
                          <Icon size={20} strokeWidth={2.5} />
                        </div>
                        {badge.label}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px]">
                      {badge.detail}
                    </TooltipContent>
                  </Tooltip>
                );
              }
            )}
          </div>
          <div className="trust-marquee-track reverse">
            {[...TRUST_BADGES]
              .reverse()
              .concat([...TRUST_BADGES].reverse(), [...TRUST_BADGES].reverse())
              .map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="trust-badge">
                        <div className="trust-badge-icon">
                          <Icon size={20} strokeWidth={2.5} />
                        </div>
                        {badge.label}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px]">
                      {badge.detail}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
          </div>
        </section>
      </TooltipProvider>

      <ValuePillars />
      <EngineShowcase />
      <IntegrationHub />

      {/* ── CTA ─────────────────────────────────────── */}
      <section
        className="section"
        id="cta"
        style={{
          background: "var(--primary-dark)",
          borderRadius: "var(--radius-lg)",
          width: "calc(100% - 48px)",
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "80px 40px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <FadeUp>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              marginBottom: "20px",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
            }}
          >
            Ready to upgrade your ward?
          </h2>
          <p
            style={{
              fontSize: "18px",
              opacity: 0.9,
              maxWidth: "600px",
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}
          >
            Join MomCare today to bring continuous vitals monitoring, automated
            risk scoring, and guaranteed escalation to your hospital.
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Link
              href="/register"
              className="btn-primary"
              style={{ background: "#fff", color: "var(--primary-dark)" }}
            >
              Register your hospital
            </Link>
            <a
              href="mailto:support@momcare.solutions"
              className="btn-ghost"
              style={{ color: "#fff" }}
            >
              Contact Sales →
            </a>
          </div>

          <div className="flex flex-col items-center gap-3 mt-10">
            <span
              className="text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Talk directly to the people building it
            </span>
            <AvatarGroup>
              <Avatar className="size-11 ring-2 ring-white/25">
                <AvatarImage
                  src="/team/Zaka.png"
                  alt="Zaka Ullah Waheed"
                  className="object-cover"
                  style={{ objectPosition: "center 12%" }}
                />
                <AvatarFallback>Z</AvatarFallback>
                <AvatarGroupTooltip className="bg-white text-[var(--text)]">
                  Zaka — Full-Stack Developer
                </AvatarGroupTooltip>
              </Avatar>
              <Avatar className="size-11 ring-2 ring-white/25">
                <AvatarFallback
                  style={{ background: "var(--coral)", color: "#fff" }}
                >
                  A
                </AvatarFallback>
                <AvatarGroupTooltip className="bg-white text-[var(--text)]">
                  Ahmed — AI/ML Expert
                </AvatarGroupTooltip>
              </Avatar>
              <Avatar className="size-11 ring-2 ring-white/25">
                <AvatarFallback
                  style={{ background: "#fff", color: "var(--primary-dark)" }}
                >
                  S
                </AvatarFallback>
                <AvatarGroupTooltip className="bg-white text-[var(--text)]">
                  Saleha — Mobile App Developer
                </AvatarGroupTooltip>
              </Avatar>
            </AvatarGroup>
          </div>
        </FadeUp>
      </section>

      <OurTeam />

      <HowItsBuilt />

      {/* ── FAQ Section ─────────────────────────────────────────────── */}
      <FaqCarousel />

      {/* ── Floating CTA & Footer ───────────────────────────────────── */}
      <div
        style={{ background: "#fff", position: "relative", marginTop: "160px" }}
      >
        {/* Floating CTA */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 10,
            marginTop: "-140px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "#4361ee",
              borderRadius: "16px",
              padding: "clamp(24px, 6vw, 40px) clamp(20px, 7vw, 60px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#fff",
              boxShadow: "0 20px 40px rgba(67, 97, 238, 0.2)",
              flexWrap: "wrap",
              gap: "32px",
            }}
          >
            {/* Left: Logo */}
            <div
              style={{
                flex: "1",
                display: "flex",
                justifyContent: "center",
                minWidth: "180px",
              }}
            >
              <Image
                src="/avatars/logo.png"
                alt="MomCare Logo"
                width={240}
                height={240}
                style={{
                  objectFit: "contain",
                  width: "240px",
                  height: "auto",
                  maxWidth: "100%",
                  filter: "brightness(0) invert(1)",
                }}
              />
            </div>
            {/* Right: Content & Form */}
            <div style={{ flex: "1.5", minWidth: "220px" }}>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  marginBottom: "12px",
                  fontFamily: "var(--font-display)",
                }}
              >
                Ready to upgrade your ward?
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  opacity: 0.9,
                  marginBottom: "24px",
                  lineHeight: 1.5,
                }}
              >
                Join MomCare today to bring continuous vitals monitoring,
                automated risk scoring, and guaranteed escalation to your
                hospital.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  background: "rgba(255,255,255,0.15)",
                  padding: "6px",
                  borderRadius: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    padding: "10px 12px",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
                <button
                  style={{
                    flexShrink: 0,
                    background: "#fff",
                    color: "#4361ee",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Request Demo
                </button>
              </div>
              <p style={{ fontSize: "12px", opacity: 0.7, marginTop: "12px" }}>
                You will be able to unsubscribe at any time. Read our privacy
                policy{" "}
                <Link
                  href="#"
                  style={{ color: "#fff", textDecoration: "underline" }}
                >
                  here
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ padding: "80px 24px 24px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "40px",
                flexWrap: "wrap",
                paddingBottom: "40px",
                borderBottom: "1px solid #eaeaea",
              }}
            >
              {/* Brand & Disclaimer */}
              <div style={{ flex: "2", minWidth: "280px", maxWidth: "400px" }}>
                <Image
                  src="/avatars/logo.png"
                  alt="MomCare Logo"
                  width={140}
                  height={34}
                  style={{
                    objectFit: "contain",
                    height: "34px",
                    width: "auto",
                    marginBottom: "20px",
                  }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                    marginBottom: "24px",
                  }}
                >
                  <strong>Medical Disclaimer:</strong> MomCare is a monitoring
                  platform, not a replacement for emergency medical care. If you
                  are experiencing a medical emergency, call 911 or your local
                  emergency helpline immediately.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  <a
                    href="#"
                    style={{ color: "inherit", transition: "color 0.2s" }}
                    aria-label="Facebook"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                  <a
                    href="#"
                    style={{ color: "inherit", transition: "color 0.2s" }}
                    aria-label="Twitter"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                  </a>
                  <a
                    href="#"
                    style={{ color: "inherit", transition: "color 0.2s" }}
                    aria-label="Instagram"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        rx="5"
                        ry="5"
                      ></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a
                    href="#"
                    style={{ color: "inherit", transition: "color 0.2s" }}
                    aria-label="LinkedIn"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Links Columns */}
              <div style={{ flex: "1", minWidth: "120px" }}>
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "20px",
                    color: "var(--text)",
                  }}
                >
                  Security
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  <Link
                    href="#"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    Privacy Practices
                  </Link>
                  <Link
                    href="#"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    Row-Level Security
                  </Link>
                  <Link
                    href="#"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    Data Security
                  </Link>
                </div>
              </div>

              <div style={{ flex: "1", minWidth: "120px" }}>
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "20px",
                    color: "var(--text)",
                  }}
                >
                  Sitemap
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  <Link
                    href="#about"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    About Us
                  </Link>
                  <Link
                    href="#built"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    Our Team
                  </Link>
                  <Link
                    href="#"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    Clinic Locations
                  </Link>
                </div>
              </div>

              {/* Contact Us */}
              <div style={{ flex: "1.5", minWidth: "200px" }}>
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "20px",
                    color: "var(--text)",
                  }}
                >
                  Contact Us
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Phone size={18} color="#4361ee" />
                    <span>(92) 300 1234 567</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Mail size={18} color="#4361ee" />
                    <span>support@momcare.solutions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "24px",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                © Copyright {new Date().getFullYear()} MomCare. All rights
                reserved.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                <Link
                  href="#"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    transition: "color 0.2s",
                  }}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="#"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    transition: "color 0.2s",
                  }}
                >
                  Terms of Use
                </Link>
                <Link
                  href="#"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    transition: "color 0.2s",
                  }}
                >
                  Legal
                </Link>
                <Link
                  href="#"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    transition: "color 0.2s",
                  }}
                >
                  Site Map
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
