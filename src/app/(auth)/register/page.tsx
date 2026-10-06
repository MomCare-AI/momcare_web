import HospitalWizard from "@/features/hospital-onboarding/components/HospitalWizard";
import type { Metadata } from "next";
import { breadcrumbJsonLd } from "@/core/config/jsonLd";
import { JsonLd } from "@/shared/ui/JsonLd";

export const metadata: Metadata = {
  title: "Register Your Hospital",
  description:
    "Apply to bring MomCare's continuous vitals monitoring, risk scoring, and escalation ladder to your hospital.",
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Register", path: "/register" },
        ])}
      />
      <HospitalWizard />
    </>
  );
}
