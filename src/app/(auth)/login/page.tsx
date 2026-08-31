import type { Metadata } from "next";
import { LoginPageClient } from "./components/LoginPageClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your hospital's MomCare account.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return <LoginPageClient />;
}
