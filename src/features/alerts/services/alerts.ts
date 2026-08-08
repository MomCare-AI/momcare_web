import api from "@/lib/services/api-client"
import type { Alert } from '@/features/alerts/types'

export const alertsService = {
  getAll: () => api.get<Alert[]>("/alerts"),
  acknowledge: (id: string) => api.patch(`/alerts/${id}/acknowledge`),
}
