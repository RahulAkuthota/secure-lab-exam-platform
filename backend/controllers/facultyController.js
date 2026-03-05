import { Exam, SUPPORTED_LANGUAGES } from "../models/Exam.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Student } from "../models/Student.js";
import { Submission } from "../models/Submission.js";
import { FinalResult } from "../models/FinalResult.js";
import { ResultAudit } from "../models/ResultAudit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";



export const finalizeExamResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  // Check if exam is over
  if (new Date() < new Date(exam.endTime)) {
    return res.status(400).json({ message: "Exam is still in progress. Cannot finalize results yet." });
  }

  const resultsCollection = mongoose.connection.collection("results");

  // Aggregate best scores for each student
  const bestScores = await resultsCollection
    .aggregate([
      {
        $match: {
          examId: examId.toString(),
          submissionType: "private", // Always base credits on private test cases
        },
      },
      {
        $group: {
          _id: {
            studentId: "$studentId",
            questionIndex: "$questionIndex",
          },
          bestPassedCases: { $max: "$evaluation.passedCases" },
          totalCases: { $first: "$evaluation.totalCases" },
          rollNumber: { $first: "$rollNumber" },
        },
      },
      {
        $group: {
          _id: "$_id.studentId",
          rollNumber: { $first: "$rollNumber" },
          questions: {
            $push: {
              questionIndex: "$_id.questionIndex",
              passedCases: "$bestPassedCases",
              totalPossible: "$totalCases",
              score: "$bestPassedCases", // Assuming 1 mark per test case for now, can be sophisticated later
            },
          },
          totalScore: { $sum: "$bestPassedCases" },
          totalPossible: { $sum: "$totalCases" },
        },
      },
    ])
    .toArray();

  const studentIds = bestScores.map((bs) => bs._id).filter(Boolean);
  const validStudentObjectIds = studentIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const students = await Student.find({ _id: { $in: validStudentObjectIds } })
    .select("_id name rollNumber")
    .lean();
  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

  const questionPaper = await QuestionPaper.findOne({ examId }).lean();
  if (!questionPaper) {
    return res.status(404).json({ message: "Question paper not found for this exam." });
  }

  const finalResultDocs = bestScores.map((bs) => {
    const sId = String(bs._id);
    const student = studentMap.get(sId);

    // Map existing scores to their question indices
    const scoresByQuestion = new Map(bs.questions.map(q => [q.questionIndex, q]));

    // Build complete results for ALL questions in the paper
    const questionResults = questionPaper.questions.map((q, idx) => {
      const result = scoresByQuestion.get(idx);
      const totalPossibleForQ = q.privateTestCases?.length || 0;

      return {
        questionIndex: idx,
        score: result ? result.score : 0,
        totalPossible: totalPossibleForQ,
        passedCases: result ? result.passedCases : 0,
        manualAdjustment: 0,
        adjustmentNote: ""
      };
    });

    const totalScore = questionResults.reduce((sum, q) => sum + q.score, 0);
    const totalPossible = questionResults.reduce((sum, q) => sum + q.totalPossible, 0);

    return {
      examId: new mongoose.Types.ObjectId(examId),
      studentId: new mongoose.Types.ObjectId(sId),
      rollNumber: bs.rollNumber || student?.rollNumber || "-",
      studentName: student?.name || "Unknown Student",
      questionResults,
      totalScore,
      totalPossible,
      scorePercent: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
      status: "Finalized",
      finalizedAt: new Date()
    };
  });

  // Bulk upsert final results
  if (finalResultDocs.length > 0) {
    const bulkOps = finalResultDocs.map(doc => ({
      updateOne: {
        filter: { examId: doc.examId, studentId: doc.studentId },
        update: { $set: doc },
        upsert: true
      }
    }));
    await FinalResult.bulkWrite(bulkOps);
  }

  exam.resultsStatus = "Finalized";
  await exam.save();

  res.status(200).json({
    message: "Exam results finalized successfully.",
    count: finalResultDocs.length
  });
});

export const getFinalResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub }).lean();
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  const results = await FinalResult.find({ examId })
    .sort({ rollNumber: 1 })
    .lean();

  res.status(200).json({
    exam: { id: exam._id, title: exam.title, resultsStatus: exam.resultsStatus },
    results
  });
});

export const publishExamResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  if (exam.resultsStatus !== "Finalized") {
    return res.status(400).json({ message: "Results must be finalized before publishing." });
  }

  await FinalResult.updateMany({ examId }, { $set: { status: "Published", publishedAt: new Date() } });

  exam.resultsStatus = "Published";
  await exam.save();

  res.status(200).json({ message: "Exam results published successfully." });
});

