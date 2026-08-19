import { useFormContext } from "react-hook-form";
import { motion } from "motion/react";
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
  onBack: () => void;
}

export function Step2Verification({ direction, onNext, onBack }: Props) {
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
          Step 2 of 4
        </h3>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Identity & Credentials
        </h1>
        <p className="text-slate-500 font-medium">
          Please provide your official registration details for secure
          verification via PMDC.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            CNIC Number
          </label>
          <input
            type="text"
            {...register("cnic")}
            placeholder="XXXXX-XXXXXXX-X"
            className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border ${errors.cnic ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500/20"} focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 transition-all shadow-sm font-mono text-slate-900`}
          />
          {errors.cnic ? (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.cnic.message}
            </p>
          ) : (
            <p className="text-slate-400 text-xs mt-1.5 font-medium">
              Format: 12345-1234567-1
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            PMDC Registration Number
          </label>
          <input
            type="text"
            {...register("pmdcNo")}
            placeholder="e.g. 12345-S"
            className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border ${errors.pmdcNo ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500/20"} focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 transition-all shadow-sm font-mono text-slate-900`}
          />
          {errors.pmdcNo && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.pmdcNo.message}
            </p>
          )}
        </div>

        {/* Upload Zone */}
        <div className="mt-8 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
          <div className="w-14 h-14 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-800">
            Click to upload documents
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            CNIC (Front/Back) and PMDC License
          </p>
          <input type="file" className="hidden" />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="w-1/3 bg-white text-slate-600 hover:text-slate-900 font-bold py-4 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-2"
        >
          Continue <span className="text-xl">→</span>
        </button>
      </div>
    </motion.div>
  );
}
