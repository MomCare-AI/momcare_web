"use client";

import { motion } from "motion/react";
import Link from "next/link";

const NEXT_STEPS = [
  {
    step: "01",
    title: "Application received",
    body: "Your application is pending. A MomCare reviewer will pick it up and mark it under review.",
  },
  {
    step: "02",
    title: "Manual verification",
    body: "A reviewer checks your registration number, authority and documents against official records by hand, and may ask you for more information.",
  },
  {
    step: "03",
    title: "Verified by MomCare",
    body: "Once verified, an account is created for your authorized representative. You cannot sign in before then.",
  },
];

export default function NgoSuccess() {
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
          Your NGO registration is pending review. Uploading documents does not
          verify your organization by itself — MomCare confirms each detail
          manually.
        </p>
      </motion.div>

      <motion.div
        className="hw-success-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <div className="hw-success-card-title">What happens next</div>
        {NEXT_STEPS.map((item, i) => (
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
