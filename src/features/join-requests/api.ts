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

/**
 * Every error case here — already decided, already accepted elsewhere, a
 * draft that no longer validates — comes back as `{"detail": "a full
 * sentence"}`, written to be shown as-is rather than parsed into something
 * else. Approve additionally nests the newly created patient on success,
 * which the caller doesn't need here (the list/detail queries it invalidate
 * pick that up on their own refetch).
 */
async function decide(
  requestId: string,
  decision: "approve" | "reject",
  note?: string
): Promise<JoinRequest> {
  const res = await authFetch(
    `/api/patient-requests/${requestId}/${decision}/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note ?? "" }),
    }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      body?.detail ??
        `Could not ${decision === "approve" ? "approve" : "reject"} this request.`
    );
  }
  return body as JoinRequest;
}

export function approveJoinRequest(requestId: string, note?: string) {
  return decide(requestId, "approve", note);
}

export function rejectJoinRequest(requestId: string, note?: string) {
  return decide(requestId, "reject", note);
}
