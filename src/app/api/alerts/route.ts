import { NextResponse } from 'next/server'
import { api } from '@/lib/api/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const patientId = searchParams.get('patient_id')

  const { data, error } = await api.GET('/api/v1/alerts', {
    params: {
      query: {
        limit: Number(searchParams.get('limit')) || 100,
        ...(patientId ? { patient_id: patientId } : {}),
      },
    },
  })

  if (error) {
    return NextResponse.json(error, { status: 500 })
  }

  return NextResponse.json(data)
}
