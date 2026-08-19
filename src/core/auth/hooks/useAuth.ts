"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/core/auth/services/auth";
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
} from "@/core/auth/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await authService.login(credentials);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      router.push(`/${user.role}`);
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await authService.register(credentials);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      router.push(`/${user.role}`);
    } catch {
      setError("Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    router.push("/login");
  };

  return { user, loading, error, login, register, logout };
}
