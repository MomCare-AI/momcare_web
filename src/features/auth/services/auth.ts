import api from "@/lib/services/api-client"
import type { User } from '@/features/auth/types'

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { email, password }),
  me: () => api.get<User>("/auth/me"),
  logout: () => { localStorage.removeItem("token") },
}
