import "dotenv/config";
import jwt from "jsonwebtoken";

const superAdminId = process.argv[2];
const superAdminEmail = process.argv[3] || "superadmin@lab.local";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required in .env");
  process.exit(1);
}

if (!superAdminId) {
  console.error(
    "Usage: node src/utils/generateSuperAdminToken.js <superAdminId> [email]"
  );
  process.exit(1);
}

const token = jwt.sign(
  {
    sub: superAdminId,
    role: "super_admin",
    email: superAdminEmail,
  },
  process.env.JWT_SECRET,
  { expiresIn: "12h" }
);

console.log(token);
