import { useFormContext } from "react-hook-form";
import { motion } from "motion/react";
import Link from "next/link";
import { type DoctorOnboardingData } from "../schema";

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
  onNext: () => void;
}

export function Step1Auth({ direction, onNext }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<DoctorOnboardingData>();

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
      className="w-full"
    >
      <div className="mb-8">
        <h3 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-2">
          Step 1 of 4
        </h3>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Account Setup
        </h1>
        <p className="text-slate-500 font-medium">
          Enter your details to create a MomCare Doctor account.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder="dr.zara@hospital.com"
            className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border ${errors.email ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500/20"} focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 transition-all shadow-sm text-slate-900`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            {...register("password")}
            placeholder="••••••••"
            className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border ${errors.password ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500/20"} focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 transition-all shadow-sm text-slate-900`}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <button
          type="button"
          onClick={onNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-2"
        >
          Continue <span className="text-xl">→</span>
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-4 text-center">
        <button
          type="button"
          className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Sign up with Google
        </button>
        <p className="text-sm text-slate-500 font-medium">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="text-sm text-slate-500 font-medium mt-2 border-t border-slate-100 pt-6">
          Hospital Administrator?{" "}
          <Link
            href="/admin/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Apply here
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
