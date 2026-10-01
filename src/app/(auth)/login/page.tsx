import type { Metadata } from "next";
import React from "react";
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
  return (
    <React.Suspense fallback={null}>
      <LoginPageClient />
    </React.Suspense>
  );
}
