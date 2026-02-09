import express from "express";
import { addFaculty } from "../controllers/adminController.js";
import { requireAuth, requireSuperAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/add-faculty", requireAuth, requireSuperAdmin, addFaculty);

export default router;
