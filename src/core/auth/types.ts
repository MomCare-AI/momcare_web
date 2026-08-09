export type Role = "doctor" | "ngo" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
