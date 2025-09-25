import { api, APIError } from "encore.dev/api";
import db from "../db";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Authenticates a user and returns a JWT token.
export const login = api<LoginRequest, AuthResponse>(
  { method: "POST", path: "/auth/login", expose: true },
  async (req) => {
    // Get user from database
    const user = await db.mongo.findOne('users', { email: req.email }) as {
      _id: string;
      email: string;
      passwordHash: string;
      name: string;
      role: string;
    } | null;

    if (!user) {
      throw APIError.unauthenticated("invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(req.password, user.passwordHash);
    if (!isValid) {
      throw APIError.unauthenticated("invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userID: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      jwtSecret(),
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
);
