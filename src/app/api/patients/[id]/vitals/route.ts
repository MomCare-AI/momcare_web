import { NextResponse } from 'next/server'
import { api } from '@/lib/api/client'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)

  const { data, error } = await api.GET('/api/v1/iot/patients/{patient_id}/vitals', {
    params: {
      path: { patient_id: id },
      query: {
        limit: Number(searchParams.get('limit')) || 50,
      },
    },
  })

  if (error) {
    return NextResponse.json(error, { status: 500 })
  }

  return NextResponse.json(data)
}
