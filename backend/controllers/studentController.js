import { Exam } from "../models/Exam.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Submission } from "../models/Submission.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { enqueueSubmissionJob } from "../utils/redisQueue.js";
import { randomUUID } from "crypto";

const validateExamIsOpen = async (examId) => {
  const now = new Date();

  const exam = await Exam.findOne({
    _id: examId,
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  });

  return exam;
};

export const getActiveExams = asyncHandler(async (req, res) => {
  const now = new Date();

  const exams = await Exam.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  })
    .select("_id title startTime endTime duration allowedLanguages")
    .sort({ startTime: 1 });

  res.status(200).json({ exams });
});

export const startExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  const tokenExamId = req.user.examId;

  const effectiveExamId = examId || tokenExamId;
  if (!effectiveExamId) {
    return res.status(400).json({ message: "examId is required." });
  }

  const exam = await validateExamIsOpen(effectiveExamId);
  if (!exam) {
    return res.status(403).json({ message: "Exam is not active right now." });
  }

  if (tokenExamId && tokenExamId.toString() !== effectiveExamId.toString()) {
    return res
      .status(403)
      .json({ message: "Student token does not allow this exam." });
  }

  let submission = await Submission.findOne({
    examId: effectiveExamId,
    studentId: req.user.sub,
  });

  if (submission?.isSubmitted) {
    return res
      .status(409)
      .json({ message: "Exam already submitted. Cannot start again." });
  }

  if (!submission) {
    submission = await Submission.create({
      examId: effectiveExamId,
      studentId: req.user.sub,
      isSubmitted: false,
      answers: [],
    });
  }

  const questionPaper = await QuestionPaper.findOne({ examId: effectiveExamId });
  if (!questionPaper) {
    return res.status(404).json({ message: "Question paper not found." });
  }

  // Never send correct answers to student-facing routes.
  const safeQuestions = questionPaper.questions.map((question, index) => ({
    questionIndex: index,
    title: question.title,
    description: question.description,
    questionText: question.title,
    options: [],
    publicTestCases: question.publicTestCases,
  }));

  res.status(200).json({
    message: "Exam started.",
    exam: {
      id: exam._id,
      title: exam.title,
      duration: exam.duration,
      startTime: exam.startTime,
      endTime: exam.endTime,
      allowedLanguages: exam.allowedLanguages || [],
    },
    submissionId: submission._id,
    questions: safeQuestions,
  });
});

export const submitExam = asyncHandler(async (req, res) => {
  const { examId, answers } = req.body;
  const tokenExamId = req.user.examId;
  const effectiveExamId = examId || tokenExamId;

  if (!effectiveExamId) {
    return res.status(400).json({ message: "examId is required." });
  }

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: "answers must be an array." });
  }

  if (tokenExamId && tokenExamId.toString() !== effectiveExamId.toString()) {
    return res
      .status(403)
      .json({ message: "Student token does not allow this exam." });
  }

  const exam = await validateExamIsOpen(effectiveExamId);
  if (!exam) {
    return res.status(403).json({ message: "Exam is not active right now." });
  }

  const existingSubmission = await Submission.findOne({
    examId: effectiveExamId,
    studentId: req.user.sub,
  });

  if (existingSubmission?.isSubmitted) {
    return res.status(409).json({
      message: "Submission already exists. Multiple submissions are blocked.",
    });
  }

  let finalSubmission;
  if (!existingSubmission) {
    finalSubmission = await Submission.create({
      examId: effectiveExamId,
      studentId: req.user.sub,
      answers,
      submittedAt: new Date(),
      isSubmitted: true,
    });
  } else {
    existingSubmission.answers = answers;
    existingSubmission.submittedAt = new Date();
    existingSubmission.isSubmitted = true;
    finalSubmission = await existingSubmission.save();
  }

  res.status(200).json({
    message: "Exam submitted successfully.",
    submission: {
      id: finalSubmission._id,
      examId: finalSubmission.examId,
      studentId: finalSubmission.studentId,
      submittedAt: finalSubmission.submittedAt,
      isSubmitted: finalSubmission.isSubmitted,
    },
  });
});

export const submitCode = asyncHandler(async (req, res) => {
  const {
    examId,
    questionIndex,
    language,
    code,
    submissionType = "private",
  } = req.body;
  const tokenExamId = req.user.examId;
  const effectiveExamId = examId || tokenExamId;

  if (!effectiveExamId) {
    return res.status(400).json({ message: "examId is required." });
  }

  if (!Number.isInteger(questionIndex) || questionIndex < 0) {
    return res
      .status(400)
      .json({ message: "questionIndex must be a non-negative integer." });
  }

  if (!language || typeof language !== "string") {
    return res.status(400).json({ message: "language is required." });
  }

  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ message: "code is required." });
  }

  if (!["public", "private"].includes(submissionType)) {
    return res
      .status(400)
      .json({ message: "submissionType must be 'public' or 'private'." });
  }

  if (tokenExamId && tokenExamId.toString() !== effectiveExamId.toString()) {
    return res
      .status(403)
      .json({ message: "Student token does not allow this exam." });
  }

  const exam = await validateExamIsOpen(effectiveExamId);
  if (!exam) {
    return res.status(403).json({ message: "Exam is not active right now." });
  }

  const examLanguages = Array.isArray(exam.allowedLanguages)
    ? exam.allowedLanguages
    : [];
  if (examLanguages.length > 0 && !examLanguages.includes(language)) {
    return res.status(400).json({
      message: `Language '${language}' is not allowed for this exam.`,
    });
  }

  const questionPaper = await QuestionPaper.findOne({ examId: effectiveExamId })
    .select("questions")
    .lean();

  if (!questionPaper || !Array.isArray(questionPaper.questions)) {
    return res.status(404).json({ message: "Question paper not found." });
  }

  if (questionIndex >= questionPaper.questions.length) {
    return res.status(400).json({ message: "Invalid questionIndex." });
  }

  const job = {
    jobId: randomUUID(),
    studentId: req.user.sub,
    rollNumber: req.user.rollNumber,
    examId: effectiveExamId.toString(),
    questionIndex,
    language: language.trim().toLowerCase(),
    code,
    submissionType,
    queuedAt: new Date().toISOString(),
  };

  const queueInfo = await enqueueSubmissionJob(job);

  res.status(202).json({
    message: "Submission queued successfully.",
    jobId: job.jobId,
    queue: queueInfo.queue,
  });
});
