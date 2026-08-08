export interface Alert {
  id: string
  patientId: string
  type: "bp" | "hr" | "temperature" | "glucose"
  severity: "medium" | "high" | "critical"
  message: string
  acknowledgedBy: string | null
  createdAt: string
}
