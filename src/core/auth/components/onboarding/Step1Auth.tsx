"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import Link from "next/link";
import { step1Schema, type Step1Data } from "./schemas";

export default function Step1Auth({
  onSubmit,
}: {
  onSubmit: (data: Step1Data) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  return (
    <>
      <div className="ob-card-head">
        <motion.div
          className="ob-card-icon"
          initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          👤
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="ob-card-title">Create your account</h1>
          <p className="ob-card-sub">Start your journey with MomCare</p>
        </motion.div>
      </div>

      <form
        className="ob-card-body"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="ob-fields">
          <div className="ob-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="dr.zara@hospital.com"
              className={errors.email ? "ob-input-error" : ""}
              {...register("email")}
            />
            {errors.email && (
              <span className="ob-field-error">{errors.email.message}</span>
            )}
          </div>

          <div className="ob-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              className={errors.password ? "ob-input-error" : ""}
              {...register("password")}
            />
            {errors.password && (
              <span className="ob-field-error">{errors.password.message}</span>
            )}
          </div>

          <div className="ob-divider">
            <span>or</span>
          </div>

          <button type="button" className="ob-google-btn">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.015 17.64 11.707 17.64 9.2z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.166 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="ob-admin-link">
            Hospital Administrator?{" "}
            <a href="mailto:admin@momcare.solutions">Contact us</a>
          </p>
        </div>

        <div className="ob-card-foot">
          <p className="ob-signin-link">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
          <motion.button
            type="submit"
            className="ob-btn-next"
            disabled={isSubmitting}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Continue <span className="ob-btn-arrow">→</span>
          </motion.button>
        </div>
      </form>
    </>
  );
}
