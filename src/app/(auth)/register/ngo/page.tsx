import type { Metadata } from "next";

import { NgoAccessRequestForm } from "@/features/ngo/components/NgoAccessRequestForm";

export const metadata: Metadata = {
  title: "Apply for NGO access",
  description:
    "NGOs that supply health bands or run ambulance services can apply for a MomCare NGO portal account.",
  alternates: { canonical: "/register/ngo" },
};

export default function RegisterNgoPage() {
  return <NgoAccessRequestForm />;
}
