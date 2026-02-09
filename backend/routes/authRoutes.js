import express from "express";
import { facultyLogin, studentEnter } from "../controllers/authController.js";

const router = express.Router();

router.post("/faculty/login", facultyLogin);
router.post("/student/enter", studentEnter);

export default router;
