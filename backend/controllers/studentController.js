import { Exam } from "../models/Exam.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Submission } from "../models/Submission.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { enqueueSubmissionJob } from "../utils/redisQueue.js";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

const PUBLIC_RESULT_WAIT_MS = Number(process.env.PUBLIC_RESULT_WAIT_MS || 12000);
const PUBLIC_RESULT_POLL_MS = Number(process.env.PUBLIC_RESULT_POLL_MS || 300);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatEvaluationForStudent = (resultDoc) => {
  const evaluation = resultDoc?.evaluation || null;
  if (!evaluation) return null;

  if (resultDoc?.submissionType !== "private") {
    return evaluation;
  }

  return {
    totalCases: evaluation.totalCases || 0,
    passedCases: evaluation.passedCases || 0,
    allPassed: Boolean(evaluation.allPassed),
    failedCaseNumber: evaluation.failedCaseNumber || null,
    cases: Array.isArray(evaluation.cases)
      ? evaluation.cases.map((testCase) => ({
        caseNumber: testCase.caseNumber,
        passed: Boolean(testCase.passed),
        status: testCase.status,
        executionTime: testCase.executionTime || 0,
      }))
      : [],
  };
};

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

  const submissionRecord = await Submission.findOne({
    examId: effectiveExamId,
    studentId: req.user.sub,
  })
    .select("isSubmitted")
    .lean();

  if (submissionRecord?.isSubmitted) {
    return res.status(409).json({
      message: "Final exam submission is already completed. Further code submissions are blocked.",
    });
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

  const selectedQuestion = questionPaper.questions[questionIndex];
  const selectedTestCases =
    submissionType === "public"
      ? selectedQuestion?.publicTestCases
      : selectedQuestion?.privateTestCases;

  if (!Array.isArray(selectedTestCases) || selectedTestCases.length === 0) {
    return res.status(400).json({
      message: "No test cases are configured for the selected question.",
    });
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
    testCases: selectedTestCases.map((testCase) => ({
      input: testCase.input || "",
      expectedOutput: testCase.expectedOutput || "",
    })),
    queuedAt: new Date().toISOString(),
  };

  const queueInfo = await enqueueSubmissionJob(job);

  if (submissionType === "private") {
    return res.status(202).json({
      message: "Submission queued successfully.",
      jobId: job.jobId,
      queue: queueInfo.queue,
    });
  }

  const resultsCollection = mongoose.connection.collection("results");
  const deadline = Date.now() + PUBLIC_RESULT_WAIT_MS;
  let resultDoc = null;

  while (Date.now() < deadline) {
    resultDoc = await resultsCollection.findOne({ jobId: job.jobId });
    if (resultDoc) break;
    await sleep(PUBLIC_RESULT_POLL_MS);
  }

  if (!resultDoc) {
    return res.status(200).json({
      message: "Public tests queued. Result is still processing.",
      jobId: job.jobId,
      queue: queueInfo.queue,
      pending: true,
    });
  }

  res.status(200).json({
    message: "Public tests executed.",
    jobId: job.jobId,
    queue: queueInfo.queue,
    pending: false,
    result: {
      stdout: resultDoc.stdout || "",
      stderr: resultDoc.stderr || "",
      error: resultDoc.error || "",
      executionTime: resultDoc.executionTime || 0,
      evaluation: formatEvaluationForStudent(resultDoc),
    },
  });
});

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const logViolation = asyncHandler(async (req, res) => {
  const { examId, reason } = req.body;
  const studentId = req.user.sub;
  const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (!examId || !reason) {
    return res.status(400).json({ message: "examId and reason are required." });
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json({ message: "Exam not found." });
  }

  let submission = await Submission.findOne({ examId, studentId });

  if (!submission) {
    submission = await Submission.create({
      examId,
      studentId,
      isSubmitted: false,
      answers: [],
      violations: [],
    });
  }

  if (submission.isSubmitted) {
    return res.status(409).json({ message: "Exam already submitted." });
  }

  submission.violations.push({
    reason,
    timestamp: new Date(),
    ip: clientIp,
  });

  const violationCount = submission.violations.length;

  if (exam.autoSubmitOnViolation && violationCount >= exam.maxViolations) {
    submission.isSubmitted = true;
    submission.submittedAt = new Date();
  }

  await submission.save();

  res.status(200).json({
    message: "Violation logged.",
    violationCount,
    isSubmitted: submission.isSubmitted,
    maxViolations: exam.maxViolations,
  });
});

