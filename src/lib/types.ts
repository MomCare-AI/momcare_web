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

// Shape expected from GET /api/patients/{id} - the backend endpoint this
// calls doesn't exist yet (see docs/GEMINI_KICKOFF.md's "not yet built"
// list), so this is the frontend's contract for when it does, not a
// confirmed backend response.
export type Patient = {
  id: string
  age: number | null
  gestational_week: number | null
  due_date: string | null
  provider_name: string | null
  nurse_name: string | null
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  // Per-patient threshold overrides - see docs/DESIGN_RESEARCH_TOCA.md,
  // "Data bounds" - the most safety-relevant finding from that review.
  glucose_min: number | null
  glucose_max: number | null
  sys_min: number | null
  sys_max: number | null
  dia_min: number | null
  dia_max: number | null
  hr_min: number | null
  hr_max: number | null
  user: {
    full_name: string | null
    phone_number: string | null
    email: string | null
  } | null
}
