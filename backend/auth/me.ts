import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Gets the current authenticated user's information.
export const me = api<void, UserInfo>(
  { method: "GET", path: "/auth/me", expose: true, auth: true },
  async () => {
    const auth = getAuthData()!;
    return {
      id: auth.userID,
      email: auth.email,
      name: auth.name,
      role: auth.role,
    };
  }
);