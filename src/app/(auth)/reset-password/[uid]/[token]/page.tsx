import type { Metadata } from "next";
import { ResetPasswordPageClient } from "./components/ResetPasswordPageClient";

export const metadata: Metadata = {
  title: "Set a New Password",
  description: "Set a new password for your MomCare account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ uid: string; token: string }>;
}) {
  const { uid, token } = await params;
  return <ResetPasswordPageClient uid={uid} token={token} />;
}
