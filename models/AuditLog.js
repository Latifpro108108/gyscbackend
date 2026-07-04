import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model("AuditLog", auditLogSchema);
