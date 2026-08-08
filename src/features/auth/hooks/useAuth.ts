"use client"
import { useEffect, useState } from "react"
import type { User } from '@/features/auth/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // fetch current user from token
    setLoading(false)
  }, [])

  return { user, loading }
}
