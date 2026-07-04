import mongoose from "mongoose";

const siteTextSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    section: { type: String, default: "general" },
    value: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("SiteText", siteTextSchema);
