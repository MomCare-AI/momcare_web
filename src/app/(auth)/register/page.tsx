import HospitalWizard from "@/features/hospital-onboarding/components/HospitalWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — MomCare",
  description: "Register your hospital or organization on MomCare",
};

export default function RegisterPage() {
  return <HospitalWizard />;
}
