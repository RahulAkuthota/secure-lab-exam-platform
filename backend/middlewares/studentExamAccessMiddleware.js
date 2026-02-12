export const requireStudentExamAccess = (req, res, next) => {
  const requestedExamId =
    req.body?.examId || req.params.examId || req.query.examId;

  if (!req.user?.examId) {
    return res.status(403).json({ message: "Exam scope missing in token." });
  }

  if (!requestedExamId) {
    req.body = req.body || {};
    req.body.examId = req.user.examId;
    return next();
  }

  if (req.user.examId.toString() !== requestedExamId.toString()) {
    return res
      .status(403)
      .json({ message: "Student token does not allow this exam." });
  }

  next();
};
