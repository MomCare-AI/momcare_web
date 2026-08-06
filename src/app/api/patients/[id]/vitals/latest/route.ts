import { NextResponse } from 'next/server'
import { api } from '@/lib/api/client'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await api.GET("/api/v1/iot/patients/{patient_id}/vitals/latest", {
    params: {
      path: { patient_id: id }
    }
  })

  if (error) {
    return NextResponse.json(error, { status: 500 })
  }

  return NextResponse.json(data)
}
