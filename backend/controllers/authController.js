import bcrypt from "bcrypt";
import { Faculty } from "../models/Faculty.js";
import { Student } from "../models/Student.js";
import { Exam } from "../models/Exam.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signFacultyToken, signStudentExamToken } from "../utils/token.js";

export const facultyLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const faculty = await Faculty.findOne({ email: email.toLowerCase().trim() });
  if (!faculty) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const isPasswordValid = await bcrypt.compare(password, faculty.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signFacultyToken(faculty);

  res.status(200).json({
    message: "Faculty login successful.",
    token,
    faculty: {
      id: faculty._id,
      name: faculty.name,
      email: faculty.email,
      role: faculty.role,
    },
  });
});

export const studentEnter = asyncHandler(async (req, res) => {
  const { rollNumber, name, branch, class: className, examId } = req.body;

  if (!rollNumber || !name || !branch || !className) {
    return res.status(400).json({
      message: "rollNumber, name, branch, and class are required.",
    });
  }

  const normalizedRoll = rollNumber.trim().toUpperCase();
  let student = await Student.findOne({ rollNumber: normalizedRoll });

  if (!student) {
    student = await Student.create({
      rollNumber: normalizedRoll,
      name: name.trim(),
      branch: branch.trim(),
      class: className.trim(),
    });
  }

  const now = new Date();
  const activeExams = await Exam.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  }).sort({ startTime: 1 });

  if (!activeExams.length) {
    return res
      .status(404)
      .json({ message: "No active exam is available right now." });
  }

  let selectedExam;
  if (examId) {
    selectedExam = activeExams.find(
      (exam) => exam._id.toString() === examId.toString()
    );
    if (!selectedExam) {
      return res.status(403).json({
        message: "Given examId is not active currently.",
      });
    }
  } else if (activeExams.length === 1) {
    selectedExam = activeExams[0];
  } else {
    return res.status(400).json({
      message:
        "Multiple active exams found. Please pass examId in /auth/student/enter.",
      exams: activeExams.map((exam) => ({
        id: exam._id,
        title: exam.title,
        startTime: exam.startTime,
        endTime: exam.endTime,
      })),
    });
  }

  const token = signStudentExamToken({
    studentId: student._id,
    examId: selectedExam._id,
    rollNumber: student.rollNumber,
  });

  res.status(200).json({
    message: "Student exam session token created.",
    token,
    student: {
      id: student._id,
      rollNumber: student.rollNumber,
      name: student.name,
      branch: student.branch,
      class: student.class,
    },
    exam: {
      id: selectedExam._id,
      title: selectedExam.title,
      startTime: selectedExam.startTime,
      endTime: selectedExam.endTime,
      duration: selectedExam.duration,
    },
  });
});
