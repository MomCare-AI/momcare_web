import { notFound } from "next/navigation";

const SECTIONS: Record<string, string> = {
  beneficiaries: "Beneficiaries",
  programs: "Programs",
  reports: "Reports",
  messages: "Messages",
  settings: "Settings",
};

export default async function NgoSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const title = SECTIONS[section];
  if (!title) notFound();
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">Coming soon.</p>
    </>
  );
}
