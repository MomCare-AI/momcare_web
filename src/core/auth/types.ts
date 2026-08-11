export type Role = "doctor" | "ngo" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}