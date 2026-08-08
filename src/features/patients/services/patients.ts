import api from "@/lib/services/api-client"
import type { Patient, Vitals } from '@/features/patients/types'

export const patientsService = {
  getAll: () => api.get<Patient[]>("/patients"),
  getById: (id: string) => api.get<Patient>(`/patients/${id}`),
  getVitals: (id: string) => api.get<Vitals[]>(`/patients/${id}/vitals`),
}
