import HospitalWizard from "@/core/auth/components/hospital-reg/HospitalWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — MomCare",
  description: "Register your hospital or organization on MomCare",
};

export default function DoctorOnboardingPage() {
  return <HospitalWizard />;
}
