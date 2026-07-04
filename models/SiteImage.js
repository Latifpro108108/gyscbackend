import mongoose from "mongoose";

const siteImageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    section: { type: String, default: "general" },
    url: { type: String, default: "" },
    cloudinaryPublicId: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("SiteImage", siteImageSchema);
