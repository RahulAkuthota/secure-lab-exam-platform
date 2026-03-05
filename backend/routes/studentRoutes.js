import express from "express";
import {
  getActiveExams,
  getSubmissionResult,
  submitCode,
  startExam,
  submitExam,
  logViolation,
  remoteInitialize,
} from "../controllers/studentController.js";
import { requireAuth, requireStudent } from "../middlewares/authMiddleware.js";
import { requireStudentExamAccess } from "../middlewares/studentExamAccessMiddleware.js";

const router = express.Router();

router.post("/remote-initialize", remoteInitialize);

router.use(requireAuth, requireStudent);

router.get("/active-exams", getActiveExams);
router.post("/start-exam", startExam);
router.post("/submit-code", requireStudentExamAccess, submitCode);
router.get("/submit-code-result/:jobId", requireStudentExamAccess, getSubmissionResult);
router.post("/submit-exam", requireStudentExamAccess, submitExam);
router.post("/violation", logViolation);

export default router;
