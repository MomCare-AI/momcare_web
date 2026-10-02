import type { Metadata } from "next";

import NgoWizard from "@/features/ngo-onboarding/components/NgoWizard";

export const metadata: Metadata = {
  title: "Register your NGO",
  description:
    "Register your NGO with MomCare. Applications are verified by hand by the MomCare team.",
  alternates: { canonical: "/register/ngo" },
};

export default function RegisterNgoPage() {
  return <NgoWizard />;
}
