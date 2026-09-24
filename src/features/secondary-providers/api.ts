import { authFetch, authJson } from "@/core/api/authFetch";
import type { Paginated } from "@/features/patients/types";
import type { SecondaryProvider, SecondaryProviderInput } from "./types";

export function listSecondaryProviders(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return authJson<Paginated<SecondaryProvider>>(
    `/api/secondary-providers/${query}`
  );
}

export async function createSecondaryProvider(
  input: SecondaryProviderInput
): Promise<SecondaryProvider> {
  const res = await authFetch("/api/secondary-providers/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.name?.[0] ?? body?.detail ?? "Could not add this provider."
    );
  }
  return body as SecondaryProvider;
}

export async function updateSecondaryProvider(
  providerId: string,
  input: SecondaryProviderInput
): Promise<SecondaryProvider> {
  const res = await authFetch(`/api/secondary-providers/${providerId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.name?.[0] ?? body?.detail ?? "Could not save this provider."
    );
  }
  return body as SecondaryProvider;
}

export async function deleteSecondaryProvider(
  providerId: string
): Promise<void> {
  const res = await authFetch(`/api/secondary-providers/${providerId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? "Could not remove this provider.");
  }
}
