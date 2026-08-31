import type { Metadata } from "next";
import { ForgotPasswordPageClient } from "./components/ForgotPasswordPageClient";

export const metadata: Metadata = {
  title: "Reset Your Password",
  description: "Request a password reset link for your MomCare account.",
  alternates: {
    canonical: "/forgot-password",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <ForgotPasswordPageClient />;
}
