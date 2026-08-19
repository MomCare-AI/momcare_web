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
  onBack: () => void;
  isSubmitting: boolean;
}

export function Step3Profile({ direction, onBack, isSubmitting }: Props) {
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
          Step 3 of 4
        </h3>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Professional Profile
        </h1>
        <p className="text-slate-500 font-medium">
          Tell us about your medical practice to help patients find you.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Primary Specialty
          </label>
          <div className="relative">
            <select
              {...register("specialty")}
              className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border appearance-none ${errors.specialty ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500/20"} focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 transition-all shadow-sm text-slate-900`}
            >
              <option value="">Select Specialty</option>
              <option value="OB/GYN">👩‍⚕️ OB/GYN</option>
              <option value="Pediatrician">👶 Pediatrician</option>
              <option value="General Physician">🩺 General Physician</option>
              <option value="Midwife">🤱 Midwife</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
          {errors.specialty && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.specialty.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Associated Hospital / Clinic
          </label>
          <div className="relative">
            <input
              type="text"
              {...register("hospital")}
              placeholder="Search hospitals..."
              className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border ${errors.hospital ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500/20"} focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 transition-all shadow-sm text-slate-900`}
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          {errors.hospital && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">
              {errors.hospital.message}
            </p>
          )}
        </div>

        {/* Optional Upload Zone */}
        <div className="mt-8 border-2 border-dashed border-slate-300 rounded-2xl p-5 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
          <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <svg
              className="w-5 h-5 text-blue-600"
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
          <div>
            <p className="text-sm font-bold text-slate-800">
              Upload Professional Photo
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Optional. JPEG or PNG under 2MB.
            </p>
          </div>
          <input type="file" className="hidden" />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="w-1/3 bg-white text-slate-600 hover:text-slate-900 font-bold py-4 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          disabled={isSubmitting}
        >
          Back
        </button>
        <button
          type="submit"
          className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          ) : (
            <>Submit Application ✓</>
          )}
        </button>
      </div>
    </motion.div>
  );
}
