import type { Metadata } from "next";

import { NgoForgotPasswordClient } from "./components/NgoForgotPasswordClient";

export const metadata: Metadata = {
  title: "Reset Your NGO Password",
  description: "Request a password reset link for your MomCare NGO account.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <NgoForgotPasswordClient />;
}