export const overrideStudentScore = asyncHandler(async (req, res) => {
  const { examId, studentId, questionIndex, newScore, reason } = req.body;

  if (questionIndex === undefined || newScore === undefined || !reason) {
    return res.status(400).json({ message: "questionIndex, newScore, and reason are required." });
  }

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub });
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  if (exam.resultsStatus === "Published") {
    return res.status(400).json({ message: "Cannot override scores for published results." });
  }

  const finalResult = await FinalResult.findOne({ examId, studentId });
  if (!finalResult) {
    return res.status(404).json({ message: "Final result record not found." });
  }

  const questionResult = finalResult.questionResults.find(q => q.questionIndex === questionIndex);
  if (!questionResult) {
    return res.status(404).json({ message: "Question result not found for this student." });
  }

  const oldScore = questionResult.score;
  questionResult.score = Number(newScore);
  questionResult.manualAdjustment = Number(newScore) - questionResult.passedCases;
  questionResult.adjustmentNote = reason;

  // Recalculate totals
  finalResult.totalScore = finalResult.questionResults.reduce((sum, q) => sum + q.score, 0);
  finalResult.scorePercent = finalResult.totalPossible > 0 ? Math.round((finalResult.totalScore / finalResult.totalPossible) * 100) : 0;

  await finalResult.save();

  // Create audit entry
  await ResultAudit.create({
    finalResultId: finalResult._id,
    facultyId: req.user.sub,
    studentId,
    examId,
    questionIndex,
    oldScore,
    newScore,
    reason
  });

  res.status(200).json({ message: "Score overridden successfully.", finalResult });
});

export const downloadFinalResultsCsv = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub }).select("title resultsStatus").lean();
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  const results = await FinalResult.find({ examId }).sort({ rollNumber: 1 }).lean();

  if (results.length === 0) {
    return res.status(404).json({ message: "No final results available to download." });
  }

  const maxQuestions = Math.max(...results.map(r => r.questionResults.length), 0);

  let csv = "Roll Number,Student Name";
  for (let i = 0; i < maxQuestions; i++) {
    csv += `,Q${i + 1} Score,Q${i + 1} Max`;
  }
  csv += ",Total Score,Total Max,Percentage,Status,Finalized At\n";

  results.forEach(row => {
    csv += `"${row.rollNumber}","${row.studentName}"`;
    for (let i = 0; i < maxQuestions; i++) {
      const q = row.questionResults.find(qr => qr.questionIndex === i);
      csv += `,${q ? q.score : "-"},${q ? q.totalPossible : "-"}`;
    }
    csv += `,${row.totalScore},${row.totalPossible},${row.scorePercent}%,${row.status},${row.finalizedAt.toISOString()}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=final_results_${examId}.csv`);
  res.status(200).send(csv);
});

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

export const getExamResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const submissionType = String(req.query.submissionType || "private").toLowerCase();

  if (!["public", "private"].includes(submissionType)) {
    return res.status(400).json({ message: "submissionType must be 'public' or 'private'." });
  }

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub })
    .select("_id title")
    .lean();
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  const resultsCollection = mongoose.connection.collection("results");
  const rows = await resultsCollection
    .aggregate([
      {
        $match: {
          examId: examId.toString(),
          submissionType,
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            studentId: "$studentId",
            questionIndex: "$questionIndex",
            submissionType: "$submissionType",
          },
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
      {
        $project: {
          _id: 0,
          jobId: 1,
          studentId: 1,
          rollNumber: 1,
          questionIndex: 1,
          submissionType: 1,
          language: 1,
          executionTime: 1,
          timestamp: 1,
          error: 1,
          evaluation: 1,
        },
      },
      { $sort: { rollNumber: 1, questionIndex: 1 } },
    ])
    .toArray();

  const uniqueStudentIds = [...new Set(rows.map((row) => row.studentId).filter(Boolean))];
  const validStudentObjectIds = uniqueStudentIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const students = await Student.find({ _id: { $in: validStudentObjectIds } })
    .select("_id name rollNumber")
    .lean();
  const studentMap = new Map(students.map((student) => [student._id.toString(), student]));

  const normalizedRows = rows.map((row) => {
    const student = studentMap.get(String(row.studentId));
    const totalCases = row.evaluation?.totalCases || 0;
    const passedCases = row.evaluation?.passedCases || 0;
    const scorePercent = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;
    const allPassed = Boolean(row.evaluation?.allPassed);
    const failedCaseNumber = row.evaluation?.failedCaseNumber || null;

    let status = "Pending";
    if (row.error && !row.evaluation) {
      status = "Error";
    } else if (allPassed) {
      status = "Passed";
    } else if (totalCases > 0) {
      status = "Failed";
    }

    return {
      jobId: row.jobId,
      studentId: row.studentId,
      studentName: student?.name || "Unknown Student",
      rollNumber: row.rollNumber || student?.rollNumber || "-",
      questionIndex: row.questionIndex,
      submissionType: row.submissionType,
      language: row.language,
      executionTime: row.executionTime || 0,
      timestamp: row.timestamp,
      status,
      totalCases,
      passedCases,
      scorePercent,
      failedCaseNumber,
      error: row.error || "",
    };
  });

  res.status(200).json({
    exam: {
      id: exam._id,
      title: exam.title,
    },
    submissionType,
    count: normalizedRows.length,
    results: normalizedRows,
  });
});

