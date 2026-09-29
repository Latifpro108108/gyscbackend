import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 320 },
    body: { type: String, required: true },
    category: { type: String, enum: ["activity", "collaboration"], required: true },
    partner: { type: String, trim: true, maxlength: 120, default: "" },
    eventDate: { type: String, trim: true, default: "" },
    coverImageUrl: { type: String, default: "" },
    coverCloudinaryPublicId: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    featured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Post", postSchema);