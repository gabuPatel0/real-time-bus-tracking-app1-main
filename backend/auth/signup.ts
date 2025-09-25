import { api, APIError } from "encore.dev/api";
import db from "../db";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: "driver" | "user";
  phone?: string;
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

// Creates a new user account.
export const signup = api<SignupRequest, AuthResponse>(
  { method: "POST", path: "/auth/signup", expose: true },
  async (req) => {
    // Check if user already exists
    const existingUser = await db.mongo.findOne('users', { email: req.email });
    
    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(req.password, 10);

    // Create user
    const result = await db.mongo.insertOne('users', {
      email: req.email,
      passwordHash,
      name: req.name,
      role: req.role,
      phone: req.phone
    });

    const user = await db.mongo.findOne('users', { _id: result.insertedId }) as {
      _id: string;
      email: string;
      name: string;
      role: string;
    } | null;

    if (!user) {
      throw APIError.internal("failed to create user");
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
        role: user.role
      },
    };
  }
);
