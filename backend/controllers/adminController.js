import bcrypt from "bcrypt";
import { Faculty } from "../models/Faculty.js";
import { SuperAdmin } from "../models/SuperAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateDefaultPassword } from "../utils/generateDefaultPassword.js";

export const addFaculty = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "name and email are required." });
  }

  const superAdmin = await SuperAdmin.findById(req.user.sub);
  if (!superAdmin) {
    return res.status(403).json({
      message: "Super admin user not found. Insert it manually in DB first.",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingFaculty = await Faculty.findOne({ email: normalizedEmail });
  if (existingFaculty) {
    return res.status(409).json({ message: "Faculty email already exists." });
  }

  const defaultPassword = generateDefaultPassword();
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  const faculty = await Faculty.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "faculty",
  });

  res.status(201).json({
    message: "Faculty created successfully.",
    faculty: {
      id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      role: faculty.role,
      createdAt: faculty.createdAt,
    },
    defaultPassword,
  });
});
