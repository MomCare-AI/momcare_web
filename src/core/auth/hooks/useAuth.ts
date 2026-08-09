"use client";
import { useState } from "react";
import type { User } from "@/core/auth/types";

export function useAuth() {
  // No backend to check a token against yet, so there's nothing to load.
  // Once real token verification exists, this becomes a useEffect that
  // sets user/loading after an actual async check.
  const [user] = useState<User | null>(null);
  const [loading] = useState(false);

  return { user, loading };
}
