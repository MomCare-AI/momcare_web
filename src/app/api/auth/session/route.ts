import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api/client'

export async function POST() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch role from FastAPI via Supabase token. Goes through the same
  // typed client every other route uses - a hand-built fetch URL here
  // previously assumed FASTAPI_BASE_URL included /api/v1, which broke
  // the moment that env var was fixed to NOT include it (the typed
  // client's paths already have /api/v1 baked in from the schema).
  const { data: profile, error } = await api.GET('/api/v1/auth/me')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  if (!profile.role) {
    return NextResponse.json({ error: 'No role found' }, { status: 403 })
  }

  const nextResponse = NextResponse.json({ success: true, role: profile.role })
  nextResponse.cookies.set('user_role', profile.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })

  return nextResponse
}
