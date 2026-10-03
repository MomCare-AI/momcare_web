import { notFound } from "next/navigation";

import { HospitalReview } from "@/features/platform-admin/components/HospitalReview";
import { NgoReview } from "@/features/platform-admin/components/NgoReview";
import { PreviewNotice } from "@/features/platform-admin/components/PreviewNotice";

export default async function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (type !== "hospital" && type !== "ngo") notFound();

  return (
    <>
      <PreviewNotice />
      {type === "hospital" ? <HospitalReview id={id} /> : <NgoReview id={id} />}
    </>
  );
}
