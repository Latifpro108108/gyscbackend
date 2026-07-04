import express from "express";
import multer from "multer";
import SiteImage from "../models/SiteImage.js";
import SiteText from "../models/SiteText.js";
import Founder from "../models/Founder.js";
import Newsletter from "../models/Newsletter.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { uploadImage, uploadFile, deleteAsset } from "../config/cloudinary.js";
import { authRequired, adminRequired, blockSuperAdminTarget, superAdminRequired } from "../middleware/auth.js";
import { isSuperAdminEmail, publicUser } from "../utils/tokens.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authRequired, adminRequired);

/* ── Dashboard ── */
router.get("/dashboard", async (_req, res) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalMembers, subscribers, newThisMonth, activeAdmins, recent] = await Promise.all([
      User.countDocuments({ role: "member", status: { $ne: "deleted" } }),
      User.countDocuments({ newsletterOptIn: true, status: "active" }),
      User.countDocuments({ role: "member", createdAt: { $gte: monthStart } }),
      User.countDocuments({ role: { $in: ["admin", "super_admin"] }, status: "active" }),
      User.find({ role: "member" }).sort({ createdAt: -1 }).limit(10).select("-password"),
    ]);

    res.json({
      stats: { totalMembers, subscribers, newThisMonth, activeAdmins },
      recent: recent.map(publicUser),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Members ── */
router.get("/members", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const filter = { role: { $in: ["member", "admin"] } };
    if (q) {
      filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
    }
    const members = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(members.map(publicUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/members/:id", blockSuperAdminTarget, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Member not found" });
    if (isSuperAdminEmail(user.email)) {
      return res.status(403).json({ error: "This account cannot be modified." });
    }

    const { status } = req.body;
    if (status) user.status = status;

    await user.save();
    await AuditLog.create({
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: "member_update",
      target: user.email,
      ipAddress: req.ip,
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/members/:id", blockSuperAdminTarget, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Member not found" });
    if (isSuperAdminEmail(user.email)) {
      return res.status(403).json({ error: "This account cannot be modified." });
    }
    await user.deleteOne();
    res.json({ message: "Member deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/audit-log", superAdminRequired, async (_req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Site Images ── */
router.put("/images/:key", upload.single("image"), async (req, res) => {
  try {
    const { key } = req.params;
    let doc = await SiteImage.findOne({ key });
    if (!doc) {
      doc = new SiteImage({ key, url: "", section: "general" });
    }
    if (!req.file) return res.status(400).json({ message: "Image file is required" });

    if (doc.cloudinaryPublicId) {
      await deleteAsset(doc.cloudinaryPublicId);
    }

    const result = await uploadImage(req.file.buffer, "site-images", key);
    doc.url = result.secure_url;
    doc.cloudinaryPublicId = result.public_id;
    await doc.save();

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/images/:key", async (req, res) => {
  try {
    const doc = await SiteImage.findOne({ key: req.params.key });
    if (!doc) return res.status(404).json({ message: "Image slot not found" });

    if (doc.cloudinaryPublicId) {
      await deleteAsset(doc.cloudinaryPublicId);
    }
    doc.url = "";
    doc.cloudinaryPublicId = "";
    await doc.save();

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Site Text ── */
router.put("/texts/:key", async (req, res) => {
  try {
    const { value } = req.body;
    const doc = await SiteText.findOneAndUpdate(
      { key: req.params.key },
      { value: value ?? "" },
      { new: true, upsert: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Founders ── */
router.put("/founders/:id", upload.single("image"), async (req, res) => {
  try {
    const founder = await Founder.findById(req.params.id);
    if (!founder) return res.status(404).json({ message: "Founder not found" });

    const { name, role, country, message } = req.body;
    if (name !== undefined) founder.name = name;
    if (role !== undefined) founder.role = role;
    if (country !== undefined) founder.country = country;
    if (message !== undefined) founder.message = message;

    if (req.file) {
      if (founder.cloudinaryPublicId) await deleteAsset(founder.cloudinaryPublicId);
      const result = await uploadImage(req.file.buffer, "founders", `founder-${founder._id}`);
      founder.imageUrl = result.secure_url;
      founder.cloudinaryPublicId = result.public_id;
    }

    await founder.save();
    res.json(founder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/founders/:id/image", async (req, res) => {
  try {
    const founder = await Founder.findById(req.params.id);
    if (!founder) return res.status(404).json({ message: "Founder not found" });
    if (founder.cloudinaryPublicId) await deleteAsset(founder.cloudinaryPublicId);
    founder.imageUrl = "";
    founder.cloudinaryPublicId = "";
    await founder.save();
    res.json(founder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Newsletters ── */
router.get("/newsletters", async (_req, res) => {
  // Exclude pdfData from listing (it's large binary data)
  const items = await Newsletter.find().select("-pdfData").sort({ createdAt: -1 });
  res.json(items);
});

router.post("/newsletters", upload.fields([{ name: "pdf", maxCount: 1 }]), async (req, res) => {
  try {
    const { issue, date, title, excerpt, color } = req.body;
    if (!issue || !date || !title || !excerpt) {
      return res.status(400).json({ message: "Issue, date, title, and excerpt are required" });
    }
    if (!req.files?.pdf?.[0]) {
      return res.status(400).json({ message: "PDF file is required when publishing a newsletter" });
    }

    const pdfFile = req.files.pdf[0];
    const item = new Newsletter({
      issue, date, title, excerpt, color: color || "#0f9f6f",
      pdfData: pdfFile.buffer,
      pdfFileName: pdfFile.originalname || "newsletter.pdf",
      pdfUrl: "stored-in-db",
    });

    await item.save();
    // Return without the pdfData blob
    const obj = item.toObject();
    delete obj.pdfData;
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/newsletters/:id", upload.fields([{ name: "pdf", maxCount: 1 }]), async (req, res) => {
  try {
    const item = await Newsletter.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Newsletter not found" });

    const { issue, date, title, excerpt, color } = req.body;
    if (issue !== undefined) item.issue = issue;
    if (date !== undefined) item.date = date;
    if (title !== undefined) item.title = title;
    if (excerpt !== undefined) item.excerpt = excerpt;
    if (color !== undefined) item.color = color;

    if (req.files?.pdf?.[0]) {
      const pdfFile = req.files.pdf[0];
      item.pdfData = pdfFile.buffer;
      item.pdfFileName = pdfFile.originalname || "newsletter.pdf";
      item.pdfUrl = "stored-in-db";
    }

    await item.save();
    const obj = item.toObject();
    delete obj.pdfData;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/newsletters/:id", async (req, res) => {
  try {
    const item = await Newsletter.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Newsletter not found" });
    await item.deleteOne();
    res.json({ message: "Newsletter deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/newsletters/:id/pdf", async (req, res) => {
  try {
    const item = await Newsletter.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Newsletter not found" });
    item.pdfData = undefined;
    item.pdfFileName = "";
    item.pdfUrl = "";
    await item.save();
    const obj = item.toObject();
    delete obj.pdfData;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
