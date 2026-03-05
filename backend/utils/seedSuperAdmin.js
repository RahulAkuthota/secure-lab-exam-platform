import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { SuperAdmin } from "../models/SuperAdmin.js";
import { connectDB } from "../config/db.js";

const seedSuperAdmin = async () => {
    try {
        await connectDB();

        const email = "superadmin@lab.local";
        const password = "password123";
        const name = "System Super Admin";

        const hashedPassword = await bcrypt.hash(password, 12);

        let admin = await SuperAdmin.findOne({ email });

        if (admin) {
            admin.password = hashedPassword;
            admin.name = name;
            await admin.save();
            console.log("Super Admin updated successfully");
        } else {
            admin = await SuperAdmin.create({
                name,
                email,
                password: hashedPassword,
                role: "super_admin"
            });
            console.log("Super Admin created successfully");
        }

        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding Super Admin:", error);
        process.exit(1);
    }
};

seedSuperAdmin();
