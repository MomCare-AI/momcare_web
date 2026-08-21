"use client";

import { motion } from "motion/react";
import Link from "next/link";

export default function HwSuccess() {
  return (
    <div className="hw-success">
      <motion.div
        className="hw-success-ring"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 18,
          delay: 0.05,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M8 20l8 8L32 12"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="hw-success-title">Application submitted</h1>
        <p className="hw-success-sub">
          Your organization has been created and is pending platform admin
          review. Our team cross-checks name, address, and phone against public
          records before approving — usually within 24–48 hours.
        </p>
      </motion.div>

      <motion.div
        className="hw-success-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <div className="hw-success-card-title">What happens next</div>
        {[
          {
            step: "01",
            title: "Application received",
            body: "A confirmation has been sent to your inbox. If it doesn't arrive, your address may be wrong — tell us before the decision is sent to it.",
          },
          {
            step: "02",
            title: "Licence review",
            body: "A platform admin checks your licence against the register of the authority that issued it, and may call you on a number published there to confirm your role.",
          },
          {
            step: "03",
            title: "Access granted",
            body: "You can't sign in until the review is complete. We'll email you either way, and once approved you can start inviting your clinical team.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.step}
            className="hw-success-row"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42 + i * 0.1 }}
          >
            <span className="hw-success-step-num">{item.step}</span>
            <div className="hw-success-row-body">
              <span className="hw-success-row-title">{item.title}</span>
              <span className="hw-success-row-desc">{item.body}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.72 }}
      >
        <Link href="/" className="hw-btn-home">
          Return to home
        </Link>
      </motion.div>
    </div>
  );
}
