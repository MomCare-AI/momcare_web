import api from "@/core/api/api-client";
import mockUsers from "@/mockData/users.json";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "@/core/auth/types";

// No Django backend yet — login/register check src/mockData/users.json
// directly instead of calling a real (or fake) HTTP endpoint. Once Django's
// real auth contract exists (see docs/postman_collection.json), these two
// get rewritten to call `api` like `me` already does below.
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const match = mockUsers.find(
      (u) =>
        u.email === credentials.email && u.password === credentials.password
    );
    if (!match) {
      throw new Error("Invalid email or password");
    }
    const { password: _password, ...user } = match;
    return { token: `mock-jwt-token-${user.role}`, user: user as User };
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const user: User = {
      id: "99",
      name: credentials.name,
      email: credentials.email,
      role: "doctor",
    };
    return { token: "mock-jwt-token-doctor", user };
  },

  me: () => api.get<User>("/auth/me/"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};
