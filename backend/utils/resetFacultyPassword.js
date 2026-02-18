import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Faculty } from "../models/Faculty.js";

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error(
    "Usage: node utils/resetFacultyPassword.js <facultyEmail> <newPassword>"
  );
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const faculty = await Faculty.findOne({ email: email.toLowerCase().trim() });
if (!faculty) {
  console.error("Faculty not found.");
  await mongoose.disconnect();
  process.exit(1);
}

faculty.password = await bcrypt.hash(newPassword, 12);
await faculty.save();

console.log(`Password reset successful for ${faculty.email}`);
await mongoose.disconnect();
