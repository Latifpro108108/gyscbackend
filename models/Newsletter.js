import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    issue: { type: String, required: true },
    date: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    color: { type: String, default: "#0f9f6f" },
    coverImageUrl: { type: String, default: "" },
    coverCloudinaryPublicId: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    pdfCloudinaryPublicId: { type: String, default: "" },
    // Store PDF directly in MongoDB — no external storage needed
    pdfData: { type: Buffer },
    pdfFileName: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Newsletter", newsletterSchema);
