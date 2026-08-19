import { motion } from "motion/react";
import Link from "next/link";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

interface Props {
  direction: number;
}

export function Step4Success({ direction }: Props) {
  return (
    <motion.div
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={direction}
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="w-full flex flex-col items-center text-center pt-8"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-[0_8px_30px_rgba(16,185,129,0.15)] animate-pulse"
      >
        <svg
          className="w-14 h-14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>

      <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
        Verification Pending
      </h1>
      <h3 className="text-xl font-bold text-emerald-500 mb-6">
        Application Submitted Successfully
      </h3>

      <p className="text-slate-500 font-medium mb-10 leading-relaxed max-w-sm text-lg">
        Your credentials and documents are under review. We manually verify all
        PMDC licenses.
        <br />
        <br />
        Expected activation:{" "}
        <strong className="text-slate-900 font-bold">24-48 hours</strong>. You
        will receive an email confirmation.
      </p>

      <Link
        href="/"
        className="w-full max-w-[250px] bg-white text-slate-700 font-bold py-4 px-6 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm block text-center"
      >
        Return to Home
      </Link>
    </motion.div>
  );
}
