import { NextResponse } from 'next/server'
import { api } from '@/lib/api/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error, response } = await api.POST(
    '/api/v1/alerts/{alert_id}/acknowledge',
    {
      params: { path: { alert_id: id } },
      body: { user_id: session.user.id },
    }
  )

  if (error) {
    return NextResponse.json(error, { status: response.status })
  }

  return NextResponse.json(data)
}
