import { API_BASE } from "@/core/api/apiBase";
import { clearAccessToken, logout, setAccessToken } from "@/core/api/authFetch";
import { clearQueryCache } from "@/core/query/queryClient";

/** One message for every failure that is not a network error, so the form
 *  never says whether an account exists or what role it holds. */
export const PLATFORM_SIGN_IN_ERROR = "Invalid email or password.";

/**
 * Sign in to the platform console.
 *
 * Uses the same API login as everyone else; what makes this the "platform"
 * door is that it only keeps the session for a `platform_admin`. Any other
 * account that authenticates is signed straight back out — the session the
 * server just opened is revoked, not merely forgotten — and gets the same
 * message as a wrong password.
 */
export async function signInPlatformAdmin(
  email: string,
  password: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.access) throw new Error(PLATFORM_SIGN_IN_ERROR);

  if (data.user?.role_code !== "platform_admin") {
    // Open just long enough to revoke the refresh cookie the server set.
    setAccessToken(data.access);
    await logout();
    clearAccessToken();
    throw new Error(PLATFORM_SIGN_IN_ERROR);
  }

  clearQueryCache();
  setAccessToken(data.access);
}
