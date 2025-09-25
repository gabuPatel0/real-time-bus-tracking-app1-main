import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

router.post("/signup", async (req: Request, res: Response) => {
  const { email, password, name, role, phone } = req.body || {};
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "missing fields" });
  }

  const existingUser = await db.mongo.findOne('users', { email });
  if (existingUser) {
    return res.status(409).json({ error: "user with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.mongo.insertOne('users', {
    email,
    passwordHash,
    name,
    role,
    phone
  });

  const user = await db.mongo.findOne('users', { _id: result.insertedId }) as { _id: string; email: string; name: string; role: string } | null;

  if (!user) {
    return res.status(500).json({ error: "failed to create user" });
  }

  const token = jwt.sign({
    userID: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({ 
    token, 
    user: { 
      id: user._id.toString(), 
      email: user.email, 
      name: user.name, 
      role: user.role 
    } 
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "missing email or password" });
  }

  const user = await db.mongo.findOne('users', { email }) as { _id: string; email: string; passwordHash: string; name: string; role: string } | null;

  if (!user) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const token = jwt.sign({
    userID: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
  });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const a = req.auth!;
  return res.json({ id: a.userID, email: a.email, name: a.name, role: a.role });
});

export default router;