export const getAggregatedExamResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const submissionType = String(req.query.submissionType || "private").toLowerCase();

  if (!["public", "private"].includes(submissionType)) {
    return res.status(400).json({ message: "submissionType must be 'public' or 'private'." });
  }

  const exam = await Exam.findOne({ _id: examId, facultyId: req.user.sub })
    .select("_id title")
    .lean();
  if (!exam) {
    return res.status(404).json({ message: "Exam not found for this faculty." });
  }

  const resultsCollection = mongoose.connection.collection("results");

  // Step 1: Get best score for each student per question
  const bestScores = await resultsCollection
    .aggregate([
      {
        $match: {
          examId: examId.toString(),
          submissionType,
        },
      },
      {
        $group: {
          _id: {
            studentId: "$studentId",
            questionIndex: "$questionIndex",
          },
          bestPassedCases: { $max: "$evaluation.passedCases" },
          totalCases: { $first: "$evaluation.totalCases" },
          doc: { $first: "$$ROOT" }, // Just to get other metadata if needed
        },
      },
      {
        $group: {
          _id: "$_id.studentId",
          rollNumber: { $first: "$doc.rollNumber" },
          questions: {
            $push: {
              questionIndex: "$_id.questionIndex",
              passedCases: "$bestPassedCases",
              totalCases: "$totalCases",
            },
          },
          totalPassed: { $sum: "$bestPassedCases" },
          totalPossible: { $sum: "$totalCases" },
        },
      },
    ])
    .toArray();

  const studentIds = bestScores.map((bs) => bs._id).filter(Boolean);
  const validStudentObjectIds = studentIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const [students, submissions] = await Promise.all([
    Student.find({ _id: { $in: validStudentObjectIds } }).select("_id name rollNumber").lean(),
    Submission.find({ examId, studentId: { $in: validStudentObjectIds } }).select("studentId isSubmitted submittedAt").lean(),
  ]);

  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));
  const submissionMap = new Map(submissions.map((s) => [s.studentId.toString(), s]));

  const questionPaper = await QuestionPaper.findOne({ examId }).lean();
  if (!questionPaper) {
    return res.status(404).json({ message: "Question paper not found for this exam." });
  }

  const summary = bestScores.map((bs) => {
    const sId = String(bs._id);
    const student = studentMap.get(sId);
    const submission = submissionMap.get(sId);

    // Map existing scores to their question indices
    const scoresByQuestion = new Map(bs.questions.map(q => [q.questionIndex, q]));

    // Build complete results for ALL questions in the paper
    const questions = questionPaper.questions.map((q, idx) => {
      const result = scoresByQuestion.get(idx);
      const totalPossibleForQ = submissionType === "private"
        ? (q.privateTestCases?.length || 0)
        : (q.publicTestCases?.length || 0);

      return {
        questionIndex: idx,
        passedCases: result ? result.passedCases : 0,
        totalCases: totalPossibleForQ,
      };
    });

    const totalPassed = questions.reduce((sum, q) => sum + q.passedCases, 0);
    const totalPossible = questions.reduce((sum, q) => sum + q.totalCases, 0);

    return {
      studentId: sId,
      studentName: student?.name || "Unknown Student",
      rollNumber: bs.rollNumber || student?.rollNumber || "-",
      questions,
      totalPassed,
      totalPossible,
      scorePercent: totalPossible > 0 ? Math.round((totalPassed / totalPossible) * 100) : 0,
      isFinalSubmitted: Boolean(submission?.isSubmitted),
      submittedAt: submission?.submittedAt || null,
    };
  });

  res.status(200).json({
    exam: {
      id: exam._id,
      title: exam.title,
    },
    submissionType,
    results: summary.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber)),
  });
});
