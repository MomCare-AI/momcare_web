"use client"
import { useEffect, useState } from "react"
import { patientsService } from '@/features/patients/services/patients'
import type { Patient } from '@/features/patients/types'

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientsService.getAll()
      .then((res: any) => setPatients(res.data))
      .finally(() => setLoading(false))
  }, [])

  return { patients, loading }
}
