import mongoose from "mongoose";

const founderSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Founder Name" },
    role: { type: String, default: "Co-Founder · Policy Lead" },
    country: { type: String, default: "Country" },
    message: {
      type: String,
      default: "This space holds the founder's personal message to the world — to be filled by the founder.",
    },
    imageUrl: { type: String, default: "" },
    cloudinaryPublicId: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Founder", founderSchema);
