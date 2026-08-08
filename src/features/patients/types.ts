export interface Patient {
  id: string
  name: string
  age: number
  bloodGroup: string
  bmi: number
  gestationalWeek: number
  riskLevel: "low" | "medium" | "high"
  assignedDoctorId: string
}

export interface Vitals {
  patientId: string
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  bodyTemperature: number
  bloodOxygen: number
  recordedAt: string
}
