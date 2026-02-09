import { Exam, SUPPORTED_LANGUAGES } from "../models/Exam.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeAllowedLanguages = (allowedLanguages) => {
  const normalizedLanguages = Array.isArray(allowedLanguages)
    ? [...new Set(allowedLanguages.map((language) => String(language).toLowerCase().trim()))]
    : [];

  const invalidLanguage = normalizedLanguages.find(
    (language) => !SUPPORTED_LANGUAGES.includes(language)
  );
  if (invalidLanguage) {
    const error = new Error(
      `Unsupported language: ${invalidLanguage}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }
  return normalizedLanguages;
};

export const createExam = asyncHandler(async (req, res) => {
  const { title, startTime, endTime, duration, allowedLanguages } = req.body;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({
      message: "title, startTime, and endTime are required.",
    });
  }

  const parsedStart = new Date(startTime);
  const parsedEnd = new Date(endTime);

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return res.status(400).json({ message: "Invalid startTime or endTime." });
  }

  if (parsedEnd <= parsedStart) {
    return res
      .status(400)
      .json({ message: "endTime must be greater than startTime." });
  }

  const calculatedDuration = Math.ceil((parsedEnd - parsedStart) / (1000 * 60));
  const finalDuration = Number(duration) > 0 ? Number(duration) : calculatedDuration;
  const normalizedLanguages = normalizeAllowedLanguages(allowedLanguages);

  const exam = await Exam.create({
    title: title.trim(),
    facultyId: req.user.sub,
    startTime: parsedStart,
    endTime: parsedEnd,
    duration: finalDuration,
    isActive: false,
    allowedLanguages: normalizedLanguages,
  });

  res.status(201).json({
    message: "Exam created successfully.",
    exam,
  });
});

export const updateExamDetails = asyncHandler(async (req, res) => {
  const examId = req.params.examId || req.body.examId;
  const { title, startTime, endTime, duration, allowedLanguages } = req.body;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({
      message: "title, startTime, and endTime are required.",
    });
  }

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  const parsedStart = new Date(startTime);
  const parsedEnd = new Date(endTime);

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return res.status(400).json({ message: "Invalid startTime or endTime." });
  }

  if (parsedEnd <= parsedStart) {
    return res.status(400).json({ message: "endTime must be greater than startTime." });
  }

  const calculatedDuration = Math.ceil((parsedEnd - parsedStart) / (1000 * 60));
  const finalDuration = Number(duration) > 0 ? Number(duration) : calculatedDuration;
  const normalizedLanguages = normalizeAllowedLanguages(allowedLanguages);

  exam.title = title.trim();
  exam.startTime = parsedStart;
  exam.endTime = parsedEnd;
  exam.duration = finalDuration;
  exam.allowedLanguages = normalizedLanguages;
  await exam.save();

  return res.status(200).json({
    message: "Exam details updated successfully.",
    exam,
  });
});

export const createQuestionPaper = asyncHandler(async (req, res) => {
  const { examId, questions } = req.body;

  if (!examId || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      message: "examId and non-empty questions array are required.",
    });
  }

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res
      .status(404)
      .json({ message: "Exam not found for this faculty." });
  }

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    if (!q.title || !q.description) {
      return res.status(400).json({
        message: `Question ${i + 1} must have title and description.`,
      });
    }

    if (!Array.isArray(q.publicTestCases) || q.publicTestCases.length < 2) {
      return res.status(400).json({
        message: `Question ${i + 1} must have at least 2 public test cases.`,
      });
    }

    if (!Array.isArray(q.privateTestCases) || q.privateTestCases.length < 10) {
      return res.status(400).json({
        message: `Question ${i + 1} must have at least 10 private test cases.`,
      });
    }

    const allTestCases = [...q.publicTestCases, ...q.privateTestCases];
    const invalidCase = allTestCases.find(
      (testCase) =>
        !testCase ||
        typeof testCase.input !== "string" ||
        typeof testCase.expectedOutput !== "string" ||
        !testCase.input.trim() ||
        !testCase.expectedOutput.trim()
    );
    if (invalidCase) {
      return res.status(400).json({
        message: `Question ${i + 1} contains invalid test case. input and expectedOutput are required.`,
      });
    }
  }

  const questionPaper = await QuestionPaper.findOneAndUpdate(
    { examId },
    { $set: { questions } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({
    message: "Question paper saved successfully.",
    questionPaper,
  });
});

export const getMyExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ facultyId: req.user.sub }).sort({ createdAt: -1 });
  res.status(200).json({ exams });
});

export const getQuestionPaper = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  const questionPaper = await QuestionPaper.findOne({ examId });
  if (!questionPaper) {
    return res.status(404).json({ message: "Question paper not found for this exam." });
  }

  return res.status(200).json({ questionPaper });
});

export const activateExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;

  if (!examId) {
    return res.status(400).json({ message: "examId is required." });
  }

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res
      .status(404)
      .json({ message: "Exam not found for this faculty." });
  }

  exam.isActive = true;
  await exam.save();

  res.status(200).json({ message: "Exam activated.", exam });
});

export const deactivateExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;

  if (!examId) {
    return res.status(400).json({ message: "examId is required." });
  }

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res
      .status(404)
      .json({ message: "Exam not found for this faculty." });
  }

  exam.isActive = false;
  await exam.save();

  res.status(200).json({ message: "Exam deactivated.", exam });
});
