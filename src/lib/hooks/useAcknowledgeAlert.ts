import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Alert } from '@/lib/types'

// Shared by the dashboard's alert feed and the patient detail page's
// alert history - both show the same alerts, just filtered differently,
// so both need the exact same acknowledge-and-update-cache behavior.
export function useAcknowledgeAlert(queryKey: unknown[]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to acknowledge alert')
      return res.json() as Promise<Alert>
    },
    // Update the cache immediately rather than waiting up to 10s for the
    // next poll - acknowledging a critical alert shouldn't feel like it
    // did nothing.
    onSuccess: (updatedAlert) => {
      queryClient.setQueryData<Alert[]>(queryKey, (old) =>
        old?.map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
      )
    },
  })
}
