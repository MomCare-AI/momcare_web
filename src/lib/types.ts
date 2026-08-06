export type Alert = {
  id: string
  patient_id: string
  alert_type: string
  triggered_at: string
  reading_summary: string
  status: 'pending' | 'acknowledged' | 'resolved'
}

export type VitalReading = {
  id: string
  patient_id: string
  systolic_bp: number | null
  diastolic_bp: number | null
  heart_rate: number | null
  temperature: number | null
  spo2: number | null
  recorded_at: string
}
