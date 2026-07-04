import express from "express";
import mongoose from "mongoose";
import SiteImage from "../models/SiteImage.js";
import SiteText from "../models/SiteText.js";
import Founder from "../models/Founder.js";
import Newsletter from "../models/Newsletter.js";

const router = express.Router();

function safeFilename(issue, title) {
  const base = `${issue || "newsletter"}-${title || "gysc"}`.replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "-");
  return `${base || "gysc-newsletter"}.pdf`;
}

/* ── Serve PDF directly from MongoDB ── */
router.get("/newsletters/:id/pdf", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid publication id" });
    }
    const item = await Newsletter.findById(req.params.id).select("pdfData pdfFileName issue title pdfUrl");
    if (!item) return res.status(404).json({ message: "Publication not found" });
    if (!item.pdfData || !item.pdfData.length) {
      return res.status(404).json({ message: "No PDF uploaded for this publication yet." });
    }

    const filename = safeFilename(item.issue, item.title);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", item.pdfData.length);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(item.pdfData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/newsletters/:id/download", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid publication id" });
    }
    const item = await Newsletter.findById(req.params.id).select("pdfData pdfFileName issue title pdfUrl");
    if (!item) return res.status(404).json({ message: "Publication not found" });
    if (!item.pdfData || !item.pdfData.length) {
      return res.status(404).json({ message: "No PDF uploaded for this publication yet." });
    }

    const filename = safeFilename(item.issue, item.title);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", item.pdfData.length);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(item.pdfData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── Public content listing ── */
router.get("/", async (_req, res) => {
  try {
    const [images, texts, founders, newsletters] = await Promise.all([
      SiteImage.find().sort({ section: 1, key: 1 }).lean(),
      SiteText.find().sort({ section: 1, key: 1 }).lean(),
      Founder.find().sort({ order: 1 }).lean(),
      Newsletter.find().select("-pdfData").sort({ createdAt: -1 }).lean(),
    ]);

    const textMap = Object.fromEntries(texts.map((t) => [t.key, t.value]));
    const imageMap = Object.fromEntries(images.map((i) => [i.key, i.url]));

    res.json({ images, texts, textMap, imageMap, founders, newsletters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
