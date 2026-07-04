import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isSuperAdminEmail } from "../utils/tokens.js";

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.gysc_access) return req.cookies.gysc_access;
  return null;
}

export function authRequired(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function adminRequired(req, res, next) {
  if (!["admin", "super_admin"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function superAdminRequired(req, res, next) {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
}

export function blockSuperAdminTarget(req, res, next) {
  const email = req.body?.email || req.params?.email;
  if (email && isSuperAdminEmail(email)) {
    return res.status(403).json({ error: "This account cannot be modified." });
  }
  next();
}

export async function attachUser(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.currentUser = await User.findById(payload.id).select("-password");
  } catch {
    /* ignore */
  }
  next();
}