export const remoteInitialize = asyncHandler(async (req, res) => {
  // Respect X-Forwarded-For if present, otherwise use req.ip
  let studentIp = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress;

  // If X-Forwarded-For is a list, take the first one
  if (typeof studentIp === "string" && studentIp.includes(",")) {
    studentIp = studentIp.split(",")[0].trim();
  }

  // Strip IPv6 prefix if present (e.g., ::ffff:192.168.1.1)
  const cleanIp = studentIp.includes(":") ? studentIp.split(":").pop() : studentIp;

  const labUser = process.env.LAB_USER || "user";
  const labPass = process.env.LAB_PASS || "rahul7075";
  const localAppPath = process.env.LOCAL_APP_PATH || "/app/bin/secure-exam-browser.AppImage";
  const remoteAppPath = process.env.REMOTE_APP_PATH || "/tmp/secure-exam-browser.AppImage";

  console.log(`[RemoteLaunch] Request from ${studentIp} (Detected as: ${cleanIp})`);

  try {
    const checkFileCmd = `sshpass -p "${labPass}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${labUser}@${cleanIp} "[ -f ${remoteAppPath} ]"`;

    console.log(`[RemoteLaunch] Checking if app exists on ${cleanIp}...`);

    exec(checkFileCmd, (checkError) => {
      const launchRemote = () => {
        // Extract the server's URL from the request origin so the AppImage knows where to point
        const serverUrl = req.headers.origin || "http://192.168.40.131:4174";
        // We explicitly set XAUTHORITY so the SSH process has permission to open windows on the student's desktop
        const launchCmd = `sshpass -p "${labPass}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${labUser}@${cleanIp} "export XAUTHORITY=/home/${labUser}/.Xauthority && chmod +x ${remoteAppPath} && DISPLAY=:0 ${remoteAppPath} --no-sandbox --disable-gpu ${serverUrl} &"`;
        console.log(`[RemoteLaunch] Launching: ${launchCmd}`);
        exec(launchCmd, (launchErr, stdout, stderr) => {
          if (launchErr) {
            console.error(`[RemoteLaunch] Launch FAILED for ${cleanIp}:`, launchErr.message);
            if (stderr) console.error(`[RemoteLaunch] Stderr: ${stderr}`);
          } else {
            console.log(`[RemoteLaunch] Launch SUCCESS for ${cleanIp}`);
          }
        });
      };

      if (checkError) {
        // File does not exist, push it
        console.log(`[RemoteLaunch] App missing on ${cleanIp}. Pushing (SCP)...`);
        const scpCmd = `sshpass -p "${labPass}" scp -o StrictHostKeyChecking=no ${localAppPath} ${labUser}@${cleanIp}:${remoteAppPath}`;
        console.log(`[RemoteLaunch] Executing SCP: ${scpCmd}`);

        exec(scpCmd, (scpErr) => {
          if (scpErr) {
            console.error(`[RemoteLaunch] SCP FAILED for ${cleanIp}:`, scpErr.message);
          } else {
            console.log(`[RemoteLaunch] SCP SUCCESS for ${cleanIp}. Now launching...`);
            launchRemote();
          }
        });
      } else {
        // File exists, just launch
        console.log(`[RemoteLaunch] App found on ${cleanIp}. Launching directly.`);
        launchRemote();
      }
    });

    res.status(200).json({
      message: `Initialization signal sent to ${cleanIp}.`,
      ip: cleanIp
    });
  } catch (err) {
    console.error(`[RemoteLaunch] Unexpected error:`, err);
    res.status(500).json({ message: "Failed to trigger remote initialization." });
  }
});

export const getSubmissionResult = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const tokenExamId = req.user.examId;
  const effectiveExamId = req.query.examId || tokenExamId;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ message: "jobId is required." });
  }

  if (!effectiveExamId) {
    return res.status(400).json({ message: "examId is required." });
  }

  const resultsCollection = mongoose.connection.collection("results");
  const resultDoc = await resultsCollection.findOne({
    jobId: jobId.trim(),
    studentId: req.user.sub,
    examId: effectiveExamId.toString(),
  });

  if (!resultDoc) {
    return res.status(200).json({
      message: "Result is still processing.",
      jobId: jobId.trim(),
      pending: true,
    });
  }

  res.status(200).json({
    message: "Result available.",
    jobId: jobId.trim(),
    pending: false,
    result: {
      stdout: resultDoc.stdout || "",
      stderr: resultDoc.stderr || "",
      error: resultDoc.error || "",
      executionTime: resultDoc.executionTime || 0,
      evaluation: formatEvaluationForStudent(resultDoc),
    },
  });
});
