"use client";

import { motion } from "motion/react";
import Link from "next/link";

const TIMELINE = [
  { icon: "📧", text: "Confirmation email sent to your inbox" },
  { icon: "🔍", text: "PMDC credentials verified within 24–48 hours" },
  { icon: "✅", text: "Account activated — you will receive an email" },
];

export default function Step4Pending() {
  return (
    <div className="ob-pending">
      <motion.div
        className="ob-pending-icon"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
      >
        ✓
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <h1 className="ob-pending-title">Application Submitted!</h1>
        <p className="ob-pending-sub">
          Your credentials are under review. Expected activation within 24–48
          hours.
        </p>
      </motion.div>

      <motion.div
        className="ob-pending-timeline"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        {TIMELINE.map((item, i) => (
          <motion.div
            key={i}
            className="ob-timeline-item"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.55 + i * 0.1,
              duration: 0.4,
              ease: "easeOut",
            }}
          >
            <span className="ob-timeline-icon">{item.icon}</span>
            <span className="ob-timeline-text">{item.text}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <Link href="/" className="ob-btn-home">
          Return to Home
        </Link>
      </motion.div>
    </div>
  );
}
