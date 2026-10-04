import type { Metadata } from "next";
import React from "react";

import { PlatformLoginForm } from "./PlatformLoginForm";

// Not linked from anywhere and kept out of search results. That is not what
// protects the console — the role check on every request is — it just means
// the page is not advertised.
export const metadata: Metadata = {
  title: "Console",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <PlatformLoginForm />
    </React.Suspense>
  );
}
