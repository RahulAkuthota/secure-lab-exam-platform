import express from "express";
import {
  activateExam,
  createExam,
  createQuestionPaper,
  deactivateExam,
  updateExamDetails,
  getQuestionPaper,
  getMyExams,
} from "../controllers/facultyController.js";
import { requireAuth, requireFaculty } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireFaculty);

router.post("/create-exam", createExam);
router.put("/exams/:examId", updateExamDetails);
router.post("/update-exam-details", updateExamDetails);
router.post("/create-question-paper", createQuestionPaper);
router.get("/my-exams", getMyExams);
router.get("/question-paper/:examId", getQuestionPaper);
router.post("/activate-exam", activateExam);
router.post("/deactivate-exam", deactivateExam);

export default router;
