export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  scheduledAt: string
  status: "upcoming" | "completed" | "cancelled" | "no-show"
}
