import mongoose from "mongoose";

const superAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin"],
      default: "super_admin",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
