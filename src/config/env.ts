import 'server-only'
import { z } from 'zod'

// Validated once, at import time, on both server and client. A missing
// or malformed env var fails loudly and immediately with a clear
// message, instead of surfacing later as a confusing runtime
// `undefined` deep inside a fetch call.
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Server-only on purpose - see src/lib/api/client.ts. Never prefix
  // this with NEXT_PUBLIC_; that would leak it into the browser bundle
  // and defeat the BFF pattern the whole API layer is built around.
  FASTAPI_BASE_URL: z.string().url(),
})

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  FASTAPI_BASE_URL: process.env.FASTAPI_BASE_URL,
})

if (!parsed.success) {
  throw new Error(
    'Invalid or missing environment variables:\n' +
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2) +
      '\n\nCheck web/.env.local against .env.example.'
  )
}

export const env = parsed.data
