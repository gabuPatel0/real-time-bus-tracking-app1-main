import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthData {
  userID: string;
  email: string;
  role: "driver" | "user" | string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthData;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization") || req.header("authorization");
  const token = header?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "missing token" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.auth = {
      userID: payload.userID,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}
