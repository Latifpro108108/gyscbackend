import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { authRequired, blockSuperAdminTarget } from "../middleware/auth.js";
import { isSuperAdminEmail, publicUser } from "../utils/tokens.js";

const router = express.Router();

router.get("/export", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      exportedAt: new Date().toISOString(),
      data: publicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/profile", authRequired, blockSuperAdminTarget, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (isSuperAdminEmail(user.email)) {
      return res.status(403).json({ error: "This account cannot be modified." });
    }

    const { firstName, lastName, country, interests, newsletterOptIn } = req.body;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (country !== undefined) user.country = country;
    if (interests !== undefined) user.interests = interests;
    if (newsletterOptIn !== undefined) user.newsletterOptIn = newsletterOptIn;
    if (firstName || lastName) {
      user.name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.name;
    }

    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/account", authRequired, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== "DELETE") {
      return res.status(400).json({ message: 'Type DELETE to confirm account removal.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (isSuperAdminEmail(user.email)) {
      return res.status(403).json({ error: "This account cannot be modified." });
    }

    user.firstName = "[deleted]";
    user.lastName = "";
    user.name = "[deleted]";
    user.email = `deleted_${user._id}@gysc.local`;
    user.country = "";
    user.interests = [];
    user.newsletterOptIn = false;
    user.status = "deleted";
    user.password = await bcrypt.hash(cryptoRandom(), 12);
    await user.save();
    await Session.deleteMany({ userId: user._id });

    res.clearCookie("gysc_refresh");
    res.clearCookie("gysc_access");
    res.json({ message: "Account anonymized successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function cryptoRandom() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default router;
