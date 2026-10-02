import type { Metadata } from "next";

import { NgoResetPasswordClient } from "./components/NgoResetPasswordClient";

export const metadata: Metadata = {
  title: "Set a New NGO Password",
  description: "Set a new password for your MomCare NGO account.",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ uid: string; token: string }>;
}) {
  const { uid, token } = await params;
  return <NgoResetPasswordClient uid={uid} token={token} />;
}
