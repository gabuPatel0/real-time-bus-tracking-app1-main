import { authHandler } from "encore.dev/auth";
import { Header, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";

const jwtSecret = secret("JWTSecret");

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
  role: "driver" | "user";
  name: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const token = params.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const payload = jwt.verify(token, jwtSecret()) as any;
      return {
        userID: payload.userID,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);
