import express from "express";
import {
    facultyLogin,
    studentEnter,
    superAdminLogin,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/faculty/login", facultyLogin);
router.post("/admin/login", superAdminLogin);
router.post("/student/enter", studentEnter);

export default router;
