import { authFetch, authJson } from "@/core/api/authFetch";
import type {
  JoinRequest,
  JoinRequestListResponse,
  JoinRequestStatus,
} from "./types";

export function listJoinRequests(status?: JoinRequestStatus) {
  const query = status ? `?status=${status}` : "";
  return authJson<JoinRequestListResponse>(`/api/patient-requests/${query}`);
}

/** One request, opened by staff. Opening it creates nothing. */
export function getJoinRequest(requestId: string) {
  return authJson<JoinRequest>(`/api/patient-requests/${requestId}/`);
}

/**
 * There is no approve call: saving the enrolment form with `join_request` set
 * is the approval. Rejecting is the only decision made here; every error
 * comes back as `{"detail": "a full sentence"}` meant to be shown as it is.
 */
export async function rejectJoinRequest(
  requestId: string,
  note?: string
): Promise<JoinRequest> {
  const res = await authFetch(`/api/patient-requests/${requestId}/reject/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: note ?? "" }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.detail ?? "Could not reject this request.");
  }
  return body as JoinRequest;
}
