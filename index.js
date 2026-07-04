import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { seedDatabase } from "./seed/seed.js";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/account.js";
import contentRoutes from "./routes/content.js";
import adminRoutes from "./routes/admin.js";
import { securityHeaders } from "./middleware/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "frontend", "dist");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const configured = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  
  // Explicitly add the live frontend URLs to prevent CORS errors if env vars aren't synced
  configured.push("https://globalsustainabilitycouncil.netlify.app");
  configured.push("https://gyscwebsiteiong.onrender.com");

  if (configured.includes(origin)) return true;
  return /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
}

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/admin", adminRoutes);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { index: false }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0", () => resolve(server));
    server.on("error", reject);
  });
}

async function start() {
  await connectDB();
  await seedDatabase();

  try {
    await listen(PORT);
    const mode = fs.existsSync(distPath) ? "full stack" : "API only";
    console.log(`GYSC ${mode} running on port ${PORT}`);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Run: npx kill-port ${PORT}`);
      process.exit(1);
    }
    throw err;
  }
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
