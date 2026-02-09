import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }
  return process.env.JWT_SECRET;
};

export const signFacultyToken = (faculty) => {
  return jwt.sign(
    {
      sub: faculty._id.toString(),
      role: "faculty",
      email: faculty.email,
    },
    getJwtSecret(),
    { expiresIn: process.env.FACULTY_JWT_EXPIRES || "8h" }
  );
};

export const signStudentExamToken = ({ studentId, examId, rollNumber }) => {
  return jwt.sign(
    {
      sub: studentId.toString(),
      role: "student",
      examId: examId.toString(),
      rollNumber,
    },
    getJwtSecret(),
    { expiresIn: process.env.STUDENT_JWT_EXPIRES || "30m" }
  );
};

export const verifyJwtToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
