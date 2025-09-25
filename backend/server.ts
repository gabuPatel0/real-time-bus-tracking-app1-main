import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import morgan from "morgan";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth";
import driverRouter from "./routes/driver";
import userRouter from "./routes/user";
import locationRouter from "./routes/location";

dotenv.config();
morgan("dev");
const app = express();

// Configure CORS to allow credentials from the frontend origin
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin) and the configured frontend origin
      // Also allow localhost variations and tunneled domains for development
      const allowedOrigins = [
        FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
      ];
      
      // Allow tunneled domains (ngrok, localtunnel, etc.)
      const isTunneledDomain = origin && (
        origin.includes('.ngrok.io') ||
        origin.includes('.loca.lt') ||
        origin.includes('.trycloudflare.com') ||
        origin.includes('.tunnel.me') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      );
      
      if (!origin || allowedOrigins.includes(origin) || isTunneledDomain) {
        return callback(null, true);
      }
      
      console.log(`CORS blocked origin: ${origin}`);
      return callback(null, true); // Allow all origins for development
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  })
);
// Optional: explicitly handle preflight
app.options("*", cors({ 
  origin: true, // Allow all origins for preflight
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]
}));

app.use(express.json());

// Add Content Security Policy headers for tunneled environments
app.use((req, res, next) => {
  // Set CSP headers to allow external resources
  res.setHeader('Content-Security-Policy', 
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob: https: http:; " +
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    "connect-src 'self' https: http: ws: wss:; " +
    "frame-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  // Add other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

// API routes
app.use("/auth", authRouter);
app.use("/driver", driverRouter);
app.use("/user", userRouter);
app.use("/location", locationRouter);
app.post("/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Serve frontend static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "./frontend/dist");

app.use("/frontend", express.static(frontendDist));

// SPA fallback for frontend
app.get("/frontend/*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
