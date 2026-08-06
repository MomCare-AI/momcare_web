import 'server-only'
import createClient from 'openapi-fetch'
import type { paths } from './schema'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

export const api = createClient<paths>({
  baseUrl: process.env.FASTAPI_BASE_URL,
})

// Middleware to inject the Bearer token automatically
api.use({
  async onRequest({ request }) {
    const supabase = await createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.access_token) {
      request.headers.set('Authorization', `Bearer ${session.access_token}`)
    }
    return request
  },
})
