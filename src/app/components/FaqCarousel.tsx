"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const faqs = [
  {
    id: "faq-1",
    question: "How is patient data kept scoped to one hospital?",
    answer:
      "Every request is scoped to your hospital in application code before it ever reaches a query. A database-level second layer — Postgres row-level security — is built and tested, but not yet live in production. We don't claim HIPAA or ISO 27001 certification; neither has been audited.",
  },
  {
    id: "faq-2",
    question:
      "Can MomCare integrate with our existing EMR or clinic workflows?",
    answer:
      "Not yet. MomCare is a REST API and web portal that a hospital's own staff use directly — there's no EMR/EHR integration built, and it isn't on the near-term roadmap.",
  },
  {
    id: "faq-3",
    question: "Does MomCare cover postpartum care, or only pregnancy?",
    answer:
      "Pregnancy monitoring only, today — vitals, risk scoring, and escalation through delivery. Postpartum monitoring isn't built yet.",
  },
  {
    id: "faq-4",
    question: "How are emergency escalations handled by the platform?",
    answer:
      "An abnormal reading is sorted into a risk tier the moment it arrives and reaches the assigned clinician first. If nobody responds inside that tier's deadline, it escalates to the hospital's admin next — every step written to an append-only audit trail, checked by a scheduled job every minute.",
  },
  {
    id: "faq-5",
    question: "Does MomCare require special hardware?",
    answer:
      "No shipped hardware kit. A reading comes from a wearable or monitoring device your hospital already has, or is entered directly by staff — either way, it's scored the moment it arrives.",
  },
];

export function FaqCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(prev + 1, faqs.length - 1));
    scrollToActive(activeIndex + 1);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
    scrollToActive(activeIndex - 1);
  };

  const scrollToActive = (index: number) => {
    if (containerRef.current) {
      const cardWidth = 300;
      const gap = 24;
      const scrollPosition = index * (cardWidth + gap);
      containerRef.current.scrollTo({
        left: Math.max(0, scrollPosition - 100),
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="faq"
      className="faq-section"
      style={{
        padding: "120px 24px",
        background: "var(--bg)",
        overflow: "hidden",
        scrollMarginTop: 110,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "40px",
            marginBottom: "60px",
          }}
        >
          <h2
            style={{
              fontSize: "48px",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              lineHeight: 1.1,
              maxWidth: "500px",
              color: "var(--text)",
            }}
          >
            Frequently
            <br />
            Asked <span style={{ color: "var(--primary)" }}>Questions</span>
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "340px",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              Find answers to common questions about our remote monitoring
              platform, hospital integration, and patient onboarding processes.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: activeIndex === 0 ? "transparent" : "#fff",
                  color: activeIndex === 0 ? "#94a3b8" : "var(--text)",
                  cursor: activeIndex === 0 ? "default" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                disabled={activeIndex === faqs.length - 1}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    activeIndex === faqs.length - 1 ? "#cbd5e1" : "var(--text)",
                  color: "#fff",
                  cursor:
                    activeIndex === faqs.length - 1 ? "default" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={containerRef}
          style={{
            display: "flex",
            gap: "24px",
            overflowX: "auto",
            paddingBottom: "40px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="faq-carousel-track"
        >
          {faqs.map((faq, index) => {
            const isActive = index === activeIndex;

            return (
              <motion.div
                key={faq.id}
                layout
                onClick={() => {
                  setActiveIndex(index);
                  scrollToActive(index);
                }}
                initial={false}
                animate={{
                  width: isActive ? 450 : 280,
                  height: isActive ? 450 : 400,
                  backgroundColor: isActive ? "var(--primary)" : "#e2e8f0",
                  color: isActive ? "#ffffff" : "var(--text)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                style={{
                  borderRadius: "24px",
                  padding: "40px",
                  display: "flex",
                  flexDirection: "column",
                  flexShrink: 0,
                  position: "relative",
                  overflow: "hidden",
                  cursor: isActive ? "default" : "pointer",
                }}
              >
                <motion.h3
                  layout
                  style={{
                    fontSize: isActive ? "28px" : "24px",
                    fontWeight: 500,
                    fontFamily: "var(--font-display)",
                    lineHeight: 1.3,
                    opacity: isActive ? 1 : 0.5,
                    transition: "opacity 0.3s",
                  }}
                >
                  {faq.question}
                </motion.h3>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      style={{ marginTop: "auto" }}
                    >
                      <p
                        style={{
                          fontSize: "15px",
                          lineHeight: 1.6,
                          opacity: 0.9,
                        }}
                      >
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .faq-carousel-track::-webkit-scrollbar {
          display: none;
        }
      `,
        }}
      />
    </section>
  );
}
