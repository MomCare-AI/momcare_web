"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type Query,
} from "@tanstack/react-query";

import { SessionExpiredError } from "@/core/api/authFetch";
import * as api from "../api";
import type {
  AdjustmentInput,
  AllergiesInput,
  CarePlan,
  CurrentCarePlan,
} from "../types";

export const carePlanKeys = {
  current: (pregnancyId: string) =>
    ["care-plan", "current", pregnancyId] as const,
};

/** How often to ask again while a plan is being written (guide: 3-5 s). */
export const CARE_PLAN_POLL_MS = 4000;

/** Poll only while the backend says the plan is `preparing` or has an
 *  `update_pending`; stop on its own the moment both clear. */
export function carePlanRefetchInterval(
  query: Pick<Query<CurrentCarePlan>, "state">
): number | false {
  const data = query.state.data;
  return data && (data.preparing || data.update_pending)
    ? CARE_PLAN_POLL_MS
    : false;
}

export function useCurrentCarePlan(pregnancyId: string | undefined) {
  return useQuery({
    queryKey: carePlanKeys.current(pregnancyId ?? ""),
    queryFn: () => api.getCurrentCarePlan(pregnancyId!),
    enabled: Boolean(pregnancyId),
    refetchInterval: carePlanRefetchInterval,
    retry: (count, error) =>
      !(error instanceof SessionExpiredError) && count < 1,
  });
}

/**
 * Every write returns the complete updated plan, so the cached plan is
 * replaced with that response — never patched by hand. A write is also the end
 * of any "preparing"/"update pending" state the plan was in, so those flags
 * clear with it.
 */
function usePlanWrite<TInput>(
  pregnancyId: string,
  write: (input: TInput) => Promise<CarePlan>,
  { affectsReviewLists = false }: { affectsReviewLists?: boolean } = {}
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: (plan) => {
      queryClient.setQueryData<CurrentCarePlan>(
        carePlanKeys.current(pregnancyId),
        {
          care_plan: plan,
          preparing: false,
          update_pending: false,
          status_message: null,
        }
      );
      // Review / finalize / reopen move a patient in or out of the doctor
      // dashboard's "plans to review" list.
      if (affectsReviewLists) {
        queryClient.invalidateQueries({ queryKey: ["patients"] });
      }
    },
  });
}

export function useCarePlanActions(pregnancyId: string, planId: string) {
  return {
    adjust: usePlanWrite(pregnancyId, (input: AdjustmentInput) =>
      api.addAdjustment(planId, input)
    ),
    editAdjustment: usePlanWrite(
      pregnancyId,
      (v: {
        adjustmentId: string;
        content: NonNullable<AdjustmentInput["content"]>;
      }) => api.updateAdjustment(planId, v.adjustmentId, v.content)
    ),
    undoAdjustment: usePlanWrite(pregnancyId, (adjustmentId: string) =>
      api.deleteAdjustment(planId, adjustmentId)
    ),
    addMedication: usePlanWrite(pregnancyId, (text: string) =>
      api.addMedication(planId, text)
    ),
    editMedication: usePlanWrite(
      pregnancyId,
      (v: { id: string; text: string }) =>
        api.updateMedication(planId, v.id, v.text)
    ),
    removeMedication: usePlanWrite(pregnancyId, (id: string) =>
      api.deleteMedication(planId, id)
    ),
    addNote: usePlanWrite(pregnancyId, (text: string) =>
      api.addNote(planId, text)
    ),
    editNote: usePlanWrite(pregnancyId, (v: { id: string; text: string }) =>
      api.updateNote(planId, v.id, v.text)
    ),
    removeNote: usePlanWrite(pregnancyId, (id: string) =>
      api.deleteNote(planId, id)
    ),
    saveAllergies: usePlanWrite(pregnancyId, (input: AllergiesInput) =>
      api.updateAllergies(planId, input)
    ),
    review: usePlanWrite<void>(pregnancyId, () => api.reviewPlan(planId), {
      affectsReviewLists: true,
    }),
    finalize: usePlanWrite<void>(pregnancyId, () => api.finalizePlan(planId), {
      affectsReviewLists: true,
    }),
    reopen: usePlanWrite<void>(pregnancyId, () => api.reopenPlan(planId), {
      affectsReviewLists: true,
    }),
  };
}
