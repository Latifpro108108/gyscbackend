import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { loginLimiter, registerLimiter } from "../middleware/security.js";
import { authRequired } from "../middleware/auth.js";
import { isSuperAdminEmail, publicUser, refreshExpiryDate, signAccessToken, signRefreshToken } from "../utils/tokens.js";

const router = express.Router();

function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: maxAgeMs,
  };
}

async function issueSession(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken();
  await Session.create({
    userId: user._id,
    refreshToken,
    expiresAt: refreshExpiryDate(),
  });
  res.cookie("gysc_refresh", refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
  res.cookie("gysc_access", accessToken, cookieOptions(24 * 60 * 60 * 1000));
  return { accessToken, user: publicUser(user) };
}

router.post("/register", registerLimiter, async (req, res) => {
  try {
    const {
      firstName, lastName, name, email, password, country, dob,
      interests, hearAbout, newsletterOptIn,
    } = req.body;

    const fullName = name || [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName: firstName || fullName.split(" ")[0] || "",
      lastName: lastName || fullName.split(" ").slice(1).join(" ") || "",
      name: fullName,
      email: email.toLowerCase(),
      password: hash,
      country: country || "",
      dob: dob ? new Date(dob) : null,
      interests: Array.isArray(interests) ? interests : [],
      hearAbout: hearAbout || "",
      newsletterOptIn: newsletterOptIn !== false,
      role: "member",
      status: "active",
    });

    const session = await issueSession(res, user);
    res.status(201).json({ token: session.accessToken, user: session.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.status === "deleted") {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Account suspended. Contact support." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    const session = await issueSession(res, user);
    res.json({ token: session.accessToken, user: session.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.gysc_refresh;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    const session = await Session.findOne({ refreshToken });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: "Session expired" });
    }

    const user = await User.findById(session.userId);
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Account unavailable" });
    }

    const accessToken = signAccessToken(user);
    res.cookie("gysc_access", accessToken, cookieOptions(24 * 60 * 60 * 1000));
    res.json({ token: accessToken, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/logout", authRequired, async (req, res) => {
  try {
    const refreshToken = req.cookies?.gysc_refresh;
    if (refreshToken) await Session.deleteOne({ refreshToken });
    res.clearCookie("gysc_refresh", cookieOptions(0));
    res.clearCookie("gysc_access", cookieOptions(0));
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
