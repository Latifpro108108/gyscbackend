import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    country: { type: String, default: "" },
    dob: { type: Date, default: null },
    interests: { type: [String], default: [] },
    hearAbout: { type: String, default: "" },
    newsletterOptIn: { type: Boolean, default: true },
    role: { type: String, enum: ["member", "admin", "super_admin"], default: "member" },
    status: { type: String, enum: ["active", "suspended", "deleted"], default: "active" },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
