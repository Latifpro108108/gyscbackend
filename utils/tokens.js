import crypto from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_TTL = "24h";
const REFRESH_DAYS = 7;

export function signAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL },
  );
}

export function signRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_DAYS);
  return d;
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    country: user.country,
    dob: user.dob,
    interests: user.interests,
    newsletterOptIn: user.newsletterOptIn,
    role: user.role,
    status: user.status,
  };
}

export function isSuperAdminEmail(email) {
  const superEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@gysc.ca").toLowerCase();
  return email?.toLowerCase() === superEmail;
}
