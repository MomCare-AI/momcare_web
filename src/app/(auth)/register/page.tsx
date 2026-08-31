import HospitalWizard from "@/features/hospital-onboarding/components/HospitalWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Your Hospital",
  description:
    "Apply to bring MomCare's continuous vitals monitoring, risk scoring, and escalation ladder to your hospital.",
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterPage() {
  return <HospitalWizard />;
}
