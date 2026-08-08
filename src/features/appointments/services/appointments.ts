import api from "@/lib/services/api-client"
import type { Appointment } from '@/features/appointments/types'

export const appointmentsService = {
  getAll: () => api.get<Appointment[]>("/appointments"),
  create: (data: Partial<Appointment>) => api.post("/appointments", data),
  update: (id: string, data: Partial<Appointment>) => api.put(`/appointments/${id}`, data),
}
