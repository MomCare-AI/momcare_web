import api from "@/core/api/api-client"
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from "@/core/auth/types"

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>("/auth/login/", credentials),

  register: (credentials: RegisterCredentials) =>
    api.post<AuthResponse>("/auth/register/", credentials),

  me: () => api.get<User>("/auth/me/"),

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },
}