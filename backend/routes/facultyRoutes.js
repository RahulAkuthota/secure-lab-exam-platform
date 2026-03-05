import express from "express";
import {
  activateExam,
  createExam,
  createQuestionPaper,
  deactivateExam,
  updateExamDetails,
  getQuestionPaper,
  getMyExams,
  getExamResults,
  getAggregatedExamResults,
  finalizeExamResults,
  getFinalResults,
  publishExamResults,
  overrideStudentScore,
  downloadFinalResultsCsv,
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
router.get("/exams/:examId/results", getExamResults);
router.get("/exams/:examId/aggregated-results", getAggregatedExamResults);
router.get("/exams/:examId/final-results", getFinalResults);
router.post("/exams/:examId/finalize-results", finalizeExamResults);
router.post("/exams/:examId/publish-results", publishExamResults);
router.post("/results/override", overrideStudentScore);
router.get("/exams/:examId/download-final-csv", downloadFinalResultsCsv);
router.post("/activate-exam", activateExam);
router.post("/deactivate-exam", deactivateExam);

export default router;
