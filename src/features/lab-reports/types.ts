export interface LabReport {
  id: string
  patientId: string
  hemoglobin: number | null
  bloodGlucose: number | null
  ironLevel: number | null
  status: "pending" | "verified" | "rejected"
  reportImageUrl: string
  uploadedAt: string
}
